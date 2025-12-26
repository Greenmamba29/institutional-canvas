#!/bin/bash

# PR Triage Script
# Analyzes pull requests and categorizes them for completion triage

set -e

REPO="Greenmamba29/institutional-canvas"
OUTPUT_FILE="pr-triage-report.md"
TEMP_FILE=$(mktemp)

echo "🔍 Fetching pull requests from ${REPO}..."
echo ""

# Check if GitHub CLI is authenticated
if ! gh auth status &>/dev/null; then
    echo "❌ GitHub CLI not authenticated. Please run: gh auth login"
    exit 1
fi

# Fetch all PRs (open, closed, merged)
echo "Fetching open PRs..."
gh pr list --repo "${REPO}" --state open --limit 100 --json number,title,state,author,createdAt,updatedAt,url,isDraft,labels,reviewDecision,mergeable --jq '.[]' > "${TEMP_FILE}.open.json" 2>/dev/null || echo "[]" > "${TEMP_FILE}.open.json"

echo "Fetching closed PRs..."
gh pr list --repo "${REPO}" --state closed --limit 100 --json number,title,state,author,createdAt,updatedAt,url,isDraft,labels,reviewDecision,mergeable --jq '.[]' > "${TEMP_FILE}.closed.json" 2>/dev/null || echo "[]" > "${TEMP_FILE}.closed.json"

echo "Fetching merged PRs..."
gh pr list --repo "${REPO}" --state merged --limit 100 --json number,title,state,author,createdAt,updatedAt,url,isDraft,labels,reviewDecision,mergeable --jq '.[]' > "${TEMP_FILE}.merged.json" 2>/dev/null || echo "[]" > "${TEMP_FILE}.merged.json"

# Generate report
cat > "${OUTPUT_FILE}" << 'EOF'
# PR Triage Report

Generated: $(date)

## Summary

EOF

# Count PRs by status
OPEN_COUNT=$(jq -s 'length' "${TEMP_FILE}.open.json" 2>/dev/null || echo "0")
CLOSED_COUNT=$(jq -s 'length' "${TEMP_FILE}.closed.json" 2>/dev/null || echo "0")
MERGED_COUNT=$(jq -s 'length' "${TEMP_FILE}.merged.json" 2>/dev/null || echo "0")
TOTAL=$((OPEN_COUNT + CLOSED_COUNT + MERGED_COUNT))

echo "## Summary" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"
echo "- **Total PRs Analyzed**: ${TOTAL}" >> "${OUTPUT_FILE}"
echo "- **Open**: ${OPEN_COUNT}" >> "${OUTPUT_FILE}"
echo "- **Closed**: ${CLOSED_COUNT}" >> "${OUTPUT_FILE}"
echo "- **Merged**: ${MERGED_COUNT}" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Categorize PRs
echo "## PRs by Category" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Helper function to categorize PR
categorize_pr() {
    local title="$1"
    local labels="$2"
    
    # Check labels first
    if echo "$labels" | jq -e '.[] | select(.name | test("bug|fix|hotfix"; "i"))' > /dev/null 2>&1; then
        echo "🐛 Bug Fix"
    elif echo "$labels" | jq -e '.[] | select(.name | test("feature|feat|enhancement"; "i"))' > /dev/null 2>&1; then
        echo "✨ Feature"
    elif echo "$labels" | jq -e '.[] | select(.name | test("refactor|cleanup"; "i"))' > /dev/null 2>&1; then
        echo "♻️  Refactor"
    elif echo "$labels" | jq -e '.[] | select(.name | test("docs|documentation"; "i"))' > /dev/null 2>&1; then
        echo "📝 Documentation"
    elif echo "$title" | grep -qiE "fix|bug|error"; then
        echo "🐛 Bug Fix"
    elif echo "$title" | grep -qiE "feat|feature|add|implement"; then
        echo "✨ Feature"
    elif echo "$title" | grep -qiE "refactor|cleanup|remove"; then
        echo "♻️  Refactor"
    elif echo "$title" | grep -qiE "docs|readme|documentation"; then
        echo "📝 Documentation"
    else
        echo "📦 Other"
    fi
}

