#!/usr/bin/env node

/**
 * Analyze PR Triage CSV Data
 * Reads a CSV file with PR data and generates a comprehensive triage report
 * 
 * Usage:
 *   1. Fill out pr-triage-csv-template.csv with your 93 PRs
 *   2. Rename it to pr-triage-data.csv
 *   3. Run: node scripts/analyze-prs-from-csv.js
 */

const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, 'pr-triage-data.csv');
const OUTPUT_FILE = 'pr-triage-report.md';

// Parse CSV (simple parser)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    data.push(obj);
  }
  
  return data;
}

// Generate report
function generateReport(prs) {
  const total = prs.length;
  const now = new Date().toISOString();
  
  // Statistics
  const byStatus = {};
  const byCategory = {};
  const byPriority = {};
  const byReviewStatus = {};
  const needsAttention = [];
  const readyToMerge = [];
  
  prs.forEach(pr => {
    // Count by status
    const status = pr.Status || 'Unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;
    
    // Count by category
    const category = pr.Category || 'Other';
    byCategory[category] = (byCategory[category] || 0) + 1;
    
    // Count by priority
    const priority = pr.Priority || 'P2-Medium';
    byPriority[priority] = (byPriority[priority] || 0) + 1;
    
    // Count by review status
    const reviewStatus = pr['Review Status'] || 'Not Reviewed';
    byReviewStatus[reviewStatus] = (byReviewStatus[reviewStatus] || 0) + 1;
    
    // Identify PRs needing attention
    if (status === 'Open' && (reviewStatus === 'Needs Review' || reviewStatus === 'Changes Requested')) {
      needsAttention.push(pr);
    }
    
    // Identify PRs ready to merge
    if (status === 'Open' && reviewStatus === 'Approved' && pr['CI Passing'] === 'Yes' && pr['Has Conflicts'] === 'No') {
      readyToMerge.push(pr);
    }
  });
  
  let report = `# PR Triage Report\n\n`;
  report += `Generated: ${new Date(now).toLocaleString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total PRs**: ${total}\n\n`;
  
  // Status breakdown
  report += `### By Status\n\n`;
  Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
    report += `- **${status}**: ${count}\n`;
  });
  report += `\n`;
  
  // Category breakdown
  report += `### By Category\n\n`;
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    report += `- **${category}**: ${count}\n`;
  });
  report += `\n`;
  
  // Priority breakdown
  report += `### By Priority\n\n`;
  ['P0-Critical', 'P1-High', 'P2-Medium', 'P3-Low'].forEach(priority => {
    const count = byPriority[priority] || 0;
    if (count > 0) {
      report += `- **${priority}**: ${count}\n`;
    }
  });
  report += `\n`;
  
  // Review status breakdown
  report += `### By Review Status\n\n`;
  Object.entries(byReviewStatus).sort((a, b) => b[1] - a[1]).forEach(([reviewStatus, count]) => {
    report += `- **${reviewStatus}**: ${count}\n`;
  });
  report += `\n`;
  
  // Action Items
  report += `## 🎯 Action Items\n\n`;
  
  if (readyToMerge.length > 0) {
    report += `### ✅ Ready to Merge (${readyToMerge.length})\n\n`;
    report += `| PR # | Title | Author | Category | Priority |\n`;
    report += `|------|-------|--------|----------|----------|\n`;
    readyToMerge.forEach(pr => {
      report += `| #${pr['PR Number']} | ${pr.Title} | ${pr.Author} | ${pr.Category} | ${pr.Priority} |\n`;
    });
    report += `\n`;
  }
  
  if (needsAttention.length > 0) {
    report += `### ⚠️ Needs Attention (${needsAttention.length})\n\n`;
    report += `| PR # | Title | Author | Review Status | Category | Priority |\n`;
    report += `|------|-------|--------|---------------|----------|----------|\n`;
    needsAttention.forEach(pr => {
      report += `| #${pr['PR Number']} | ${pr.Title} | ${pr.Author} | ${pr['Review Status']} | ${pr.Category} | ${pr.Priority} |\n`;
    });
    report += `\n`;
  }
  
  // All PRs table
  report += `## 📋 All PRs\n\n`;
  report += `| PR # | Title | Status | Category | Priority | Review Status | CI | Conflicts | Action |\n`;
  report += `|------|-------|--------|----------|----------|---------------|----|-----------|---------|----|\n`;
  
  prs.forEach(pr => {
    const ciStatus = pr['CI Passing'] === 'Yes' ? '✅' : pr['CI Passing'] === 'No' ? '❌' : '⏸️';
    const conflictStatus = pr['Has Conflicts'] === 'Yes' ? '⚠️' : pr['Has Conflicts'] === 'No' ? '✅' : '❓';
    report += `| #${pr['PR Number']} | ${pr.Title} | ${pr.Status} | ${pr.Category} | ${pr.Priority} | ${pr['Review Status']} | ${ciStatus} | ${conflictStatus} | ${pr['Action Required']} |\n`;
  });
  
  report += `\n---\n\n`;
  report += `Report generated from CSV data\n`;
  
  return report;
}

// Main execution
function main() {
  if (!fs.existsSync(CSV_FILE)) {
    console.error(`❌ CSV file not found: ${CSV_FILE}`);
    console.log(`\n📝 Please:`);
    console.log(`   1. Copy scripts/pr-triage-csv-template.csv to scripts/pr-triage-data.csv`);
    console.log(`   2. Fill it out with your 93 PRs`);
    console.log(`   3. Run this script again\n`);
    process.exit(1);
  }
  
  console.log(`📖 Reading PR data from ${CSV_FILE}...`);
  const content = fs.readFileSync(CSV_FILE, 'utf-8');
  const prs = parseCSV(content);
  
  if (prs.length === 0) {
    console.error(`❌ No PR data found in CSV. Please add PR information to ${CSV_FILE}`);
    process.exit(1);
  }
  
  console.log(`📊 Found ${prs.length} PRs, generating report...`);
  const report = generateReport(prs);
  
  fs.writeFileSync(OUTPUT_FILE, report);
  
  console.log(`✅ Triage report generated: ${OUTPUT_FILE}`);
  console.log(`\n📈 Summary:`);
  console.log(`   - Total PRs analyzed: ${prs.length}`);
}

main();

