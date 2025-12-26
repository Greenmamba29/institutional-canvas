#!/bin/bash
# Analyze git commits to help understand PR patterns
# This can help identify PR-related commits

REPO_DIR="${1:-.}"
OUTPUT="commit-analysis.md"

cd "$REPO_DIR" || exit 1

echo "# Commit Analysis Report" > "$OUTPUT"
echo "" >> "$OUTPUT"
echo "Generated: $(date)" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Total commits
TOTAL=$(git log --all --oneline | wc -l | tr -d ' ')
echo "## Summary" >> "$OUTPUT"
echo "- **Total Commits**: $TOTAL" >> "$OUTPUT"
echo "" >> "$OUTPUT"

# Commits by author
echo "## Commits by Author" >> "$OUTPUT"
echo "" >> "$OUTPUT"
git log --all --format='%an' | sort | uniq -c | sort -rn | head -20 | while read count author; do
  echo "- $author: $count commits" >> "$OUTPUT"
done
echo "" >> "$OUTPUT"

# Recent commits
echo "## Recent Commits (Last 50)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "| Hash | Author | Date | Message |" >> "$OUTPUT"
echo "|------|--------|------|---------|" >> "$OUTPUT"
git log --all --format="%h|%an|%ad|%s" --date=short -50 | while IFS='|' read hash author date message; do
  echo "| $hash | $author | $date | ${message:0:80} |" >> "$OUTPUT"
done
echo "" >> "$OUTPUT"

# Merge commits (potential PRs)
echo "## Merge Commits (Potential PRs)" >> "$OUTPUT"
echo "" >> "$OUTPUT"
MERGE_COUNT=$(git log --all --merges --oneline | wc -l | tr -d ' ')
echo "**Total Merge Commits**: $MERGE_COUNT" >> "$OUTPUT"
echo "" >> "$OUTPUT"
echo "| Hash | Author | Date | Message |" >> "$OUTPUT"
echo "|------|--------|------|---------|" >> "$OUTPUT"
git log --all --merges --format="%h|%an|%ad|%s" --date=short | head -50 | while IFS='|' read hash author date message; do
  echo "| $hash | $author | $date | ${message:0:80} |" >> "$OUTPUT"
done

echo "✅ Analysis complete: $OUTPUT"

