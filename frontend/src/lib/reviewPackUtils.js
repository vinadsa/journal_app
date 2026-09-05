import { formatDate, formatDateFull } from './dateUtils';
import { CATEGORIES } from './constants';

/**
 * Copies text to clipboard with fallback.
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, falling back to execCommand:', err);
    }
  }

  // Fallback using textarea
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return successful;
  } catch (err) {
    console.error('Clipboard fallback copy failed:', err);
    return false;
  }
}

/**
 * Triggers a browser download for a text file (e.g. .md).
 */
export function downloadFile(content, filename, mimeType = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Calculates category distribution and "Invisible Work" quotient.
 */
export function calculateContributionBreakdown(journals) {
  const counts = {};
  journals.forEach(j => {
    const cat = j.category || 'general';
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const total = journals.length || 1;
  const items = Object.entries(counts)
    .map(([cat, count]) => {
      const isShadowWork = ['maintenance', 'request', 'meeting', 'other'].includes(cat);
      return {
        cat,
        label: CATEGORIES[cat] || cat,
        count,
        pct: Math.round((count / total) * 100),
        isShadowWork
      };
    })
    .sort((a, b) => b.count - a.count);

  const shadowWorkCount = items
    .filter(i => i.isShadowWork)
    .reduce((sum, i) => sum + i.count, 0);

  const shadowWorkPct = Math.round((shadowWorkCount / total) * 100);

  return { items, shadowWorkCount, shadowWorkPct, totalEntries: journals.length };
}

/**
 * Compiles a comprehensive Executive Review Pack in clean Markdown.
 */
export function generateReviewPackMarkdown({
  user,
  periodLabel,
  startDate,
  endDate,
  journals = [],
  achievements = [],
  aiSynthesis = null,
  options = {
    includeSynthesis: true,
    includeCalendar: true,
    includeAchievements: true,
    includeCategories: true,
    includeJournals: true,
  }
}) {
  const activeDates = new Set(journals.map(j => j.entry_date?.split('T')[0]));
  const activeDays = activeDates.size;
  const breakdown = calculateContributionBreakdown(journals);
  const generatedDate = formatDateFull(new Date());

  const lines = [];
  let sectionNum = 1;

  // Header & Metadata
  lines.push(`# 📋 Executive Review Pack & Evidence Dossier`);
  lines.push(`**Professional Dossier for:** ${user?.name || 'Professional'} (${user?.email || 'N/A'})`);
  lines.push(`**Role / Context:** ${user?.role ? user.role.toUpperCase() : 'CONTRIBUTOR'}`);
  lines.push(`**Review Period:** ${periodLabel} (${formatDate(startDate)} – ${formatDate(endDate)})`);
  lines.push(`**Generated Date:** ${generatedDate}`);
  lines.push(`**Trace Foundation:** ${journals.length} Journal Entries · ${activeDays} Active Days · ${achievements.length} Key Milestones\n`);
  lines.push(`---\n`);

  // Section: Executive AI Synthesis
  if (options.includeSynthesis) {
    lines.push(`## ${sectionNum++}. Executive Synthesis & Strategic Overview\n`);
    if (aiSynthesis) {
      if (aiSynthesis.summary) {
        lines.push(`### Executive Summary`);
        lines.push(`${aiSynthesis.summary}\n`);
      }
      if (aiSynthesis.strategicAlignment) {
        lines.push(`### 🎯 Strategic Business Alignment`);
        lines.push(`${aiSynthesis.strategicAlignment}\n`);
      }
      if (aiSynthesis.topImpacts && aiSynthesis.topImpacts.length > 0) {
        lines.push(`### 🏆 Top High-Impact Deliveries`);
        aiSynthesis.topImpacts.forEach(imp => {
          lines.push(`- **${imp.title}**: ${imp.description}`);
        });
        lines.push('');
      }
      if (aiSynthesis.metricHighlights && aiSynthesis.metricHighlights.length > 0) {
        lines.push(`### 📈 Key Metric Highlights`);
        aiSynthesis.metricHighlights.forEach(m => lines.push(`- ${m}`));
        lines.push('');
      }
      if (aiSynthesis.recurringBlockers && aiSynthesis.recurringBlockers.length > 0) {
        lines.push(`### ⚠️ Resolved Impediments & Friction`);
        aiSynthesis.recurringBlockers.forEach(b => lines.push(`- ${b}`));
        lines.push('');
      }
      if (aiSynthesis.growthAreas && aiSynthesis.growthAreas.length > 0) {
        lines.push(`### 🌱 Growth & Evolution Focus`);
        aiSynthesis.growthAreas.forEach(g => lines.push(`- ${g}`));
        lines.push('');
      }
      if (aiSynthesis.targetedInsights) {
        lines.push(`### 💡 Targeted Strategic Insights`);
        lines.push(`${aiSynthesis.targetedInsights}\n`);
      }
    } else {
      lines.push(`*During this cycle, ${journals.length} contributions were documented across ${activeDays} active days with ${achievements.length} notable business milestones. Work was sustained across foundational maintenance and product feature execution.*\n`);
    }
    lines.push(`---\n`);
  }

  // Section: Activity & Evidence Cadence
  if (options.includeCalendar) {
    lines.push(`## ${sectionNum++}. Activity & Evidence Cadence Overview\n`);
    lines.push(`*Quarterly distribution of verified work captures and milestone deliveries.*\n`);
    lines.push(`- **Active Days Documented:** ${activeDays} active contribution days`);
    lines.push(`- **Total Journal Entries:** ${journals.length} entries`);
    lines.push(`- **Milestone Anchors:** ${achievements.length} verified business milestones`);
    lines.push(`- **Capture Velocity:** Average ${(journals.length / Math.max(1, activeDays)).toFixed(1)} traces per active day\n`);
    lines.push(`---\n`);
  }

  // Section: Key Milestones & Evidence Dossiers
  if (options.includeAchievements && achievements.length > 0) {
    lines.push(`## ${sectionNum++}. Key Milestones & Evidence Dossiers\n`);
    lines.push(`*Each milestone is anchored by verifiable journal traces captured during execution.*\n`);

    const sortedAchievements = [...achievements].sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.importance] ?? 2) - (order[b.importance] ?? 2);
    });

    sortedAchievements.forEach((a, idx) => {
      const importanceUpper = (a.importance || 'medium').toUpperCase();
      const dateStr = formatDate(a.achieved_date || a.created_at);
      lines.push(`### ${idx + 1}. [${importanceUpper}] ${a.title}`);
      lines.push(`- **Date Achieved:** ${dateStr}`);
      if (a.description) {
        lines.push(`- **Milestone Overview:** ${a.description}`);
      }
      if (a.impact) {
        lines.push(`- **Measurable Business Impact:** ${a.impact}`);
      }

      // Evidence Dossier (Linked Journals)
      const linked = a.linked_journals || [];
      if (linked.length > 0) {
        lines.push(`- **Supporting Evidence Dossier (${linked.length} linked ${linked.length === 1 ? 'trace' : 'traces'}):**`);
        linked.forEach(j => {
          const cat = CATEGORIES[j.category] || j.category || 'General';
          lines.push(`  - 📄 **${formatDate(j.entry_date)}** [${cat}]: ${j.title || `Entry #${j.id}`}`);
        });
      } else if (a.journal_id) {
        lines.push(`- **Supporting Evidence Dossier:** Primary Journal Entry #${a.journal_id}`);
      } else {
        lines.push(`- **Supporting Evidence:** Standalone Milestone`);
      }
      lines.push('');
    });
    lines.push(`---\n`);
  }

  // Section: Contribution Spectrum & Invisible Work Quotient
  if (options.includeCategories && breakdown.items.length > 0) {
    lines.push(`## ${sectionNum++}. Contribution Spectrum & Shadow Work Quotient\n`);
    lines.push(`*Recognizing both visible feature delivery and indispensable invisible work (refactoring, incident triage, unblocking colleagues).*\n`);

    lines.push(`| Category | Entries | Share | Classification |`);
    lines.push(`| :--- | :---: | :---: | :--- |`);
    breakdown.items.forEach(item => {
      const classification = item.isShadowWork ? 'Invisible / Foundation / Support' : 'Direct Feature Work';
      lines.push(`| ${item.label} | ${item.count} | ${item.pct}% | ${classification} |`);
    });
    lines.push('');
    lines.push(`> **Shadow Work Quotient:** **${breakdown.shadowWorkPct}%** of documented efforts were dedicated to foundational maintenance, team enablement, or operational support. This unseen work protects long-term velocity and code health.\n`);
    lines.push(`---\n`);
  }

  // Section: Key Journal Logs & Evidence Archive
  if (options.includeJournals && journals.length > 0) {
    lines.push(`## ${sectionNum++}. Chronological Evidence Archive (${journals.length} Entries)\n`);
    const sortedJournals = [...journals].sort((a, b) => new Date(b.entry_date) - new Date(a.entry_date));

    sortedJournals.forEach(j => {
      const cat = CATEGORIES[j.category] || j.category || 'General';
      lines.push(`### • ${formatDate(j.entry_date)} — ${j.title || 'Untitled Entry'} \`[${cat}]\``);
      if (j.did_today) {
        lines.push(`**What was accomplished:**`);
        lines.push(`${j.did_today}\n`);
      }
      if (j.learned_today) {
        lines.push(`**Key Learnings & Insights:**`);
        lines.push(`${j.learned_today}\n`);
      }
      if (j.blockers) {
        lines.push(`**Blockers Overcome:**`);
        lines.push(`${j.blockers}\n`);
      }
      if (j.next_plan) {
        lines.push(`**Forward Trajectory:** ${j.next_plan}\n`);
      }
      lines.push('');
    });
  }

  // Footer note
  lines.push(`\n*Report compiled via TRACE — Work Journal & Career Evidence Archive. "Every contribution, traced."*`);

  return lines.join('\n');
}

