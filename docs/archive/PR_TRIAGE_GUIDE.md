# PR Triage Guide - Analyzing 93 Pull Requests

## Understanding Your PRs

You have **93 PRs** to triage. Here's how to analyze them:
1. **Open Pull Requests** on GitHub that need review/action
2. **Closed PRs** that need to be analyzed for completion
3. **Draft PRs** that need triage
4. **Issues** that were converted to PRs

## Direct GitHub Access

Since the repository is accessible, the best approach is:

### Option 1: Use GitHub Web Interface (Recommended)
1. Go to: https://github.com/Greenmamba29/institutional-canvas/pulls
2. Filter by:
   - State: `Open`, `Closed`, or `All`
   - Label: `bug`, `feature`, `documentation`, etc.
   - Author: Filter by contributor
3. Use GitHub's built-in search and filters

### Option 2: Use GitHub CLI (If Authenticated)
```bash
# Authenticate first
gh auth login

# Then run our triage script
node scripts/triage-prs.js
```

### Option 3: Manual Triage Checklist

For each PR, categorize by:

#### Status
- [ ] ✅ **Ready to Merge** - Approved, passing checks
- [ ] 🔍 **Needs Review** - Waiting for reviewer
- [ ] ⚠️ **Changes Requested** - Needs updates
- [ ] 📝 **Draft** - Not ready for review
- [ ] 🚫 **Should Close** - Stale or no longer needed

#### Category
- 🐛 **Bug Fix** - Fixes errors or issues
- ✨ **Feature** - Adds new functionality
- ♻️ **Refactor** - Code improvement without new features
- 📝 **Documentation** - Updates to docs
- 🧪 **Test** - Test-related changes
- 🚀 **CI/CD** - Pipeline or deployment changes
- 📦 **Other** - Everything else

#### Priority
- 🔥 **Critical** - Blocking other work or production issues
- ⚡ **High** - Important feature or fix
- 📌 **Medium** - Standard work
- 🔽 **Low** - Nice to have, can wait

## Quick Triage Process

1. **Start with Open PRs** - These need immediate attention
2. **Check Review Status** - Focus on "Review Required" first
3. **Identify Blockers** - PRs that are blocking other work
4. **Review Draft PRs** - Decide if they should be activated or closed
5. **Clean Up Stale PRs** - Close PRs that haven't been updated in 30+ days

## Next Steps

Would you like me to:
1. Help you access the GitHub PR list through the browser?
2. Create a template for manual PR triage?
3. Set up automated PR analysis once authentication is configured?

