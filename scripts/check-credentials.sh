#!/bin/bash
# Check for hardcoded credentials and sensitive information

set -e

# Patterns to check for potential credentials
PATTERNS=(
    # API Keys and tokens
    "api[_-]?key.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    "token.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    "secret.*=.*['\"][a-zA-Z0-9]{20,}['\"]"
    
    # Passwords
    "password.*=.*['\"][^'\"]{8,}['\"]"
    "passwd.*=.*['\"][^'\"]{8,}['\"]"
    "pwd.*=.*['\"][^'\"]{8,}['\"]"
    
    # Database credentials
    "db_pass.*=.*['\"][^'\"]+['\"]"
    "database_password.*=.*['\"][^'\"]+['\"]"
    
    # AWS credentials
    "aws_access_key_id.*=.*[A-Z0-9]{20}"
    "aws_secret_access_key.*=.*[a-zA-Z0-9/+=]{40}"
    
    # Private keys
    "-----BEGIN (RSA |EC |DSA |)PRIVATE KEY-----"
    "-----BEGIN OPENSSH PRIVATE KEY-----"
    
    # Connection strings with credentials
    "mongodb://[^:]+:[^@]+@"
    "postgres://[^:]+:[^@]+@"
    "mysql://[^:]+:[^@]+@"
)

# Whitelist patterns (false positives)
WHITELIST=(
    "password.*=.*os\.Getenv"
    "password.*=.*viper\."
    "password.*=.*config\."
    "password.*=.*\\$\\{"
    "token.*=.*\\$\\{"
    "secret.*=.*\\$\\{"
    "example\.com"
    "localhost"
    "password123"
    "changeme"
    "your[_-]?password"
)

ERRORS=0

for file in "$@"; do
    # Skip binary files
    if file "$file" | grep -q "binary"; then
        continue
    fi
    
    # Skip test files (they might have test credentials)
    if [[ "$file" =~ _test\.go$ ]] || [[ "$file" =~ \.test\.(js|ts)$ ]]; then
        continue
    fi
    
    for pattern in "${PATTERNS[@]}"; do
        matches=$(grep -inE "$pattern" "$file" 2>/dev/null || true)
        
        if [ -n "$matches" ]; then
            # Check against whitelist
            whitelisted=false
            for whitelist in "${WHITELIST[@]}"; do
                if echo "$matches" | grep -qE "$whitelist"; then
                    whitelisted=true
                    break
                fi
            done
            
            if [ "$whitelisted" = false ]; then
                echo "ERROR: Potential credential found in $file:"
                echo "$matches"
                ERRORS=$((ERRORS + 1))
            fi
        fi
    done
done

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo "Found $ERRORS potential hardcoded credentials."
    echo "Please use environment variables or secure configuration management instead."
    exit 1
fi

exit 0