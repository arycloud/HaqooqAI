#!/bin/bash

# HaqooqAI Git Setup Verification Script
# This script verifies that the Git workflow has been set up correctly

set -e

echo "🔍 Verifying HaqooqAI Git Workflow Setup"
echo "========================================"

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a Git repository"
    exit 1
fi

echo "✅ Git repository found"

# Check remote configuration
echo "🌐 Checking remote configuration..."
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "none")
if [ "$REMOTE_URL" = "none" ]; then
    echo "❌ Error: No remote origin configured"
    exit 1
fi
echo "✅ Remote origin: $REMOTE_URL"

# Check all branches exist
echo "🌿 Checking branch structure..."
BRANCHES=("main" "develop" "frontend" "backend")
MISSING_BRANCHES=()

for branch in "${BRANCHES[@]}"; do
    if git show-ref --verify --quiet "refs/heads/$branch"; then
        echo "✅ Branch '$branch' exists locally"
    else
        echo "❌ Branch '$branch' missing locally"
        MISSING_BRANCHES+=("$branch")
    fi
    
    if git ls-remote --exit-code --heads origin "$branch" >/dev/null 2>&1; then
        echo "✅ Branch '$branch' exists on remote"
    else
        echo "❌ Branch '$branch' missing on remote"
        MISSING_BRANCHES+=("$branch-remote")
    fi
done

# Check GitHub Actions workflows
echo "⚙️  Checking GitHub Actions workflows..."
WORKFLOWS=("deploy-frontend.yml" "deploy-backend.yml")
MISSING_WORKFLOWS=()

for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo "✅ Workflow '$workflow' exists"
    else
        echo "❌ Workflow '$workflow' missing"
        MISSING_WORKFLOWS+=("$workflow")
    fi
done

# Check branch tracking
echo "📡 Checking branch tracking..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

git branch -vv | while read -r line; do
    if [[ $line == *"["*"origin/"*"]"* ]]; then
        echo "✅ $line (tracking remote)"
    elif [[ $line == *"*"* ]]; then
        echo "⚠️  $line (current branch)"
    else
        echo "❌ $line (not tracking remote)"
    fi
done

# Check deployment strategy documentation
echo "📋 Checking documentation..."
if [ -f "DEPLOYMENT_STRATEGY.md" ]; then
    echo "✅ DEPLOYMENT_STRATEGY.md exists"
else
    echo "❌ DEPLOYMENT_STRATEGY.md missing"
fi

# Summary
echo ""
echo "📊 SETUP VERIFICATION SUMMARY"
echo "============================"

if [ ${#MISSING_BRANCHES[@]} -eq 0 ] && [ ${#MISSING_WORKFLOWS[@]} -eq 0 ]; then
    echo "🎉 All checks passed! Git workflow is properly set up."
    echo ""
    echo "📋 Next steps for manual configuration:"
    echo "1. Go to GitHub repository: https://github.com/arycloud/HaqooqAI"
    echo "2. Configure branch protection rules:"
    echo "   - Settings > Branches > Add branch protection rule"
    echo "   - Follow guidelines in DEPLOYMENT_STRATEGY.md"
    echo "3. Add required secrets:"
    echo "   - Settings > Secrets and variables > Actions"
    echo "   - Add all secrets listed in DEPLOYMENT_STRATEGY.md"
    echo "4. Enable GitHub Pages:"
    echo "   - Settings > Pages > Source: GitHub Actions"
else
    echo "⚠️  Some issues found:"
    if [ ${#MISSING_BRANCHES[@]} -gt 0 ]; then
        echo "   - Missing branches: ${MISSING_BRANCHES[*]}"
    fi
    if [ ${#MISSING_WORKFLOWS[@]} -gt 0 ]; then
        echo "   - Missing workflows: ${MISSING_WORKFLOWS[*]}"
    fi
    echo ""
    echo "🔧 Run the setup script again: ./setup-git-workflow.sh"
fi

echo ""
echo "🌐 Repository URL: https://github.com/arycloud/HaqooqAI"
echo "📖 Documentation: DEPLOYMENT_STRATEGY.md"
