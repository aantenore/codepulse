import { ReconciledGraph } from '@codepulse/core';

export function generateHtml(graph: ReconciledGraph): string {
    const safeData = JSON.stringify(graph).replace(/</g, '\\u003c');

    // Generate Mermaid Diagram Definition
    let mermaidDef = "graph TD;\\n";
    mermaidDef += "  classDef verified fill:#2ecc71,stroke:#27ae60,color:white;\\n";
    mermaidDef += "  classDef zombie fill:#95a5a6,stroke:#7f8c8d,stroke-dasharray: 5 5,color:white;\\n";
    mermaidDef += "  classDef discovered fill:#3498db,stroke:#2980b9,color:white;\\n";
    mermaidDef += "  classDef error fill:#e74c3c,stroke:#c0392b,color:white;\\n";

    graph.nodes.forEach(node => {
        // Sanitize IDs
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const nodeLabel = \`\${node.name}\\n(\${node.telemetry.executionCount})\`;
        
        let styleClass = 'zombie';
        if (node.status === 'verified') styleClass = 'verified';
        if (node.status === 'discovered') styleClass = 'discovered';
        if (node.status === 'error') styleClass = 'error';

        mermaidDef += \`  \${nodeId}("\${nodeLabel}"):::\${styleClass};\\n\`;

        // Dependencies
        node.telemetry.discoveredDependencies.forEach((dep, idx) => {
             const cleanDep = dep.replace(/[^a-zA-Z0-9]/g, '_');
             const depId = \`dep_\${nodeId}_\${idx}\`;
             mermaidDef += \`  \${depId}["\${dep}"]:::discovered;\\n\`;
             mermaidDef += \`  \${nodeId} --> \${depId};\\n\`;
        });
    });

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
        .card h3 { margin-top: 0; color: var(--accent); font-size: 1rem; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; border-bottom: 1px solid #444; padding-bottom: 4px; }
        
        .badge { padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        .badge.verified { background: #2ecc71; color: #000; }
        .badge.zombie { background: #95a5a6; color: #000; }
        .badge.discovered { background: #3498db; color: #fff; }
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
            <h2>Select a Node</h2>
            <p style="opacity: 0.7">Click on any block in the diagram to view detailed runtime metrics.</p>
        </aside>
    </main>

    <script>
        const graphData = \${safeData};
        
        mermaid.initialize({ startOnLoad: true, theme: 'dark' });

        // Trivial Interaction Mock (Since Mermaid renders SVG, we'd need D3 or click binding on SVG elements)
        // For MVP, we just dump the Raw Object in the console for debug
        console.log("Graph Data Loaded", graphData);

        // A truly interactive version requires binding click events to Mermaid generated nodes
        // This is complex for a single file static HTML without D3 logic.
        // Instead, we will populate the side panel with a summary list for now.
        
        const aside = document.getElementById('details-panel');
        let listHtml = "<h3>All Nodes</h3>";
        
        graphData.nodes.forEach(node => {
            listHtml += \`<div class="card">
                <h3>\${node.name} <span class="badge \${node.status}">\${node.status}</span></h3>
                <div class="metric"><span>Executions</span> <b>\${node.telemetry.executionCount}</b></div>
                <div class="metric"><span>Avg Duration</span> <b>\${node.telemetry.avgDurationMs}ms</b></div>
                \${node.telemetry.discoveredDependencies.length ? '<h4>Dependencies:</h4><ul>' + node.telemetry.discoveredDependencies.map(d => '<li>'+d+'</li>').join('') + '</ul>' : ''}
            </div>\`;
        });
        
        aside.innerHTML = listHtml;

    </script>
</body>
</html>\`;
}
