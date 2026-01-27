import { CodeGraph } from '../types';
import { TraceSpan } from '../FlowReconciler';
import { ReconciledGraph, ReconciledNode } from './types';

export class AdvancedFlowReconciler {
    public reconcile(staticGraph: CodeGraph, traces: TraceSpan[]): ReconciledGraph {
        const nodeMap = new Map<string, ReconciledNode>();
        const routeMap = new Map<string, ReconciledNode>();

        // 1. Initialize from Static Graph
        staticGraph.nodes.forEach(node => {
            const rNode: ReconciledNode = {
                ...node,
                status: 'potentially_dead',
                telemetry: {
                    executionCount: 0,
                    avgDurationMs: 0,
                    discoveredDependencies: [],
                    errors: 0
                }
            };

            nodeMap.set(node.id, rNode);
            if (node.name) nodeMap.set(node.name, rNode);

            // Index by Route if available
            if (node.metadata?.route) {
                const method = node.metadata.httpMethod || '';
                const routeKey = `${method} ${node.metadata.route}`.trim();
                routeMap.set(routeKey, rNode);
                // Also index by route alone for fallback
                if (!routeMap.has(node.metadata.route)) {
                    routeMap.set(node.metadata.route, rNode);
                }
            }
        });

        // 2. Process Traces
        traces.forEach(span => {
            // A. Try exact match on name
            let node = nodeMap.get(span.name);

            // B. Try match by HTTP Route Attribute
            if (!node) {
                const routeAttr = span.attributes?.find(a => a.key === 'http.route')?.value.stringValue ||
                    span.attributes?.find(a => a.key === 'url.path')?.value.stringValue;
                const methodAttr = span.attributes?.find(a => a.key === 'http.request.method')?.value.stringValue;

                if (routeAttr) {
                    const lookupKey = methodAttr ? `${methodAttr} ${routeAttr}` : routeAttr;
                    node = routeMap.get(lookupKey) || routeMap.get(routeAttr);
                }
            }

            // C. If still not found, it's a "Discovered" node
            if (!node) {
                node = {
                    id: span.name,
                    name: span.name,
                    type: span.kind === 2 ? 'method' : 'unknown',
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
                if (node.status === 'potentially_dead') {
                    node.status = 'verified';
                }
            }

            // Update Telemetry
            if (node.telemetry) {
                node.telemetry.executionCount++;
                node.telemetry.lastSeen = new Date(Number(BigInt(span.endTimeUnixNano) / BigInt(1000000))).toISOString();

                const duration = (BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano)) / BigInt(1000000);
                const count = node.telemetry.executionCount;
                const currentAvg = node.telemetry.avgDurationMs;
                node.telemetry.avgDurationMs = Math.round(((currentAvg * (count - 1)) + Number(duration)) / count);

                if (span.events?.some(e => e.name === 'exception')) {
                    node.status = 'error';
                    node.telemetry.errors++;
                }

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
            }
        });

        const allNodes = Array.from(nodeMap.values());
        const uniqueNodes = Array.from(new Map(allNodes.map(n => [n.id, n])).values());

        return {
            nodes: uniqueNodes,
            edges: staticGraph.edges,
            summary: {
                totalNodes: uniqueNodes.length,
                verified: uniqueNodes.filter(n => n.status === 'verified' || n.status === 'error').length,
                zombies: uniqueNodes.filter(n => n.status === 'potentially_dead').length,
                discovered: uniqueNodes.filter(n => n.status === 'discovered').length
            }
        };
    }
}

