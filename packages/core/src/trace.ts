/**
 * Trace span shape compatible with OTLP JSON export.
 * Used by reconcilers to merge static graph with runtime data.
 */
export interface TraceSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: number;
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes?: { key: string; value: { stringValue?: string; intValue?: number } }[];
    events?: { name: string; attributes?: { key: string; value: { stringValue: string } }[] }[];
}
