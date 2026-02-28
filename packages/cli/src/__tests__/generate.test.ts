import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { parseTraceFile, validateGenerateOptions } from '../commands/generate';

describe('parseTraceFile', () => {
    it('returns empty array for empty content', () => {
        assert.deepStrictEqual(parseTraceFile(''), []);
    });

    it('parses single span JSON line', () => {
        const line = JSON.stringify({
            name: 'Test.method',
            startTimeUnixNano: '1000000000',
            endTimeUnixNano: '2000000000',
            traceId: 't1',
            spanId: 's1',
            kind: 2,
        });
        const spans = parseTraceFile(line);
        assert.strictEqual(spans.length, 1);
        assert.strictEqual(spans[0].name, 'Test.method');
        assert.strictEqual(spans[0].startTimeUnixNano, '1000000000');
        assert.strictEqual(spans[0].endTimeUnixNano, '2000000000');
    });

    it('normalizes numeric nano times to strings', () => {
        const line = JSON.stringify({
            name: 'X',
            startTimeUnixNano: 1000,
            endTimeUnixNano: 2000,
            traceId: 't',
            spanId: 's',
            kind: 1,
        });
        const spans = parseTraceFile(line);
        assert.strictEqual(typeof spans[0].startTimeUnixNano, 'string');
        assert.strictEqual(typeof spans[0].endTimeUnixNano, 'string');
    });

    it('flattens OTLP resourceSpans structure', () => {
        const line = JSON.stringify({
            resourceSpans: [{
                resource: { attributes: [] },
                scopeSpans: [{
                    spans: [{
                        name: 'Otlp.span',
                        startTimeUnixNano: '0',
                        endTimeUnixNano: '1000',
                        traceId: 't',
                        spanId: 's',
                        kind: 2,
                    }],
                }],
            }],
        });
        const spans = parseTraceFile(line);
        assert.strictEqual(spans.length, 1);
        assert.strictEqual(spans[0].name, 'Otlp.span');
    });
});

describe('validateGenerateOptions', () => {
    it('throws when source does not exist', () => {
        assert.throws(() => validateGenerateOptions({
            source: path.join(os.tmpdir(), 'nonexistent-codepulse-validate-' + Date.now()),
            traces: __filename,
            output: 'out.html',
        }), /Source path does not exist/);
    });

    it('throws when source is not a directory', () => {
        assert.throws(() => validateGenerateOptions({
            source: __filename,
            traces: __filename,
            output: 'out.html',
        }), /must be a directory/);
    });

    it('throws when traces file does not exist', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codepulse-'));
        try {
            assert.throws(() => validateGenerateOptions({
                source: dir,
                traces: path.join(dir, 'no-trace.json'),
                output: 'out.html',
            }), /Trace file does not exist/);
        } finally {
            fs.rmdirSync(dir);
        }
    });

    it('returns resolved paths when valid', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codepulse-'));
        const traceFile = path.join(dir, 'trace.json');
        fs.writeFileSync(traceFile, '{}');
        try {
            const out = validateGenerateOptions({
                source: dir,
                traces: traceFile,
                output: 'report.html',
            });
            assert.strictEqual(out.source, path.resolve(dir));
            assert.strictEqual(out.traces, path.resolve(traceFile));
            assert.ok(out.output.endsWith('report.html') || path.isAbsolute(out.output));
        } finally {
            fs.unlinkSync(traceFile);
            fs.rmdirSync(dir);
        }
    });
});
