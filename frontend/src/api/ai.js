/**
 * Mock AI API for generating Executive Synthesis.
 * In a real environment, this would call a backend endpoint (e.g., /api/ai/synthesize)
 * which communicates with an LLM (OpenAI, Gemini, etc.).
 */

export const aiApi = {
  /**
   * Generates a quarterly synthesis based on journals and achievements.
   * @param {Object} data - { journals: Array, achievements: Array, period: string }
   * @returns {Promise<Object>} Mock synthesis object
   */
  generateSynthesis: async (data) => {
    // Simulate network latency (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    const { journals = [], achievements = [], focusArea = "" } = data;
    
    // Fallback if not enough data
    if (journals.length === 0 && achievements.length === 0) {
      return {
        summary: "Not enough data recorded in this period to generate a meaningful synthesis.",
        topImpacts: [],
        recurringBlockers: [],
        rawMarkdown: "Not enough data recorded in this period to generate a meaningful synthesis."
      };
    }

    const summary = `Over this period, the focus was heavily placed on foundational improvements and unblocking critical team pipelines. With ${journals.length} journal entries and ${achievements.length} key milestones recorded, the trajectory shows consistent technical execution combined with proactive communication. The overarching value delivered centers around system stability and team velocity enablement.`;

    const strategicAlignment = "Demonstrated strong alignment with quarterly objectives, specifically in System Reliability (40% of efforts) and Velocity Enablers (30%). Consistently prioritized work that mapped directly to OKRs.";

    const topImpacts = achievements.length > 0 ? achievements.slice(0, 3).map(a => ({
      title: a.title,
      description: a.impact || a.description || "Delivered measurable improvements to team objectives."
    })) : [
      { title: "Consistent Delivery", description: "Maintained steady output across sprints despite shifting priorities." },
      { title: "Knowledge Sharing", description: "Documented learnings actively, reducing siloed knowledge." }
    ];

    const recurringBlockers = [
      "Ambiguous requirements delaying feature kick-offs.",
      "Intermittent CI/CD pipeline failures causing deployment bottlenecks."
    ];

    const growthAreas = [
      "Cross-team dependency management during complex refactors.",
      "Earlier flagging of risk in long-running feature branches."
    ];

    const metricHighlights = [
      "Reduced average CI/CD build times by ~15%",
      "Zero rollbacks in the last 3 major deployments",
      "Resolved 12 high-priority technical debt tickets"
    ];

    const keyCollaborators = ["Frontend Guild", "Data Platform Team", "Product Operations"];

    const nextQuarterFocus = "Transition from stability-focused refactoring to supporting new feature architectures, specifically regarding the upcoming real-time analytics module.";

    let targetedInsights = null;
    if (focusArea && focusArea.trim().length > 0) {
      targetedInsights = `Based on your request to focus on "${focusArea.substring(0, 50)}${focusArea.length > 50 ? '...' : ''}":\n\nThe data indicates a strong proactive approach in this area. You successfully led 3 architectural design discussions and mentored 2 junior engineers through complex integrations, directly addressing your focus on leadership and technical guidance.`;
    }

    let rawMarkdown = `### 📊 Executive AI Synthesis

**Overview:**
${summary}

**🎯 Strategic Alignment:**
${strategicAlignment}

**🏆 Top Business Impacts:**
${topImpacts.map(i => `- **${i.title}**: ${i.description}`).join('\\n')}

**📈 Metric Highlights:**
${metricHighlights.map(m => `- ${m}`).join('\\n')}

**⚠️ Recurring Impediments:**
${recurringBlockers.map(b => `- ${b}`).join('\\n')}

**🌱 Growth Areas:**
${growthAreas.map(g => `- ${g}`).join('\\n')}

**🤝 Key Collaborators:**
${keyCollaborators.join(', ')}

**⏭️ Next Quarter Focus:**
${nextQuarterFocus}
`;

    if (targetedInsights) {
      rawMarkdown += `\n**💡 Targeted Insights:**\n${targetedInsights}\n`;
    }

    return {
      summary,
      strategicAlignment,
      topImpacts,
      recurringBlockers,
      growthAreas,
      metricHighlights,
      keyCollaborators,
      nextQuarterFocus,
      targetedInsights,
      rawMarkdown
    };
  }
};
