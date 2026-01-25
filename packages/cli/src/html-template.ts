import { ReconciledGraph, AiAnalysisResult } from '@codepulse/core';

export function generateHtml(graph: ReconciledGraph, aiResult?: AiAnalysisResult): string {
    const safeGraph = JSON.stringify(graph).replace(/</g, '\\u003c');

    // Mermaid Definition (Same as before)
    let mermaidDef = "graph TD;\\n";
    mermaidDef += "  classDef verified fill:#2ecc71,stroke:#27ae60,color:white;\\n";
    mermaidDef += "  classDef zombie fill:#95a5a6,stroke:#7f8c8d,stroke-dasharray: 5 5,color:white;\\n";
    mermaidDef += "  classDef discovered fill:#3498db,stroke:#2980b9,color:white;\\n";
    mermaidDef += "  classDef error fill:#e74c3c,stroke:#c0392b,color:white;\\n";

    graph.nodes.forEach(node => {
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const nodeLabel = \`\${node.name}\\n(\${node.telemetry.executionCount})\`;
        
        let styleClass = 'zombie';
        if (node.status === 'verified') styleClass = 'verified';
        if (node.status === 'discovered') styleClass = 'discovered';
        if (node.status === 'error') styleClass = 'error';

        mermaidDef += \`  \${nodeId}("\${nodeLabel}"):::\${styleClass};\\n\`;

        node.telemetry.discoveredDependencies.forEach((dep, idx) => {
             const cleanDep = dep.replace(/[^a-zA-Z0-9]/g, '_');
             const depId = \`dep_\${nodeId}_\${idx}\`;
             mermaidDef += \`  \${depId}["\${dep}"]:::discovered;\\n\`;
             mermaidDef += \`  \${nodeId} --> \${depId};\\n\`;
        });
    });

    // AI Section HTML
    let aiHtml = '';
    if (aiResult) {
        aiHtml = \`
        <div class="card ai-summary">
            <h3>🤖 Architect's Assessment <span class="badge score">\${aiResult.score}/100</span></h3>
            <p>\${aiResult.summary}</p>
            <h4>Identified Risks:</h4>
            <ul>
                \${aiResult.risks.map(r => \`<li>\${r}</li>\`).join('')}
            </ul>
        </div>\`;
    }

    return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodePulse Living Dashboard</title>
    <style>
        :root { --bg: #1e1e1e; --text: #ecf0f1; --panel: #2d2d2d; --accent: #3498db; }
        body { margin: 0; font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); display: grid; grid-template-rows: 60px 1fr; height: 100vh; overflow: hidden; }
        header { background: var(--panel); display: flex; align-items: center; padding: 0 20px; border-bottom: 1px solid #444; justify-content: space-between; }
        h1 { font-size: 1.2rem; margin: 0; color: var(--accent); }
        .stats { display: flex; gap: 20px; font-size: 0.9rem; }
        .stat-item b { color: var(--accent); }
        
        main { display: grid; grid-template-columns: 1fr 350px; height: 100%; }
        #graph-container { overflow: auto; padding: 20px; background: #1a1a1a; display: flex; justify-content: center; align-items: flex-start; }
        aside { background: var(--panel); border-left: 1px solid #444; padding: 20px; overflow-y: auto; }
        
        .card { background: #333; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
        .card h3 { margin-top: 0; color: var(--accent); font-size: 1rem; display: flex; justify-content: space-between; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; border-bottom: 1px solid #444; padding-bottom: 4px; }
        
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .badge.verified { background: #2ecc71; color: #000; }
        .badge.zombie { background: #95a5a6; color: #000; }
        .badge.discovered { background: #3498db; color: #fff; }
        
        .ai-summary { border: 1px solid var(--accent); background: #263238; }
        .ai-summary h3 { color: #fff; }
        .badge.score { background: var(--accent); color: white; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body>
    <header>
        <h1>⚡ CodePulse Dashboard</h1>
        <div class="stats">
            <span class="stat-item">Verified: <b>\${graph.summary.verified}</b></span>
            <span class="stat-item">Zombies: <b>\${graph.summary.zombies}</b></span>
            <span class="stat-item">Discovered: <b>\${graph.summary.discovered}</b></span>
        </div>
    </header>
    <main>
        <div id="graph-container">
            <div class="mermaid">\${mermaidDef}</div>
        </div>
        <aside id="details-panel">
            \${aiHtml}
            <h2>System Details</h2>
            <p style="opacity: 0.7">Click on any block in the diagram to view detailed runtime metrics.</p>
             <div id="node-list"></div>
        </aside>
    </main>

    <script>
        const graphData = \${safeGraph};
        
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });

        const nodeListDiv = document.getElementById('node-list');
        let listHtml = "<h3>All Nodes</h3>";
        
        graphData.nodes.forEach(node => {
            listHtml += \`<div class="card">
                <h3>\${node.name} <span class="badge \${node.status}">\${node.status}</span></h3>
                <div class="metric"><span>Executions</span> <b>\${node.telemetry.executionCount}</b></div>
                <div class="metric"><span>Avg Duration</span> <b>\${node.telemetry.avgDurationMs}ms</b></div>
                \${node.telemetry.discoveredDependencies.length ? '<h4>Dependencies:</h4><ul>' + node.telemetry.discoveredDependencies.map(d => '<li>'+d+'</li>').join('') + '</ul>' : ''}
            </div>\`;
        });
        
        nodeListDiv.innerHTML = listHtml;

    </script>
</body>
</html>\`;
}
