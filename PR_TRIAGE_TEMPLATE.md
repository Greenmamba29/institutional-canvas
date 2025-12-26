# PR Triage Template - Institutional Canvas

**Repository**: Greenmamba29/institutional-canvas  
**Date**: 2025-12-25  
**Target**: Analyze and triage 93 PRs for completion status

---

## Quick Stats from Git History

- **Total Commits**: 93
- **Total PRs to Triage**: 93
- **Merge Commits** (merged PRs): 34
- **Main Contributors**: 
  - gpt-engineer-app[bot]: 66 commits
  - Greenmamba29: 26 commits
  - Lovable: 1 commit

---

## Triage Categories

### By Status
- [ ] ✅ **Ready to Merge** - Approved, all checks passing
- [ ] 🔍 **Needs Review** - Waiting for code review
- [ ] ⚠️ **Changes Requested** - Reviewer requested updates
- [ ] 📝 **Draft** - Work in progress, not ready for review
- [ ] 🚫 **Should Close** - Stale, duplicate, or no longer needed
- [ ] ✅ **Merged** - Already completed
- [ ] ❌ **Closed** - Rejected or abandoned

### By Category
- 🐛 **Bug Fix** - Fixes errors or issues
- ✨ **Feature** - Adds new functionality  
- ♻️ **Refactor** - Code improvement
- 📝 **Documentation** - Updates to docs
- 🔒 **Security** - Security improvements
- 🚀 **CI/CD** - Pipeline/deployment changes
- 🎨 **UI/UX** - Interface improvements
- 📦 **Dependencies** - Package updates
- 🧪 **Tests** - Test coverage
- 🔧 **Config** - Configuration changes

### By Priority
- 🔥 **P0 - Critical** - Blocking production or other work
- ⚡ **P1 - High** - Important feature or major bug fix
- 📌 **P2 - Medium** - Standard work items
- 🔽 **P3 - Low** - Nice to have, can wait

---

## PR Triage Checklist

For each PR, fill out:

```
PR #: ____
Title: _____________________________
Author: _____________________________
Status: [ ] Open [ ] Draft [ ] Merged [ ] Closed
Category: _____________________________
Priority: [ ] P0 [ ] P1 [ ] P2 [ ] P3

Review Status:
- [ ] Approved
- [ ] Needs Review
- [ ] Changes Requested
- [ ] Not Reviewed

Checks:
- [ ] CI Passing
- [ ] Tests Passing
- [ ] No Conflicts
- [ ] Documentation Updated

Notes:
___________________________________
___________________________________

Action Required:
[ ] Review
[ ] Approve
[ ] Request Changes
[ ] Merge
[ ] Close
[ ] No Action Needed
```

---

## Common PR Patterns (from commit history)

Based on recent commits, common PR types include:

1. **Auth/Redirect Fixes** - Password reset, redirect handling
2. **Security Fixes** - RLS policies, audit logging
3. **Feature Additions** - MVP action forms, realtime updates
4. **Refactoring** - Code cleanup, console.log removal
5. **Documentation** - Deployment guides, workflow docs
6. **Backend Changes** - RPC functions, database migrations

---

## Triage Process

1. **Start with Open PRs** - These need immediate attention
2. **Filter by Review Status** - Focus on "Needs Review" first
3. **Check for Blockers** - Identify PRs blocking other work
4. **Review Draft PRs** - Decide if ready or should close
5. **Clean Up Stale PRs** - PRs older than 30 days need attention
6. **Archive Completed** - Mark merged/closed PRs as done

---

## Next Steps

1. Access GitHub PRs: https://github.com/Greenmamba29/institutional-canvas/pulls
2. Use filters to organize:
   - State: `is:open`, `is:closed`, `is:merged`
   - Review: `review:required`, `review:approved`
   - Author: Filter by contributor
   - Label: Filter by category labels
3. Fill out the checklist for each PR
4. Create action items based on triage results

---

## Generated Files

- `scripts/triage-prs.js` - Automated PR analysis script (requires `gh auth login`)
- `scripts/triage-prs.sh` - Bash version of triage script
- `commit-analysis.md` - Git commit analysis report
- `PR_TRIAGE_GUIDE.md` - Detailed triage guide

