#!/bin/bash

# GitHub Project Setup Script
# Run this script after authenticating with: gh auth refresh -s project,read:project

set -e

echo "🚀 Setting up Restaurant Platform GitHub Project..."

# 1. Use existing project (already created)
echo "📋 Getting existing project..."
PROJECT_NUMBER=$(gh project list --owner "@me" --format json | jq -r '.projects[] | select(.title == "Restaurant Platform Development") | .number')
if [ -z "$PROJECT_NUMBER" ]; then
  echo "❌ Project not found. Run quick-project-setup.sh first."
  exit 1
fi
echo "✅ Using project #$PROJECT_NUMBER"

# 2. Add custom fields
echo "🏷️ Adding custom fields..."

# Add Priority field
gh project field-create $PROJECT_ID --name "Priority" --type "single_select" \
  --single-select-option "🔴 Critical" \
  --single-select-option "🟡 High" \
  --single-select-option "🟢 Medium" \
  --single-select-option "⚪ Low"

# Add Component field  
gh project field-create $PROJECT_ID --name "Component" --type "single_select" \
  --single-select-option "Frontend - Shell" \
  --single-select-option "Frontend - Menu MFE" \
  --single-select-option "Frontend - Orders MFE" \
  --single-select-option "Frontend - Kitchen MFE" \
  --single-select-option "Frontend - Inventory MFE" \
  --single-select-option "Frontend - Reservations MFE" \
  --single-select-option "Frontend - Shared Packages" \
  --single-select-option "Backend - Menu Service" \
  --single-select-option "Backend - Order Service" \
  --single-select-option "Backend - Kitchen Service" \
  --single-select-option "Backend - Reservation Service" \
  --single-select-option "Backend - Inventory Service" \
  --single-select-option "Backend - User Service" \
  --single-select-option "DevOps - Infrastructure" \
  --single-select-option "DevOps - Security" \
  --single-select-option "Testing - Integration" \
  --single-select-option "Documentation"

# Add Sprint field
gh project field-create $PROJECT_ID --name "Sprint" --type "single_select" \
  --single-select-option "Sprint 1: Foundation" \
  --single-select-option "Sprint 2: Frontend" \
  --single-select-option "Sprint 3: Backend" \
  --single-select-option "Sprint 4: Integration"

# Add Story Points field
gh project field-create $PROJECT_ID --name "Story Points" --type "number"

echo "✅ Custom fields added"

# 3. Add all issues to the project
echo "📝 Adding issues to project..."

# Get all issue numbers
ISSUES=$(gh issue list --limit 50 --json number --jq '.[].number')

for issue in $ISSUES; do
  echo "  Adding issue #$issue..."
  gh project item-add $PROJECT_ID --content-id $(gh issue view $issue --json id --jq '.id')
done

echo "✅ All issues added to project"

# 4. Set up project views
echo "👁️ Creating project views..."

# Create Sprint 1 view
gh project view-create $PROJECT_ID --title "Sprint 1: Foundation Testing" \
  --filter "milestone:\"Sprint 1: Foundation Testing\""

# Create Sprint 2 view  
gh project view-create $PROJECT_ID --title "Sprint 2: Frontend Testing" \
  --filter "milestone:\"Sprint 2: Frontend Testing\""

# Create Sprint 3 view
gh project view-create $PROJECT_ID --title "Sprint 3: Backend Testing" \
  --filter "milestone:\"Sprint 3: Backend Testing\""

# Create Sprint 4 view
gh project view-create $PROJECT_ID --title "Sprint 4: Integration & Infrastructure" \
  --filter "milestone:\"Sprint 4: Integration & Infrastructure\""

# Create Priority view
gh project view-create $PROJECT_ID --title "By Priority" \
  --filter "state:open" --group-by "Priority"

# Create Team view
gh project view-create $PROJECT_ID --title "By Component" \
  --filter "state:open" --group-by "Component"

echo "✅ Project views created"

# 5. Configure project items with metadata
echo "🎯 Configuring issue metadata..."

# Sprint 1 issues
declare -A SPRINT1_ISSUES=(
  [2]="Frontend - Shell,🟡 High,Sprint 1: Foundation,5"
  [8]="Frontend - Shared Packages,🟡 High,Sprint 1: Foundation,8"
  [9]="Frontend - Shared Packages,🟡 High,Sprint 1: Foundation,8"
  [15]="Backend - User Service,🟡 High,Sprint 1: Foundation,8"
  [20]="DevOps - Security,🔴 Critical,Sprint 1: Foundation,5"
)