# Process open PRs
if [ "$OPEN_COUNT" -gt 0 ]; then
    echo "### 🔓 Open PRs (${OPEN_COUNT})" >> "${OUTPUT_FILE}"
    echo "" >> "${OUTPUT_FILE}"
    echo "| # | Title | Author | Created | Status | Category |" >> "${OUTPUT_FILE}"
    echo "|---|-------|--------|---------|--------|----------|" >> "${OUTPUT_FILE}"
    
    jq -r '.[] | "\(.number)|\(.title)|\(.author.login)|\(.createdAt)|\(if .isDraft then "Draft" elif .reviewDecision == "APPROVED" then "✅ Approved" elif .reviewDecision == "CHANGES_REQUESTED" then "⚠️ Changes" elif .reviewDecision == "REVIEW_REQUIRED" then "🔍 Review" else "⏳ Pending" end)|\(.labels)"' "${TEMP_FILE}.open.json" | while IFS='|' read -r num title author created status labels; do
        category=$(categorize_pr "$title" "$labels")
        echo "| [#${num}]($(gh pr view ${num} --repo "${REPO}" --json url -q .url)) | ${title} | ${author} | ${created} | ${status} | ${category} |" >> "${OUTPUT_FILE}"
    done
    echo "" >> "${OUTPUT_FILE}"
fi

# Process merged PRs
if [ "$MERGED_COUNT" -gt 0 ]; then
    echo "### ✅ Merged PRs (${MERGED_COUNT})" >> "${OUTPUT_FILE}"
    echo "" >> "${OUTPUT_FILE}"
    echo "| # | Title | Author | Merged | Category |" >> "${OUTPUT_FILE}"
    echo "|---|-------|--------|--------|----------|" >> "${OUTPUT_FILE}"
    
    jq -r '.[] | "\(.number)|\(.title)|\(.author.login)|\(.updatedAt)|\(.labels)"' "${TEMP_FILE}.merged.json" | while IFS='|' read -r num title author merged labels; do
        category=$(categorize_pr "$title" "$labels")
        echo "| [#${num}]($(gh pr view ${num} --repo "${REPO}" --json url -q .url)) | ${title} | ${author} | ${merged} | ${category} |" >> "${OUTPUT_FILE}"
    done
    echo "" >> "${OUTPUT_FILE}"
fi

# Process closed PRs
if [ "$CLOSED_COUNT" -gt 0 ]; then
    echo "### ❌ Closed PRs (${CLOSED_COUNT})" >> "${OUTPUT_FILE}"
    echo "" >> "${OUTPUT_FILE}"
    echo "| # | Title | Author | Closed | Category |" >> "${OUTPUT_FILE}"
    echo "|---|-------|--------|--------|----------|" >> "${OUTPUT_FILE}"
    
    jq -r '.[] | "\(.number)|\(.title)|\(.author.login)|\(.updatedAt)|\(.labels)"' "${TEMP_FILE}.closed.json" | while IFS='|' read -r num title author closed labels; do
        category=$(categorize_pr "$title" "$labels")
        echo "| [#${num}]($(gh pr view ${num} --repo "${REPO}" --json url -q .url)) | ${title} | ${author} | ${closed} | ${category} |" >> "${OUTPUT_FILE}"
    done
    echo "" >> "${OUTPUT_FILE}"
fi

# Action Items
echo "## Action Items" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"
echo "### Needs Attention" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"

# Find PRs that need attention
jq -r '.[] | select(.isDraft == false and (.reviewDecision == "REVIEW_REQUIRED" or .reviewDecision == "CHANGES_REQUESTED" or .reviewDecision == null)) | "1. [#\(.number)](\(.url)) - \(.title) (Author: \(.author.login))"' "${TEMP_FILE}.open.json" >> "${OUTPUT_FILE}" 2>/dev/null || echo "None found" >> "${OUTPUT_FILE}"

echo "" >> "${OUTPUT_FILE}"
echo "---" >> "${OUTPUT_FILE}"
echo "" >> "${OUTPUT_FILE}"
echo "Report generated by PR Triage Script" >> "${OUTPUT_FILE}"

# Cleanup
rm -f "${TEMP_FILE}".*.json

echo "✅ Triage report generated: ${OUTPUT_FILE}"
echo ""
echo "View the report: cat ${OUTPUT_FILE} | less"

