#!/usr/bin/env node

/**
 * PR Triage Script - Node.js version
 * Analyzes pull requests and categorizes them for completion triage
 * 
 * Usage:
 *   1. Authenticate: gh auth login
 *   2. Run: node scripts/triage-prs.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'Greenmamba29/institutional-canvas';
const OUTPUT_FILE = 'pr-triage-report.md';

// Check if GitHub CLI is authenticated
function checkAuth() {
  try {
    execSync('gh auth status', { stdio: 'ignore' });
    return true;
  } catch {
    console.error('❌ GitHub CLI not authenticated. Please run: gh auth login');
    process.exit(1);
  }
}

// Fetch PRs from GitHub
function fetchPRs(state, limit = 100) {
  try {
    const result = execSync(
      `gh pr list --repo "${REPO}" --state ${state} --limit ${limit} --json number,title,state,author,createdAt,updatedAt,url,isDraft,labels,reviewDecision,mergeable,body`,
      { encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch (error) {
    console.warn(`⚠️  Could not fetch ${state} PRs: ${error.message}`);
    return [];
  }
}

// Categorize PR based on title and labels
function categorizePR(pr) {
  const title = pr.title.toLowerCase();
  const labelNames = (pr.labels || []).map(l => l.name.toLowerCase()).join(' ');
  const combined = `${title} ${labelNames}`;

  // Check labels first
  if (/\b(bug|fix|hotfix|patch)\b/.test(combined)) {
    return '🐛 Bug Fix';
  }
  if (/\b(feature|feat|enhancement|add|implement)\b/.test(combined)) {
    return '✨ Feature';
  }
  if (/\b(refactor|cleanup|remove|restructure)\b/.test(combined)) {
    return '♻️  Refactor';
  }
  if (/\b(docs|documentation|readme|guide)\b/.test(combined)) {
    return '📝 Documentation';
  }
  if (/\b(test|testing|spec)\b/.test(combined)) {
    return '🧪 Test';
  }
  if (/\b(ci|cd|workflow|action|deploy)\b/.test(combined)) {
    return '🚀 CI/CD';
  }
  
  return '📦 Other';
}

// Get review status emoji
function getReviewStatus(pr) {
  if (pr.isDraft) return '📝 Draft';
  if (pr.reviewDecision === 'APPROVED') return '✅ Approved';
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return '⚠️  Changes Requested';
  if (pr.reviewDecision === 'REVIEW_REQUIRED') return '🔍 Review Required';
  return '⏳ Pending Review';
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Generate markdown report
function generateReport(openPRs, closedPRs, mergedPRs) {
  const total = openPRs.length + closedPRs.length + mergedPRs.length;
  const now = new Date().toISOString();

  let report = `# PR Triage Report\n\n`;
  report += `Generated: ${formatDate(now)}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total PRs Analyzed**: ${total}\n`;
  report += `- **Open**: ${openPRs.length}\n`;
  report += `- **Closed**: ${closedPRs.length}\n`;
  report += `- **Merged**: ${mergedPRs.length}\n\n`;

  // Categorize all PRs
  const categories = {
    '🐛 Bug Fix': [],
    '✨ Feature': [],
    '♻️  Refactor': [],
    '📝 Documentation': [],
    '🧪 Test': [],
    '🚀 CI/CD': [],
    '📦 Other': []
  };

  [...openPRs, ...closedPRs, ...mergedPRs].forEach(pr => {
    const category = categorizePR(pr);
    categories[category].push(pr);
  });

  report += `## PRs by Category\n\n`;
  Object.entries(categories).forEach(([category, prs]) => {
    if (prs.length > 0) {
      report += `### ${category} (${prs.length})\n\n`;
      prs.forEach(pr => {
        const status = pr.state === 'OPEN' ? getReviewStatus(pr) : pr.state;
        report += `- [#${pr.number}](${pr.url}) - ${pr.title} (${status})\n`;
      });
      report += `\n`;
    }
  });

  // Open PRs section
  if (openPRs.length > 0) {
    report += `## 🔓 Open PRs (${openPRs.length})\n\n`;
    report += `| # | Title | Author | Created | Status | Category |\n`;
    report += `|---|-------|--------|---------|--------|----------|\n`;
    
    openPRs.forEach(pr => {
      const category = categorizePR(pr);
      const status = getReviewStatus(pr);
      report += `| [#${pr.number}](${pr.url}) | ${pr.title.replace(/\|/g, '\\|')} | ${pr.author.login} | ${formatDate(pr.createdAt)} | ${status} | ${category} |\n`;
    });
    report += `\n`;
  }

  // Merged PRs section
  if (mergedPRs.length > 0) {
    report += `## ✅ Merged PRs (${mergedPRs.length})\n\n`;
    report += `| # | Title | Author | Merged | Category |\n`;
    report += `|---|-------|--------|--------|----------|\n`;
    
    mergedPRs.slice(0, 50).forEach(pr => { // Limit to 50 most recent
      const category = categorizePR(pr);
      report += `| [#${pr.number}](${pr.url}) | ${pr.title.replace(/\|/g, '\\|')} | ${pr.author.login} | ${formatDate(pr.updatedAt)} | ${category} |\n`;
    });
    report += `\n`;
  }

  // Action Items
  report += `## 🎯 Action Items\n\n`;
  
  const needsAttention = openPRs.filter(pr => 
    !pr.isDraft && 
    (pr.reviewDecision === 'REVIEW_REQUIRED' || pr.reviewDecision === null)
  );

  if (needsAttention.length > 0) {
    report += `### Needs Review (${needsAttention.length})\n\n`;
    needsAttention.forEach(pr => {
      report += `1. [#${pr.number}](${pr.url}) - ${pr.title} (Author: ${pr.author.login})\n`;
    });
    report += `\n`;
  }

  const hasChanges = openPRs.filter(pr => pr.reviewDecision === 'CHANGES_REQUESTED');
  if (hasChanges.length > 0) {
    report += `### Changes Requested (${hasChanges.length})\n\n`;
    hasChanges.forEach(pr => {
      report += `1. [#${pr.number}](${pr.url}) - ${pr.title} (Author: ${pr.author.login})\n`;
    });
    report += `\n`;
  }

  const drafts = openPRs.filter(pr => pr.isDraft);
  if (drafts.length > 0) {
    report += `### Draft PRs (${drafts.length})\n\n`;
    drafts.forEach(pr => {
      report += `1. [#${pr.number}](${pr.url}) - ${pr.title} (Author: ${pr.author.login})\n`;
    });
    report += `\n`;
  }

  report += `---\n\n`;
  report += `Report generated by PR Triage Script\n`;

  return report;
}

// Main execution
function main() {
  console.log(`🔍 Fetching pull requests from ${REPO}...\n`);
  
  checkAuth();

  console.log('📥 Fetching open PRs...');
  const openPRs = fetchPRs('open', 100);
  
  console.log('📥 Fetching closed PRs...');
  const closedPRs = fetchPRs('closed', 100);
  
  console.log('📥 Fetching merged PRs...');
  const mergedPRs = fetchPRs('merged', 100);

  console.log('\n📊 Generating report...');
  const report = generateReport(openPRs, closedPRs, mergedPRs);

  fs.writeFileSync(OUTPUT_FILE, report);
  
  console.log(`✅ Triage report generated: ${OUTPUT_FILE}`);
  console.log(`\n📈 Summary:`);
  console.log(`   - Total PRs: ${openPRs.length + closedPRs.length + mergedPRs.length}`);
  console.log(`   - Open: ${openPRs.length}`);
  console.log(`   - Merged: ${mergedPRs.length}`);
  console.log(`   - Closed: ${closedPRs.length}`);
  console.log(`\nView the report: cat ${OUTPUT_FILE} | less`);
}

main();

