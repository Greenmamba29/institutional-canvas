#!/usr/bin/env node

/**
 * Commit Triage Script
 * Treats commits as PRs for triage analysis
 * Since this repo uses direct commits instead of PRs, we analyze commits for completion status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = 'commit-triage-report.md';

// Get all commits
function getCommits() {
  try {
    const result = execSync(
      `git log --all --format="%H|%an|%ae|%ad|%s|%b" --date=short`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
    return result.trim().split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('|');
      if (parts.length < 5) {
        // Handle malformed lines
        return null;
      }
      return {
        hash: parts[0] || '',
        author: parts[1] || 'Unknown',
        email: parts[2] || '',
        date: parts[3] || '',
        subject: parts[4] || '',
        body: parts.slice(5).join('|') || ''
      };
    }).filter(commit => commit !== null);
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    return [];
  }
}

// Categorize commit
function categorizeCommit(commit) {
  if (!commit || !commit.subject) return '📦 Other';
  
  const subject = (commit.subject || '').toLowerCase();
  const body = (commit.body || '').toLowerCase();
  const combined = `${subject} ${body}`;

  if (/\b(fix|bug|error|issue|broken|hotfix)\b/.test(combined)) {
    return '🐛 Bug Fix';
  }
  if (/\b(feat|feature|add|implement|create|new)\b/.test(combined)) {
    return '✨ Feature';
  }
  if (/\b(refactor|cleanup|restructure|improve|optimize)\b/.test(combined)) {
    return '♻️  Refactor';
  }
  if (/\b(docs|documentation|readme|guide|comment)\b/.test(combined)) {
    return '📝 Documentation';
  }
  if (/\b(test|spec|testing)\b/.test(combined)) {
    return '🧪 Test';
  }
  if (/\b(ci|cd|workflow|action|deploy|github)\b/.test(combined)) {
    return '🚀 CI/CD';
  }
  if (/\b(security|auth|rlp|rls|policy|permission)\b/.test(combined)) {
    return '🔒 Security';
  }
  
  return '📦 Other';
}

// Determine completion status
function getCompletionStatus(commit) {
  // Check if commit is in main/master
  try {
    execSync(`git branch --contains ${commit.hash} | grep -E "main|master"`, { stdio: 'ignore' });
    return '✅ Merged';
  } catch {
    return '⏳ Pending';
  }
}

// Generate report
function generateReport(commits) {
  const total = commits.length;
  const now = new Date().toISOString();
  
  // Statistics
  const byCategory = {};
  const byAuthor = {};
  const byDate = {};
  const categories = {};
  
  commits.forEach(commit => {
    const category = categorizeCommit(commit);
    byCategory[category] = (byCategory[category] || 0) + 1;
    byAuthor[commit.author] = (byAuthor[commit.author] || 0) + 1;
    
    const month = commit.date.substring(0, 7); // YYYY-MM
    byDate[month] = (byDate[month] || 0) + 1;
    
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(commit);
  });
  
  let report = `# Commit Triage Report (Treating Commits as PRs)\n\n`;
  report += `Generated: ${new Date(now).toLocaleString()}\n\n`;
  report += `**Note**: This repository uses direct commits instead of pull requests. This report treats commits as PRs for triage purposes.\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Commits Analyzed**: ${total}\n\n`;
  
  // Status breakdown (all are "merged" since they're commits)
  report += `### Status\n\n`;
  report += `- **Merged/Complete**: ${total} (all commits are already in the repository)\n\n`;
  
  // Category breakdown
  report += `### By Category\n\n`;
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    report += `- **${category}**: ${count}\n`;
  });
  report += `\n`;
  
  // Author breakdown
  report += `### By Author\n\n`;
  Object.entries(byAuthor).sort((a, b) => b[1] - a[1]).forEach(([author, count]) => {
    report += `- **${author}**: ${count} commits\n`;
  });
  report += `\n`;
  
  // Recent commits by category
  report += `## Commits by Category\n\n`;
  
  Object.entries(categories).sort((a, b) => b[1].length - a[1].length).forEach(([category, commits]) => {
    report += `### ${category} (${commits.length})\n\n`;
    report += `| Hash | Date | Author | Subject |\n`;
    report += `|------|------|--------|---------|\n`;
    
    commits.slice(0, 50).forEach(commit => {
      const shortHash = commit.hash.substring(0, 7);
      report += `| \`${shortHash}\` | ${commit.date} | ${commit.author} | ${commit.subject.substring(0, 60)} |\n`;
    });
    
    if (commits.length > 50) {
      report += `| ... | ... | ... | *${commits.length - 50} more commits* |\n`;
    }
    report += `\n`;
  });
  
  // Recent commits
  report += `## Recent Commits (Last 50)\n\n`;
  report += `| Hash | Date | Author | Category | Subject |\n`;
  report += `|------|------|--------|----------|---------|\n`;
  
  commits.slice(0, 50).forEach(commit => {
    const shortHash = commit.hash.substring(0, 7);
    const category = categorizeCommit(commit);
    report += `| \`${shortHash}\` | ${commit.date} | ${commit.author} | ${category} | ${commit.subject.substring(0, 50)} |\n`;
  });
  
  report += `\n---\n\n`;
  report += `**Note**: Since these are commits (not PRs), they are all already "merged" into the repository. `;
  report += `This triage helps understand what work has been completed and categorize it for review.\n`;
  
  return report;
}

// Main execution
function main() {
  console.log(`🔍 Analyzing commits as PRs...\n`);
  
  const commits = getCommits();
  
  if (commits.length === 0) {
    console.error('❌ No commits found');
    process.exit(1);
  }
  
  console.log(`📊 Found ${commits.length} commits, generating report...`);
  const report = generateReport(commits);
  
  fs.writeFileSync(OUTPUT_FILE, report);
  
  console.log(`✅ Commit triage report generated: ${OUTPUT_FILE}`);
  console.log(`\n📈 Summary:`);
  console.log(`   - Total commits: ${commits.length}`);
  
  // Count categories
  const byCategory = {};
  commits.forEach(commit => {
    const category = categorizeCommit(commit);
    byCategory[category] = (byCategory[category] || 0) + 1;
  });
  
  console.log(`\n📊 By Category:`);
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    console.log(`   - ${category}: ${count}`);
  });
  
  console.log(`\nView the report: cat ${OUTPUT_FILE} | less`);
}

main();