/**
 * Compiles a fast, punchy 1-on-1 talking points document for Slack / manager syncs.
 */
export function generateTalkingPointsMarkdown({
  user,
  journals = [],
  achievements = [],
  daysBack = 7,
}) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const filteredJournals = journals.filter(j => {
    const d = new Date(j.entry_date);
    return d >= cutoffDate;
  });

  const filteredAchievements = achievements.filter(a => {
    const d = new Date(a.achieved_date || a.created_at);
    return d >= cutoffDate;
  });

  const lines = [];
  lines.push(`*1-on-1 Sync Notes & Weekly Progress*`);
  lines.push(`_Prepared by ${user?.name || 'Contributor'} • Past ${daysBack} Days_`);
  lines.push(``);

  // 1. Shipped Wins
  lines.push(`*🚀 Shipped & Key Milestones:*`);
  if (filteredAchievements.length === 0) {
    lines.push(`• Steady operational execution across in-flight initiatives.`);
  } else {
    filteredAchievements.forEach(a => {
      const imp = a.importance ? `[${a.importance.toUpperCase()}] ` : '';
      const impactText = a.impact ? ` — _${a.impact}_` : '';
      lines.push(`• *${imp}${a.title}*${impactText}`);
    });
  }
  lines.push(``);

  // 2. Key Contributions & Invisible Work
  lines.push(`*🛠️ Key Work Delivered & Foundation:*`);
  if (filteredJournals.length === 0) {
    lines.push(`• No entries logged for this specific period.`);
  } else {
    filteredJournals.slice(0, 8).forEach(j => {
      const cat = CATEGORIES[j.category] || j.category;
      const title = j.title || 'Work Log';
      const summary = j.did_today ? j.did_today.replace(/\n+/g, ' ').substring(0, 140) : '';
      const snippet = summary ? `: ${summary}${j.did_today && j.did_today.length > 140 ? '...' : ''}` : '';
      lines.push(`• *[${cat}]* ${title}${snippet}`);
    });
  }
  lines.push(``);

  // 3. Blockers
  const journalsWithBlockers = filteredJournals.filter(j => j.blockers && j.blockers.trim().length > 0);
  lines.push(`*🧱 Impediments / Need Alignment:*`);
  if (journalsWithBlockers.length === 0) {
    lines.push(`• Zero critical blockers; moving according to plan.`);
  } else {
    journalsWithBlockers.forEach(j => {
      lines.push(`• ${j.blockers.replace(/\n+/g, ' ')}`);
    });
  }
  lines.push(``);

  // 4. Next Focus
  const journalsWithNext = filteredJournals.filter(j => j.next_plan && j.next_plan.trim().length > 0);
  lines.push(`*🎯 Next Immediate Focus:*`);
  if (journalsWithNext.length === 0) {
    lines.push(`• Continue sprint deliverables and maintain system stability.`);
  } else {
    // Show top 3 unique next plans
    const plans = journalsWithNext.slice(0, 3).map(j => j.next_plan.replace(/\n+/g, ' '));
    plans.forEach(p => lines.push(`• ${p}`));
  }

  return lines.join('\n');
}
