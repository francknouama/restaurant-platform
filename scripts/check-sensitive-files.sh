#!/bin/bash
# Check for sensitive files that should not be committed

set -e

# Sensitive file patterns
SENSITIVE_FILES=(
    ".env"
    ".env.local"
    ".env.production"
    "*.pem"
    "*.key"
    "*.p12"
    "*.pfx"
    "id_rsa"
    "id_dsa"
    "id_ecdsa"
    "id_ed25519"
    ".ssh/config"
    "*.sql"
    "*.db"
    "*.sqlite"
    "credentials.json"
    "service-account.json"
    "firebase-*.json"
    ".aws/credentials"
    ".npmrc"
    "*.log"
)

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo "WARNING: No .gitignore file found!"
fi

ERRORS=0

# Check for sensitive files in staged changes
for pattern in "${SENSITIVE_FILES[@]}"; do
    files=$(git diff --cached --name-only | grep -E "$pattern" || true)
    
    if [ -n "$files" ]; then
        echo "ERROR: Attempting to commit sensitive file(s):"
        echo "$files"
        ERRORS=$((ERRORS + 1))
    fi
done

# Check for large files
LARGE_FILES=$(git diff --cached --name-only | xargs -I {} sh -c 'if [ -f "{}" ]; then size=$(stat -f%z "{}" 2>/dev/null || stat -c%s "{}" 2>/dev/null); if [ "$size" -gt 5242880 ]; then echo "{}"; fi; fi' || true)

if [ -n "$LARGE_FILES" ]; then
    echo "WARNING: Large files detected (>5MB):"
    echo "$LARGE_FILES"
fi

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Found $ERRORS sensitive file(s) in staged changes."
    echo "Please remove these files and add them to .gitignore."
    exit 1
fi

exit 0