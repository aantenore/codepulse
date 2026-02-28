import { describe, it } from 'node:test';
import assert from 'node:assert';
import { AdvancedFlowReconciler } from '../reconciler/AdvancedFlowReconciler';
import type { CodeGraph } from '../types';
import type { TraceSpan } from '../trace';

describe('AdvancedFlowReconciler', () => {
    it('marks nodes as potentially_dead when no traces match', () => {
        const graph: CodeGraph = {
            nodes: [
                { id: 'A.foo', name: 'A.foo', type: 'method', startLine: 1, endLine: 5, metadata: {} },
            ],
            edges: [],
        };
        const reconciler = new AdvancedFlowReconciler();
        const result = reconciler.reconcile(graph, []);
        assert.strictEqual(result.summary.totalNodes, 1);
        assert.strictEqual(result.summary.zombies, 1);
        assert.strictEqual(result.summary.verified, 0);
        assert.strictEqual(result.nodes[0].status, 'potentially_dead');
    });

    it('marks nodes as verified when trace name matches', () => {
        const graph: CodeGraph = {
            nodes: [
                { id: 'A.foo', name: 'A.foo', type: 'method', startLine: 1, endLine: 5, metadata: {} },
            ],
            edges: [],
        };
        const traces: TraceSpan[] = [{
            name: 'A.foo',
            startTimeUnixNano: '1000000000',
            endTimeUnixNano: '2000000000',
            traceId: 't',
            spanId: 's',
            kind: 2,
        }];
        const reconciler = new AdvancedFlowReconciler();
        const result = reconciler.reconcile(graph, traces);
        assert.strictEqual(result.summary.verified, 1);
        assert.strictEqual(result.summary.zombies, 0);
        assert.strictEqual(result.nodes[0].status, 'verified');
        assert.strictEqual(result.nodes[0].telemetry.executionCount, 1);
    });

    it('adds discovered nodes for spans not in static graph', () => {
        const graph: CodeGraph = { nodes: [], edges: [] };
        const traces: TraceSpan[] = [{
            name: 'Dynamic.handler',
            startTimeUnixNano: '0',
            endTimeUnixNano: '1000',
            traceId: 't',
            spanId: 's',
            kind: 2,
        }];
        const reconciler = new AdvancedFlowReconciler();
        const result = reconciler.reconcile(graph, traces);
        assert.strictEqual(result.summary.discovered, 1);
        assert.strictEqual(result.nodes[0].status, 'discovered');
        assert.strictEqual(result.nodes[0].name, 'Dynamic.handler');
    });
});
