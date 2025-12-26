# PR Triage Guide

This guide helps you analyze and triage pull requests for completion status.

## Quick Start

### Step 1: Authenticate with GitHub CLI

```bash
gh auth login
```

Follow the prompts to authenticate. Choose:
- GitHub.com
- HTTPS
- Login with a web browser (recommended)

### Step 2: Run the Triage Script

**Option A: Node.js (Recommended)**
```bash
node scripts/triage-prs.js
```

**Option B: Bash**
```bash
bash scripts/triage-prs.sh
```

### Step 3: Review the Report

The script generates `pr-triage-report.md` with:
- Summary statistics
- PRs categorized by type (Bug Fix, Feature, Refactor, etc.)
- Open PRs with review status
- Action items (PRs needing review, changes requested, drafts)

## Understanding the Categories

- 🐛 **Bug Fix**: Fixes for bugs or errors
- ✨ **Feature**: New features or functionality
- ♻️ **Refactor**: Code refactoring or cleanup
- 📝 **Documentation**: Documentation updates
- 🧪 **Test**: Test-related changes
- 🚀 **CI/CD**: CI/CD pipeline changes
- 📦 **Other**: Everything else

## Review Status

- ✅ **Approved**: PR has been approved
- ⚠️ **Changes Requested**: Reviewer requested changes
- 🔍 **Review Required**: PR needs review
- ⏳ **Pending Review**: Waiting for review
- 📝 **Draft**: PR is still in draft

## Next Steps After Triage

1. **Review Open PRs**: Focus on PRs marked "Review Required" or "Pending Review"
2. **Address Changes**: Review PRs with "Changes Requested" status
3. **Clean Up Drafts**: Check if draft PRs are still needed
4. **Close Stale PRs**: Consider closing PRs that haven't been updated in a while
5. **Merge Ready PRs**: Merge PRs that are approved and passing checks

## Tips

- Run the script regularly to keep track of PR status
- Filter by category to focus on specific types of work
- Use the action items section to prioritize your review work
- Check for PRs that have been open for a long time (stale PRs)

