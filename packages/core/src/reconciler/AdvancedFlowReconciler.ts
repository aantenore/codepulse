import { CodeGraph } from '../types';
import { TraceSpan } from '../FlowReconciler'; // Reusing TraceSpan interface
import { ReconciledGraph, ReconciledNode } from './types';

export class AdvancedFlowReconciler {
    public reconcile(staticGraph: CodeGraph, traces: TraceSpan[]): ReconciledGraph {
        const nodeMap = new Map<string, ReconciledNode>();

        // 1. Initialize from Static Graph (Potential Zombies)
        staticGraph.nodes.forEach(node => {
            const rNode: ReconciledNode = {
                ...node,
                status: 'potentially_dead', // Default to dead until proven alive
                telemetry: {
                    executionCount: 0,
                    avgDurationMs: 0,
                    discoveredDependencies: [],
                    errors: 0
                }
            };
            // Index by ID and Name for matching
            nodeMap.set(node.id, rNode);
            if (node.name) nodeMap.set(node.name, rNode);
        });

        // 2. Process Traces
        traces.forEach(span => {
            let node = nodeMap.get(span.name); // Try exact match first (OrderController.create)

            // If not found, it's a "Hidden Dependency" or Discoverd Node
            if (!node) {
                // Create a new "Discovered" node
                node = {
                    id: span.name,
                    name: span.name,
                    type: span.kind === 2 ? 'method' : 'unknown', // Kind 2 is Server usually, approx method
                    startLine: 0,
                    endLine: 0,
                    status: 'discovered',
                    telemetry: {
                        executionCount: 0,
                        avgDurationMs: 0,
                        discoveredDependencies: [],
                        errors: 0
                    }
                };
                nodeMap.set(span.name, node);
            } else {
                // It matches static code, so mark it verified
                if (node.status === 'potentially_dead') {
                    node.status = 'verified';
                }
            }

            // Update Telemetry
            node.telemetry.executionCount++;
            node.telemetry.lastSeen = new Date(Number(BigInt(span.endTimeUnixNano) / BigInt(1000000))).toISOString();

            const duration = (BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano)) / BigInt(1000000);
            const count = node.telemetry.executionCount;
            const currentAvg = node.telemetry.avgDurationMs;
            node.telemetry.avgDurationMs = Math.round(((currentAvg * (count - 1)) + Number(duration)) / count);

            // Check for errors (status code or event)
            if (span.events?.some(e => e.name === 'exception')) {
                node.status = 'error';
                node.telemetry.errors++;
            }

            // Extract Dependencies from Events
            if (span.events) {
                span.events.forEach(e => {
                    if (e.name === 'db_call' || e.name === 'external_api_call') {
                        const detail = e.attributes?.find(a => ['db.statement', 'api.operation'].includes(a.key))?.value.stringValue || 'unknown';
                        const depKey = `${e.name}:${detail}`;
                        if (!node!.telemetry.discoveredDependencies.includes(depKey)) {
                            node!.telemetry.discoveredDependencies.push(depKey);
                        }
                    }
                });
            }
        });

        const allNodes = Array.from(nodeMap.values());
        // Deduplicate by ID (since we double-indexed)
        const uniqueNodes = Array.from(new Map(allNodes.map(n => [n.id, n])).values());

        return {
            nodes: uniqueNodes,
            summary: {
                totalNodes: uniqueNodes.length,
                verified: uniqueNodes.filter(n => n.status === 'verified').length,
                zombies: uniqueNodes.filter(n => n.status === 'potentially_dead').length,
                discovered: uniqueNodes.filter(n => n.status === 'discovered').length
            }
        };
    }
}
