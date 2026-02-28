import { ReconciledGraph, AiAnalysisResult } from '@codepulse/core';
import type { ReconciledNode } from '@codepulse/core';

/** Escape HTML to prevent XSS when interpolating AI or user content. */
function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Sanitize a label for Mermaid (avoid breaking syntax with quotes). */
function mermaidLabel(text: string): string {
    return text.replace(/"/g, "'").replace(/[\n\r]/g, ' ');
}

const MERMAID_STATUS_STYLES: Record<string, string> = {
    verified: 'fill:#22c55e,stroke:#16a34a,color:#052e16',
    zombie: 'fill:#f59e0b,stroke:#d97706,color:#1c1917,stroke-dasharray: 5 5',
    discovered: 'fill:#8b5cf6,stroke:#6d28d9,color:#fafafa',
    error: 'fill:#ef4444,stroke:#b91c1c,color:#fafafa',
};

function buildMermaidDef(graph: ReconciledGraph): string {
    let def = "graph TD\n";
    def += "  classDef verified fill:#22c55e,stroke:#16a34a,color:#052e16\n";
    def += "  classDef zombie fill:#f59e0b,stroke:#d97706,color:#1c1917,stroke-dasharray: 5 5\n";
    def += "  classDef discovered fill:#8b5cf6,stroke:#6d28d9,color:#fafafa\n";
    def += "  classDef error fill:#ef4444,stroke:#b91c1c,color:#fafafa\n";

    const styleLines: string[] = [];
    graph.nodes.forEach((node) => {
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const label = mermaidLabel(`${node.name}<br/>(${node.telemetry.executionCount})`);
        const status = node.status === 'verified' ? 'verified' : node.status === 'discovered' ? 'discovered' : node.status === 'error' ? 'error' : 'zombie';
        def += `  ${nodeId}["${label}"]:::${status}\n`;
        styleLines.push(`  style ${nodeId} ${MERMAID_STATUS_STYLES[status]}`);

        node.telemetry.discoveredDependencies.forEach((dep, idx) => {
            const depId = `dep_${nodeId}_${idx}`;
            let depLabel = dep.replace('API: ', '').replace('DB: ', '').replace('external_api_call:', '');
            if (depLabel.includes('Caller:')) {
                depLabel = depLabel.replace('Caller: ', '');
                def += `  ${depId}["${mermaidLabel(depLabel)}"]:::discovered;\n  ${depId} --> ${nodeId};\n`;
            } else {
                def += `  ${depId}["${mermaidLabel(depLabel)}"]:::discovered;\n  ${nodeId} --> ${depId};\n`;
            }
            styleLines.push(`  style ${depId} ${MERMAID_STATUS_STYLES.discovered}`);
        });
    });

    graph.edges.forEach((edge) => {
        const sourceId = edge.sourceId.replace(/[^a-zA-Z0-9]/g, '_');
        const targetId = edge.targetId.replace(/[^a-zA-Z0-9]/g, '_');
        def += `  ${sourceId} -.->|${edge.type}| ${targetId}\n`;
    });

    if (styleLines.length > 0) def += '\n' + styleLines.join('\n');
    return def.trim();
}

function renderNodeListHtml(nodes: ReconciledNode[]): string {
    let html = '';
    for (const node of nodes) {
        const badgeLabel = node.status === 'potentially_dead' ? 'zombie' : node.status;
        const deps = node.telemetry.discoveredDependencies;
        const depsHtml = deps.length
            ? `<h4 class="text-sm font-medium">Dependencies</h4><ul>${deps.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
            : '';
        html += `<div class="card node-card" data-status="${escapeHtml(node.status)}">
            <h3 class="card-title">${escapeHtml(node.name)} <span class="badge ${escapeHtml(badgeLabel)}">${escapeHtml(badgeLabel)}</span></h3>
            <div class="metric"><span>Executions</span> <b>${node.telemetry.executionCount}</b></div>
            <div class="metric"><span>Avg Duration</span> <b>${node.telemetry.avgDurationMs}ms</b></div>
            ${depsHtml}
        </div>`;
    }
    return html;
}

const DASHBOARD_STYLES = `
        * { box-sizing: border-box; }
        :root {
            --radius: 0.625rem;
            --background: oklch(0.145 0 0);
            --foreground: oklch(0.985 0 0);
            --card: oklch(0.205 0 0);
            --card-foreground: oklch(0.985 0 0);
            --muted: oklch(0.269 0 0);
            --muted-foreground: oklch(0.708 0 0);
            --border: oklch(1 0 0 / 10%);
            --input: oklch(1 0 0 / 15%);
            --destructive: oklch(0.704 0.191 22.216);
            --destructive-foreground: oklch(0.985 0 0);
            --chart-1: oklch(0.488 0.243 264.376);
            --chart-2: oklch(0.696 0.17 162.48);
            --sidebar: oklch(0.205 0 0);
            --sidebar-foreground: oklch(0.985 0 0);
            --sidebar-border: oklch(1 0 0 / 10%);
            --success-foreground: oklch(0.15 0.02 162);
        }
        body { margin: 0; font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; background: var(--background); color: var(--foreground); font-size: 0.875rem; line-height: 1.5; display: grid; grid-template-rows: auto auto 1fr; height: 100vh; overflow: hidden; }
        header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0 1.5rem; min-height: 3.5rem; border-bottom: 1px solid var(--border); background: var(--card); }
        header h1 { font-size: 1rem; font-weight: 600; margin: 0; letter-spacing: -0.025em; }
        .stats { display: flex; align-items: center; gap: 1.5rem; }
        .stat-item { color: var(--muted-foreground); font-size: 0.8125rem; }
        .stat-item b { color: var(--foreground); font-weight: 600; }
        .legend { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; padding: 0 1.5rem; min-height: 2.25rem; border-bottom: 1px solid var(--border); background: var(--card); font-size: 0.75rem; color: var(--muted-foreground); }
        .legend-item { display: flex; align-items: center; gap: 0.35rem; }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
        .legend-dot.verified { background: #22c55e; }
        .legend-dot.zombie { background: #f59e0b; }
        .legend-dot.discovered { background: var(--chart-1); }
        .legend-dot.error { background: var(--destructive); }
        main { display: block; height: 100%; position: relative; }
        #graph-container { height: 100%; margin-right: 380px; overflow: hidden; padding: 0; background: var(--background); display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
        #zoom-controls { position: absolute; bottom: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 0.25rem; z-index: 20; }
        #zoom-controls button { width: 36px; height: 36px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); color: var(--foreground); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.125rem; font-weight: 600; line-height: 1; transition: background 0.15s, border-color 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        #zoom-controls button:hover { background: var(--input); border-color: var(--input); }
        #zoom-controls button:active { transform: scale(0.97); }
        #zoom-controls button.zoom-reset { font-size: 0.75rem; font-weight: 500; }
        .mermaid { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
        .graph-loading { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; color: var(--muted-foreground); font-size: 0.875rem; }
        .graph-loading::before { content: ''; width: 24px; height: 24px; border: 2px solid var(--border); border-top-color: var(--chart-1); border-radius: 50%; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        aside { position: fixed; right: 0; top: 5.75rem; bottom: 0; width: 380px; background: var(--sidebar); border-left: 1px solid var(--sidebar-border); padding: 1.25rem; overflow-y: auto; z-index: 10; }
        .card { background: var(--card); color: var(--card-foreground); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; margin-bottom: 1rem; transition: border-color 0.15s; }
        .card:hover { border-color: var(--input); }
        .card-title { font-size: 0.875rem; font-weight: 600; margin: 0 0 0.5rem 0; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
        .card h4 { font-size: 0.8125rem; font-weight: 500; margin: 0 0 0.25rem 0; }
        .text-muted-foreground { color: var(--muted-foreground); }
        .text-sm { font-size: 0.8125rem; }
        .font-medium { font-weight: 500; }
        .mt-3 { margin-top: 0.75rem; }
        .mb-1 { margin-bottom: 0.25rem; }
        .pl-4 { padding-left: 1rem; }
        .list-disc { list-style-type: disc; }
        .metric { display: flex; justify-content: space-between; align-items: center; padding: 0.375rem 0; font-size: 0.8125rem; border-bottom: 1px solid var(--border); }
        .metric:last-child { border-bottom: none; }
        .metric span { color: var(--muted-foreground); }
        .badge { display: inline-flex; align-items: center; padding: 0.125rem 0.5rem; font-size: 0.6875rem; font-weight: 600; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge.verified { background: var(--chart-2); color: var(--success-foreground); }
        .badge.zombie { background: #f59e0b; color: #1c1917; }
        .badge.discovered { background: var(--chart-1); color: oklch(0.985 0 0); }
        .badge.error { background: var(--destructive); color: var(--destructive-foreground); }
        .badge.score { background: var(--chart-1); color: white; }
        .ai-summary { background: linear-gradient(135deg, oklch(0.488 0.243 264.376 / 0.25) 0%, oklch(0.269 0 0) 100%); border-color: oklch(0.488 0.243 264.376 / 0.4); }
        .ai-summary .card-title { color: var(--foreground); }
        h2 { font-size: 0.9375rem; font-weight: 600; margin: 1.5rem 0 0.75rem 0; }
        .subtitle { font-size: 0.75rem; color: var(--muted-foreground); margin-top: 0.15rem; font-weight: 400; }
        .filter-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.75rem; }
        .filter-btn { padding: 0.25rem 0.6rem; font-size: 0.6875rem; font-weight: 600; border-radius: var(--radius); border: 1px solid var(--border); background: var(--card); color: var(--muted-foreground); cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .filter-btn:hover { border-color: var(--input); color: var(--foreground); }
        .filter-btn.active { background: var(--chart-1); border-color: var(--chart-1); color: white; }
        .node-card--hidden { display: none; }
        .empty-filter { padding: 1rem; text-align: center; color: var(--muted-foreground); font-size: 0.8125rem; }
        #node-list ul { padding-left: 1rem; margin: 0.25rem 0 0 0; }
        #node-list li { margin-bottom: 0.25rem; font-size: 0.8125rem; color: var(--muted-foreground); }
`;

export function generateHtml(graph: ReconciledGraph, aiResult?: AiAnalysisResult): string {
    const safeGraph = JSON.stringify(graph).replace(/</g, '\\u003c');
    const mermaidDef = buildMermaidDef(graph);
    const nodeListHtml = renderNodeListHtml(graph.nodes);

    let aiHtml = '';
    if (aiResult) {
        aiHtml = `
        <div class="card ai-summary">
            <h3 class="card-title">Architect's Assessment <span class="badge badge-score">${escapeHtml(String(aiResult.score))}/100</span></h3>
            <p class="text-muted-foreground">${escapeHtml(aiResult.summary)}</p>
            <h4 class="text-sm font-medium mt-3 mb-1">Identified Risks</h4>
            <ul class="list-disc pl-4 space-y-1 text-muted-foreground text-sm">
                ${aiResult.risks.map((r) => `<li>${escapeHtml(r)}</li>`).join('')}
            </ul>
        </div>`;
    }

    const loadingHtml = '<div class="graph-loading" id="graph-loading">Rendering graph…</div>';

    return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodePulse Living Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>${DASHBOARD_STYLES}</style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
</head>
<body>
    <header>
        <div>
            <h1>CodePulse Dashboard</h1>
            <p class="subtitle">Static code vs runtime traces — see what is actually used.</p>
        </div>
        <div class="stats">
            <span class="stat-item">Verified <b>${graph.summary.verified}</b></span>
            <span class="stat-item">Zombies <b>${graph.summary.zombies}</b></span>
            <span class="stat-item">Discovered <b>${graph.summary.discovered}</b></span>
        </div>
    </header>
    <nav class="legend" aria-label="Status legend">
        <span class="legend-item"><span class="legend-dot verified" aria-hidden="true"></span> Verified</span>
        <span class="legend-item"><span class="legend-dot zombie" aria-hidden="true"></span> Zombie</span>
        <span class="legend-item"><span class="legend-dot discovered" aria-hidden="true"></span> Discovered</span>
        <span class="legend-item"><span class="legend-dot error" aria-hidden="true"></span> Error</span>
    </nav>
    <main>
        <div id="graph-container">
            <div id="mermaid-render-target" class="mermaid">${loadingHtml}</div>
            <div id="zoom-controls" aria-label="Zoom" style="display: none;">
                <button type="button" id="zoom-in" title="Zoom in">+</button>
                <button type="button" id="zoom-reset" class="zoom-reset" title="Reset view">1:1</button>
                <button type="button" id="zoom-out" title="Zoom out">−</button>
            </div>
        </div>
        <aside id="details-panel">
            ${aiHtml}
            <h2>Nodes &amp; metrics</h2>
            <p class="text-muted-foreground text-sm">Pan and zoom the diagram. Filter the list by status to focus on zombies or verified code.</p>
            <div class="filter-row" role="group" aria-label="Filter by status">
                <button type="button" class="filter-btn active" data-filter="all">All</button>
                <button type="button" class="filter-btn" data-filter="verified">Verified</button>
                <button type="button" class="filter-btn" data-filter="potentially_dead">Zombies</button>
                <button type="button" class="filter-btn" data-filter="discovered">Discovered</button>
                <button type="button" class="filter-btn" data-filter="error">Error</button>
            </div>
            <div id="node-list">${nodeListHtml}</div>
            <p id="filter-empty" class="empty-filter node-card--hidden" aria-live="polite">No nodes with this status.</p>
        </aside>
    </main>

    <script>
        const mermaidSource = ${JSON.stringify(mermaidDef)};

        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

        (async function renderGraph() {
            const target = document.getElementById('mermaid-render-target');
            try {
                const { svg } = await mermaid.render('mermaid-svg-internal', mermaidSource);
                target.innerHTML = svg;
                var svgEl = target.querySelector('svg');
                if (svgEl) {
                    svgEl.setAttribute('width', '100%');
                    svgEl.setAttribute('height', '100%');
                    svgEl.style.maxWidth = 'none';
                    setTimeout(function() {
                        var pz = svgPanZoom(svgEl, { zoomEnabled: true, controlIconsEnabled: false, fit: true, center: true, minZoom: 0.1, maxZoom: 10 });
                        pz.resize();
                        pz.fit();
                        pz.center();
                        var zoomControls = document.getElementById('zoom-controls');
                        if (zoomControls) {
                            zoomControls.style.display = 'flex';
                            document.getElementById('zoom-in').addEventListener('click', function() { pz.zoomIn(); });
                            document.getElementById('zoom-reset').addEventListener('click', function() { pz.reset(); pz.resize(); pz.fit(); pz.center(); });
                            document.getElementById('zoom-out').addEventListener('click', function() { pz.zoomOut(); });
                        }
                    }, 300);
                }
            } catch (e) {
                console.error('Mermaid render error', e);
                var errMsg = (e && e.message) ? String(e.message) : String(e);
                var errDiv = document.createElement('div');
                errDiv.className = 'graph-loading';
                errDiv.style.color = 'var(--destructive)';
                errDiv.textContent = 'Render failed: ' + errMsg;
                target.innerHTML = '';
                target.appendChild(errDiv);
            }
        })();

        (function setupFilters() {
            var filterBtns = document.querySelectorAll('.filter-btn');
            var nodeList = document.getElementById('node-list');
            var emptyEl = document.getElementById('filter-empty');
            if (!nodeList || !emptyEl) return;

            function applyFilter(filter) {
                var cards = nodeList.querySelectorAll('.node-card');
                var visible = 0;
                cards.forEach(function(card) {
                    var status = card.getAttribute('data-status') || '';
                    var show = filter === 'all' || status === filter;
                    card.classList.toggle('node-card--hidden', !show);
                    if (show) visible++;
                });
                emptyEl.classList.toggle('node-card--hidden', visible > 0);
                filterBtns.forEach(function(btn) {
                    btn.classList.toggle('active', btn.getAttribute('data-filter') === filter);
                });
            }

            filterBtns.forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var filter = btn.getAttribute('data-filter') || 'all';
                    applyFilter(filter);
                });
            });
        })();
    </script>
</body>
</html>`;
}