# Sprint 2 issues  
declare -A SPRINT2_ISSUES=(
  [3]="Frontend - Menu MFE,🟡 High,Sprint 2: Frontend,5"
  [4]="Frontend - Orders MFE,🟡 High,Sprint 2: Frontend,5"
  [5]="Frontend - Kitchen MFE,🟡 High,Sprint 2: Frontend,5"
  [6]="Frontend - Inventory MFE,🟡 High,Sprint 2: Frontend,5"
  [7]="Frontend - Reservations MFE,🟡 High,Sprint 2: Frontend,5"
)

# Sprint 3 issues
declare -A SPRINT3_ISSUES=(
  [10]="Backend - Menu Service,🟡 High,Sprint 3: Backend,5"
  [11]="Backend - Order Service,🟡 High,Sprint 3: Backend,5" 
  [12]="Backend - Kitchen Service,🟡 High,Sprint 3: Backend,5"
  [13]="Backend - Reservation Service,🟡 High,Sprint 3: Backend,5"
  [14]="Backend - Inventory Service,🟡 High,Sprint 3: Backend,5"
)

# Sprint 4 issues
declare -A SPRINT4_ISSUES=(
  [16]="Testing - Integration,🟢 Medium,Sprint 4: Integration,8"
  [17]="Testing - Integration,🟢 Medium,Sprint 4: Integration,8"
  [18]="DevOps - Infrastructure,🟢 Medium,Sprint 4: Integration,13"
  [19]="Documentation,🟢 Medium,Sprint 4: Integration,5"
  [21]="DevOps - Infrastructure,🟢 Medium,Sprint 4: Integration,13"
)

# Function to set issue metadata
set_issue_metadata() {
  local issue_num=$1
  local component=$2
  local priority=$3
  local sprint=$4
  local points=$5
  
  local item_id=$(gh project item-list $PROJECT_ID --format json | jq -r ".items[] | select(.content.number == $issue_num) | .id")
  
  if [ -n "$item_id" ]; then
    echo "  Setting metadata for issue #$issue_num..."
    gh project item-edit --project-id $PROJECT_ID --id $item_id \
      --field-name "Component" --single-select-option-value "$component" \
      --field-name "Priority" --single-select-option-value "$priority" \
      --field-name "Sprint" --single-select-option-value "$sprint" \
      --field-name "Story Points" --number-value "$points"
  fi
}

# Apply metadata to all issues
for issue in "${!SPRINT1_ISSUES[@]}"; do
  IFS=',' read -r component priority sprint points <<< "${SPRINT1_ISSUES[$issue]}"
  set_issue_metadata $issue "$component" "$priority" "$sprint" "$points"
done

for issue in "${!SPRINT2_ISSUES[@]}"; do
  IFS=',' read -r component priority sprint points <<< "${SPRINT2_ISSUES[$issue]}"
  set_issue_metadata $issue "$component" "$priority" "$sprint" "$points"
done

for issue in "${!SPRINT3_ISSUES[@]}"; do
  IFS=',' read -r component priority sprint points <<< "${SPRINT3_ISSUES[$issue]}"
  set_issue_metadata $issue "$component" "$priority" "$sprint" "$points"
done

for issue in "${!SPRINT4_ISSUES[@]}"; do
  IFS=',' read -r component priority sprint points <<< "${SPRINT4_ISSUES[$issue]}"
  set_issue_metadata $issue "$component" "$priority" "$sprint" "$points"
done

echo "✅ Issue metadata configured"

echo ""
echo "🎉 GitHub Project setup complete!"
echo "📊 Project URL: https://github.com/users/$(gh api user --jq '.login')/projects/$(gh project list --format json | jq -r '.projects[] | select(.title == "Restaurant Platform Development") | .number')"
echo ""
echo "📋 Summary:"
echo "  - Project created with custom fields"
echo "  - $(echo "$ISSUES" | wc -l) issues added to project"
echo "  - 6 different views created"
echo "  - All issues organized by sprint, priority, and component"
echo ""
echo "🚀 Ready to start Sprint 1!"