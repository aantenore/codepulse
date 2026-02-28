import { ReconciledGraph, IAiProvider } from '@codepulse/core';

export class TechDocGenerator {
    static async generate(graph: ReconciledGraph, provider: IAiProvider, projectName: string = 'CodePulse Project'): Promise<string> {
        const date = new Date().toISOString().split('T')[0];

        let md = `# Flow Architecture: ${projectName}\n`;
        md += `**Date:** ${date}\n\n`;
        md += `> **Generative Docs:** This chapter was written by ${provider.name} AI.\n\n`;

        // Section 1: AI Analysis - System Resilience
        md += `## 1. System Resilience & Flow Analysis\n\n`;

        try {
            console.log(`[AI] Generating Analysis with ${provider.name}...`);
            const prompt = `
            You are a Technical Writer and Software Architect.
            Analyze this CodePulse Graph (JSON).
            Write a Markdown chapter titled 'System Resilience & Flow Analysis'.
            
            Context:
            - Total Nodes: ${graph.summary.totalNodes}
            - Verified Coverage: ${graph.summary.verified} lines/methods
            - Zombie Code: ${graph.summary.zombies} nodes
            
            Requirements:
            1. **Narrative Flow:** Describe the user journey (e.g., 'User places order...'). Identify likely entry points (Controllers).
            2. **Chaos Analysis:** Identify points of failure. If you see 'payment' or 'inventory' in the graph, hypothesize about latency or failure impact.
            3. **Architecture Recommendations:** Suggest 1-2 improvements.
            
            Graph Data:
            ${JSON.stringify(graph.nodes.slice(0, 50).map(n => ({ id: n.id, connections: n.telemetry.discoveredDependencies })), null, 2)}
            
            Output strictly the Markdown content for this chapter. Do not allow markdown code blocks of the output itself.
            `;
            const response = await provider.chat(prompt);
            md += response.trim() + '\n\n';
        } catch (e: unknown) {
            const err = e as { response?: { data?: unknown } };
            console.error("[AI] Generation Failed Full Trace:", JSON.stringify(e, e && typeof e === 'object' ? Object.getOwnPropertyNames(e) : [], 2));
            if (err.response) {
                console.error("[AI] API Response Body:", err.response.data);
            }
            md += `> **Analysis Unavailable:** _The AI Provider encountered an error. Raw details logged to console._\n\n`;
            md += `### System Resilience (Static Fallback)\n`;
            md += `The system consists of ${graph.summary.totalNodes} nodes with ${graph.summary.discovered} discovered dependencies.\n`;
            md += `Please check your API Key configuration if semantic analysis is required.\n\n`;
        }

        // Section 2: Executive Summary
        md += `## 2. Executive Summary\n\n`;
        const total = graph.summary.totalNodes;
        const verifiedPct = total > 0 ? ((graph.summary.verified / total) * 100).toFixed(1) : '0';
        const zombiePct = total > 0 ? ((graph.summary.zombies / total) * 100).toFixed(1) : '0';

        md += `- **Total Nodes:** ${total}\n`;
        md += `- **Verified Flow:** ${verifiedPct}%\n`;
        md += `- **Zombie Code (Unused):** ${zombiePct}%\n`;
        md += `- **Discovered Dependencies:** ${graph.summary.discovered}\n\n`;

        // Section 3: Data Flow Matrix (Generic)
        md += `## 3. Data Flow Matrix\n\n`;
        md += `| Source Node | Interaction Type | Target Node |\n`;
        md += `|---|---|---|\n`;

        if (graph.edges.length === 0) {
            md += `| *No active flows detected* | - | - |\n`;
        } else {
            // Group by Source
            const flows = new Map<string, string[]>();

            for (const edge of graph.edges) {
                const flow = `${edge.type}:${edge.targetId}`;
                if (!flows.has(edge.sourceId)) {
                    flows.set(edge.sourceId, []);
                }
                flows.get(edge.sourceId)?.push(flow);
            }

            for (const [source, targets] of flows) {
                md += `| \`${source}\` | \`calls\` | ${targets.join(', ')} |\n`;
            }
        }
        md += `\n`;
        md += `\n`;

        // Section 4: Anomalies
        md += `## 4. Anomalies\n\n`;

        const zombies = graph.nodes.filter(n => n.status === 'potentially_dead');
        md += `### 4.1 Zombie Code (${zombies.length})\n`;
        if (zombies.length > 0) {
            md += `The following methods appear to be defined but never executed:\n`;
            zombies.forEach(z => {
                md += `- \`${z.id}\`\n`;
            });
        } else {
            md += `_No zombie code detected._\n`;
        }
        md += `\n`;

        const hidden = graph.nodes.filter(n => n.status === 'discovered');
        md += `### 4.2 Hidden Dependencies (${hidden.length})\n`;
        if (hidden.length > 0) {
            md += `The following nodes were discovered at runtime but not in static analysis:\n`;
            hidden.forEach(h => {
                md += `- \`${h.id}\`\n`;
            });
        } else {
            md += `_No hidden dependencies detected._\n`;
        }

        return md;
    }
}
