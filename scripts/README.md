# GitHub Project Setup Scripts

## Quick Setup (Recommended)

1. **Authenticate with project permissions:**
   ```bash
   gh auth refresh -s project,read:project --hostname github.com
   ```
   This will open a browser window for OAuth authentication.

2. **Run the quick setup:**
   ```bash
   ./scripts/quick-project-setup.sh
   ```

## Full Setup (Advanced)

For complete project organization with custom fields and views:

```bash
./scripts/setup-github-project.sh
```

This creates:
- Custom fields (Priority, Component, Sprint, Story Points)
- Multiple project views
- Automatic issue organization
- Sprint-based filtering

## Manual Project Commands

If you prefer to run commands manually:

```bash
# Create project
gh project create --title "Restaurant Platform Development"

# Add issues to project (replace PROJECT_ID)
gh issue list --json id | jq -r '.[].id' | while read issue_id; do
  gh project item-add PROJECT_ID --content-id $issue_id
done

# Create views
gh project view-create PROJECT_ID --title "Sprint 1" --filter "milestone:\"Sprint 1: Foundation Testing\""
```

## Troubleshooting

### Permission Error
```
error: your authentication token is missing required scopes [project read:project]
```
**Solution:** Run `gh auth refresh -s project,read:project --hostname github.com`

### Project Not Found
**Solution:** Ensure you're authenticated and have access to the repository.

## What Gets Created

- ✅ GitHub Project board
- ✅ All 20 issues added to project  
- ✅ Sprint-based organization
- ✅ Priority and component views
- ✅ Ready for team collaboration