import { ReconciledGraph } from '@codepulse/core';
import { AiAnalysisResult } from '@codepulse/core/src/ai/IAiProvider';

export function generateHtml(graph: ReconciledGraph, aiResult?: AiAnalysisResult): string {
    const safeGraph = JSON.stringify(graph).replace(/</g, '\\u003c');

    // Mermaid Definition
    let mermaidDef = "graph TD\n";
    mermaidDef += "  classDef verified fill:#2ecc71,stroke:#27ae60,color:#064e3b\n";
    mermaidDef += "  classDef zombie fill:#94a3b8,stroke:#475569,stroke-dasharray: 5 5,color:#1e293b\n";
    mermaidDef += "  classDef discovered fill:#8b5cf6,stroke:#6d28d9,color:white\n";
    mermaidDef += "  classDef error fill:#ef4444,stroke:#991b1b,color:white\n";

    graph.nodes.forEach(node => {
        const nodeId = node.id.replace(/[^a-zA-Z0-9]/g, '_');
        const nodeLabel = `${node.name}<br/>(${node.telemetry.executionCount})`;

        let styleClass = 'zombie';
        if (node.status === 'verified') styleClass = 'verified';
        if (node.status === 'discovered') styleClass = 'discovered';
        if (node.status === 'error') styleClass = 'error';

        mermaidDef += `  ${nodeId}["${nodeLabel}"]:::${styleClass}\n`;

        node.telemetry.discoveredDependencies.forEach((dep, idx) => {
            const depId = `dep_${nodeId}_${idx}`;
            mermaidDef += `  ${depId}["${dep}"]:::discovered;\n`;
            mermaidDef += `  ${nodeId} --> ${depId};\n`;
        });
    });

    // Add Edges from Static Graph
    graph.edges.forEach(edge => {
        const sourceId = edge.sourceId.replace(/[^a-zA-Z0-9]/g, '_');
        const targetId = edge.targetId.replace(/[^a-zA-Z0-9]/g, '_');

        // Only add edges if both nodes exist in the graph (or we'll have non-existent nodes in Mermaid)
        mermaidDef += `  ${sourceId} -.->|${edge.type}| ${targetId}\n`;
    });

    // AI Section HTML
    let aiHtml = '';
    if (aiResult) {
        aiHtml = `
        <div class="card ai-summary">
            <h3>🤖 Architect's Assessment <span class="badge score">${aiResult.score}/100</span></h3>
            <p>${aiResult.summary}</p>
            <h4>Identified Risks:</h4>
            <ul>
                ${aiResult.risks.map(r => `<li>${r}</li>`).join('')}
            </ul>
        </div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodePulse Living Dashboard</title>
    <style>
        :root { 
            --bg: #0f172a; 
            --text: #f8fafc; 
            --panel: #1e293b; 
            --accent: #38bdf8; 
            --verified: #22c55e;
            --zombie: #94a3b8;
            --error: #ef4444;
            --discovered: #8b5cf6;
        }
        * { box-sizing: border-box; }
        body { 
            margin: 0; 
            font-family: 'Outfit', 'Inter', sans-serif; 
            background: var(--bg); 
            color: var(--text); 
            display: grid; 
            grid-template-rows: 70px 1fr; 
            height: 100vh; 
            overflow: hidden; 
        }
        /* ... header styles ... */
        main { display: grid; grid-template-columns: 1fr 400px; height: 100%; overflow: hidden; } /* Ensure main doesn't scroll, children do */
        /* ... graph container ... */
        aside { 
            background: var(--panel); 
            border-left: 1px solid rgba(255,255,255,0.1); 
            padding: 30px; 
            height: 100%; /* Force full height */
            overflow-y: auto; 
            box-shadow: -10px 0 30px rgba(0,0,0,0.2);
        }
        
        .card { 
            background: rgba(255,255,255,0.03); 
            padding: 20px; 
            border-radius: 12px; 
            margin-bottom: 20px; 
            border: 1px solid rgba(255,255,255,0.05);
            transition: transform 0.2s, background 0.2s;
        }
        .card:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }
        .card h3 { margin-top: 0; color: var(--accent); font-size: 1.1rem; display: flex; justify-content: space-between; align-items: center; }
        .metric { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 6px; }
        .metric span { opacity: 0.6; }
        
        .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
        .badge.verified { background: var(--verified); color: #064e3b; }
        .badge.zombie { background: var(--zombie); color: #0f172a; }
        .badge.discovered { background: var(--discovered); color: white; }
        .badge.error { background: var(--error); color: white; }
        
        .ai-summary { 
            background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%); 
            color: white; 
            border: none;
            box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.4);
            max-height: 400px;
            overflow-y: auto;
        }
        .ai-summary h3 { color: white; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; }
        .badge.score { background: white; color: #2563eb; }
        
        h2 { font-size: 1.25rem; margin-top: 30px; margin-bottom: 15px; font-weight: 700; }
        ul { padding-left: 20px; margin: 0; }
        li { margin-bottom: 8px; opacity: 0.8; font-size: 0.9rem; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/svg-pan-zoom@3.6.1/dist/svg-pan-zoom.min.js"></script>
</head>
<body>
    <header>
        <h1>⚡ CodePulse Dashboard</h1>
        <div class="stats">
            <span class="stat-item">Verified: <b>${graph.summary.verified}</b></span>
            <span class="stat-item">Zombies: <b>${graph.summary.zombies}</b></span>
            <span class="stat-item">Discovered: <b>${graph.summary.discovered}</b></span>
        </div>
    </header>
    <main>
        <div id="graph-container">
            <div id="mermaid-render-target" class="mermaid"></div>
        </div>
        <aside id="details-panel">
            ${aiHtml}
            <h2>System Details</h2>
            <p style="opacity: 0.7">Click on any block in the diagram to view detailed runtime metrics.</p>
             <div id="node-list"></div>
        </aside>
    </main>

    <script>
        const graphData = ${safeGraph};
        const mermaidSource = \`${mermaidDef.trim()}\`;
        
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'dark',
            securityLevel: 'loose'
        });

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

        // Modern async Mermaid rendering
        const renderGraph = async () => {
            try {
                const target = document.getElementById('mermaid-render-target');
                const { svg } = await mermaid.render('mermaid-svg-internal', mermaidSource);
                target.innerHTML = svg;
                
                const svgElement = target.querySelector('svg');
                svgElement.setAttribute('width', '100%');
                svgElement.setAttribute('height', '100%');
                svgElement.style.maxWidth = 'none';

                svgPanZoom(svgElement, {
                    zoomEnabled: true,
                    controlIconsEnabled: true,
                    fit: true,
                    center: true,
                    minZoom: 0.1,
                    maxZoom: 10
                });
            } catch (e) {
                console.error("Mermaid Render Error:", e);
                document.getElementById('mermaid-render-target').innerHTML = 
                    "<div style='padding: 20px; color: #ef4444;'>Render Error: " + e.message + "</div>";
            }
        };

        renderGraph();

    </script>
</body>
</html>`;
}
