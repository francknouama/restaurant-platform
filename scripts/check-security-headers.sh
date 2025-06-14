#!/bin/bash
# Check for security headers in nginx configuration files

set -e

REQUIRED_HEADERS=(
    "X-Frame-Options"
    "X-Content-Type-Options"
    "X-XSS-Protection"
    "Strict-Transport-Security"
    "Content-Security-Policy"
    "Referrer-Policy"
    "Permissions-Policy"
)

ERRORS=0

for file in "$@"; do
    echo "Checking security headers in: $file"
    
    for header in "${REQUIRED_HEADERS[@]}"; do
        if ! grep -q "$header" "$file"; then
            echo "ERROR: Missing security header '$header' in $file"
            ERRORS=$((ERRORS + 1))
        fi
    done
done

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Found $ERRORS missing security headers."
    echo "Please add the missing headers to your nginx configuration."
    exit 1
fi

echo "All security headers present."
exit 0