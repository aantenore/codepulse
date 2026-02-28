import { CodeGraph, CodeNode } from './types';
import type { TraceSpan } from './trace';

export type { TraceSpan };

export interface ReconciledNode extends CodeNode {
    telemetry?: {
        executionCount: number;
        avgDurationMs: number;
        discoveredDependencies: string[];
        lastVerified: string;
    };
}

export class FlowReconciler {
    public reconcile(staticGraph: CodeGraph, traces: TraceSpan[]): ReconciledNode[] {
        const reconciledNodes: ReconciledNode[] = JSON.parse(JSON.stringify(staticGraph.nodes));
        const nodeMap = new Map<string, ReconciledNode>();

        // Index nodes by name (Simple heuristic: Class.Method)
        // In a real system, we'd need robust ID matching.
        reconciledNodes.forEach(node => {
            if (node.type === 'method') {
                // Assuming Metadata contains className, or constructing ID as Class.Method
                // For MVP, our static parser didn't fully populate parent-child IDs perfectly, 
                // so we rely on the span name matching pattern "Class.Method"
                // Our instrumenter produces "ClassName.MethodName" as span name.
                nodeMap.set(node.name, node);
                // Also try ID if it matches
                nodeMap.set(node.id, node);
            }
        });

        traces.forEach(span => {
            const spanName = span.name; // e.g., "OrderController.create"

            let targetNode = nodeMap.get(spanName);
            if (!targetNode) {
                // Try to find by partial match if strictly needed, or just log
                // For MVP, we assume exact match from instrumenter
                return;
            }

            if (!targetNode.telemetry) {
                targetNode.telemetry = {
                    executionCount: 0,
                    avgDurationMs: 0,
                    discoveredDependencies: [],
                    lastVerified: new Date().toISOString()
                };
            }

            // Update Metrics
            targetNode.telemetry.executionCount++;
            const duration = (BigInt(span.endTimeUnixNano) - BigInt(span.startTimeUnixNano)) / BigInt(1000000);
            // Moving average (simplistic)
            const count = targetNode.telemetry.executionCount;
            const currentAvg = targetNode.telemetry.avgDurationMs;
            targetNode.telemetry.avgDurationMs = Math.round(((currentAvg * (count - 1)) + Number(duration)) / count);

            // Discover Dependencies from Events
            if (span.events) {
                span.events.forEach(event => {
                    if (event.name === 'db_call') {
                        const stmt = event.attributes?.find(a => a.key === 'db.statement')?.value.stringValue || 'Unknown DB';
                        if (!targetNode?.telemetry?.discoveredDependencies.includes(`DB: ${stmt}`)) {
                            targetNode?.telemetry?.discoveredDependencies.push(`DB: ${stmt}`);
                        }
                    } else if (event.name === 'external_api_call') {
                        const op = event.attributes?.find(a => a.key === 'api.operation')?.value.stringValue || 'Unknown API';
                        if (!targetNode?.telemetry?.discoveredDependencies.includes(`API: ${op}`)) {
                            targetNode?.telemetry?.discoveredDependencies.push(`API: ${op}`);
                        }
                    }
                });
            }
        });

        return reconciledNodes;
    }
}
