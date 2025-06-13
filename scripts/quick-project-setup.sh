#!/bin/bash

# Quick GitHub Project Setup
# Run this after: gh auth refresh -s project,read:project --hostname github.com

set -e

echo "🚀 Quick GitHub Project Setup..."

# Check if gh CLI has project permissions
if ! gh project list &>/dev/null; then
  echo "❌ Error: Missing project permissions. Run:"
  echo "   gh auth refresh -s project,read:project --hostname github.com"
  exit 1
fi

# Create project
echo "📋 Creating project..."
PROJECT_NUMBER=$(gh project create --title "Restaurant Platform Development" --owner "@me" --format json | jq -r '.number')
echo "✅ Project created: #$PROJECT_NUMBER"

# Add all issues
echo "📝 Adding issues to project..."
gh issue list --limit 25 --json url | jq -r '.[].url' | while read issue_url; do
  echo "  Adding issue: $issue_url"
  gh project item-add $PROJECT_NUMBER --owner "@me" --url "$issue_url"
done

echo "✅ Setup complete!"
echo "🌐 View your project at: https://github.com/francknouama/restaurant-platform/projects"