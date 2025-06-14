# Security Scanning and Policies

This document describes the security measures, scanning procedures, and policies implemented in the Restaurant Platform project.

## Table of Contents

1. [Overview](#overview)
2. [Security Scanning Tools](#security-scanning-tools)
3. [Automated Security Checks](#automated-security-checks)
4. [Pre-commit Hooks](#pre-commit-hooks)
5. [Security Headers](#security-headers)
6. [Dependency Management](#dependency-management)
7. [Container Security](#container-security)
8. [Secret Management](#secret-management)
9. [Security Reporting](#security-reporting)
10. [OWASP Compliance](#owasp-compliance)
11. [Incident Response](#incident-response)

## Overview

The Restaurant Platform implements multiple layers of security scanning and protection:

- **Dependency Scanning**: Automated vulnerability detection in dependencies
- **SAST**: Static Application Security Testing for code vulnerabilities
- **Container Scanning**: Docker image vulnerability detection
- **Secret Detection**: Prevention of credential leaks
- **Security Headers**: Protection against common web vulnerabilities
- **Automated Updates**: Dependabot for dependency updates

## Security Scanning Tools

### 1. Go Security Tools

- **gosec**: Go security analyzer
- **go-critic**: Go code quality checker
- **nancy**: Vulnerability scanner for Go dependencies

### 2. JavaScript/TypeScript Security

- **npm audit**: Built-in npm security scanner
- **Snyk**: Advanced vulnerability detection
- **ESLint Security Plugin**: Code-level security checks

### 3. Container Security

- **Trivy**: Container vulnerability scanner
- **Docker Scout**: Native Docker security scanning

### 4. Secret Detection

- **TruffleHog**: Secret scanning in git history
- **detect-secrets**: Pre-commit secret detection
- **GitGuardian**: GitHub integration for secret detection

### 5. SAST Tools

- **CodeQL**: GitHub's semantic code analysis
- **SonarQube**: Comprehensive code quality and security analysis

## Automated Security Checks

### GitHub Actions Workflow

The security workflow (`.github/workflows/security.yml`) runs:

1. **On every push and PR** to main/develop branches
2. **Daily scheduled scans** at 2 AM UTC
3. **Manual trigger** via workflow_dispatch

#### Workflow Jobs

```yaml
jobs:
  go-security:        # Go vulnerability scanning
  npm-security:       # NPM dependency scanning  
  container-security: # Docker image scanning
  secret-detection:   # Secret scanning
  sast:              # Static analysis
  security-headers:   # Header validation
  owasp-dependency:   # OWASP dependency check
  license-check:      # License compliance
  security-report:    # Consolidated reporting
```

### Running Security Scans Locally

```bash
# Go security scan
cd backend
gosec ./...
go list -json -m all | nancy sleuth

# NPM security scan
cd frontend-mfe
npm audit
npm audit fix

# Container scan
docker build -t myapp:latest .
trivy image myapp:latest

# Secret detection
detect-secrets scan --baseline .secrets.baseline
trufflehog git file://. --since-commit HEAD
```

## Pre-commit Hooks

Install pre-commit hooks to catch security issues before commit:

```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Hook Configuration

The `.pre-commit-config.yaml` includes:

- TruffleHog for secrets
- detect-secrets for credential detection
- gosec for Go security
- hadolint for Dockerfile security
- ESLint security rules for JavaScript

## Security Headers

All HTTP responses include security headers:

```nginx
# Prevent clickjacking
X-Frame-Options: DENY

# Prevent MIME type sniffing
X-Content-Type-Options: nosniff

# Enable XSS protection
X-XSS-Protection: 1; mode=block

# Control referrer information
Referrer-Policy: strict-origin-when-cross-origin

# Restrict browser features
Permissions-Policy: geolocation=(), microphone=(), camera=()

# Content Security Policy
Content-Security-Policy: default-src 'self'; ...

# HTTPS enforcement (when enabled)
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## Dependency Management

### Dependabot Configuration

Automated dependency updates via `.github/dependabot.yml`:

- **Daily checks** for security updates
- **Grouped updates** by ecosystem
- **Auto-merge** for patch updates
- **Security updates** prioritized

### Manual Dependency Audit

```bash
# Go dependencies
cd backend/service-name
go mod tidy
go mod verify
go list -m -u all

# NPM dependencies
cd frontend-mfe
npm outdated
npm update
npm audit fix
```

## Container Security

### Best Practices

1. **Multi-stage builds** to minimize image size
2. **Non-root users** in containers
3. **Minimal base images** (alpine, distroless)
4. **No secrets** in images
5. **Regular rebuilds** for security patches

### Dockerfile Security

```dockerfile
# Use specific versions
FROM golang:1.21-alpine AS builder

# Run as non-root
USER nonroot:nonroot

# Copy only necessary files
COPY --chown=nonroot:nonroot . .

# Minimal runtime image
FROM gcr.io/distroless/base-debian11
```

## Secret Management

### Prevention

1. **Never commit** secrets to git
2. **Use environment variables** for configuration
3. **Encrypt secrets** at rest
4. **Rotate credentials** regularly
5. **Use secret management tools** (Vault, AWS Secrets Manager)

### Detection

Pre-commit hooks check for:
- API keys and tokens
- Passwords and credentials
- Private keys
- Connection strings with credentials
- AWS/GCP/Azure credentials

### If Secrets Are Exposed

1. **Immediately rotate** the exposed credential
2. **Audit usage** of the compromised credential
3. **Remove from git history** using BFG or git-filter-branch
4. **Update .gitignore** and secret baseline
5. **Notify security team**

## Security Reporting

### Automated Reports

Security scans generate reports in multiple formats:
- **SARIF**: For GitHub Security tab integration
- **JSON**: For programmatic processing
- **Markdown**: For human review
- **HTML**: For detailed analysis

### Viewing Reports

1. **GitHub Security Tab**: Code scanning alerts
2. **Pull Request Comments**: Summary reports
3. **Artifacts**: Detailed scan results
4. **SonarQube Dashboard**: Comprehensive analysis

## OWASP Compliance

The platform addresses OWASP Top 10 risks:

1. **A01:2021 – Broken Access Control**
   - JWT authentication
   - Role-based access control
   - API authorization middleware

2. **A02:2021 – Cryptographic Failures**
   - Bcrypt for password hashing
   - TLS for data in transit
   - Secure token generation

3. **A03:2021 – Injection**
   - Parameterized queries
   - Input validation
   - Output encoding

4. **A04:2021 – Insecure Design**
   - Security design reviews
   - Threat modeling
   - Secure defaults

5. **A05:2021 – Security Misconfiguration**
   - Security headers
   - Minimal permissions
   - Regular updates

6. **A06:2021 – Vulnerable Components**
   - Dependency scanning
   - Regular updates
   - License compliance

7. **A07:2021 – Authentication Failures**
   - Strong password policy
   - Account lockout
   - Session management

8. **A08:2021 – Software and Data Integrity**
   - Code signing
   - Dependency verification
   - CI/CD security

9. **A09:2021 – Security Logging**
   - Centralized logging
   - Security event monitoring
   - Audit trails

10. **A10:2021 – SSRF**
    - URL validation
    - Allowlisting
    - Network segmentation

## Incident Response

### Security Incident Procedure

1. **Identification**
   - Automated alerts
   - Manual discovery
   - Third-party notification

2. **Containment**
   - Isolate affected systems
   - Disable compromised accounts
   - Block malicious IPs

3. **Investigation**
   - Review logs
   - Analyze attack vector
   - Assess impact

4. **Remediation**
   - Patch vulnerabilities
   - Update configurations
   - Rotate credentials

5. **Recovery**
   - Restore services
   - Verify security
   - Monitor closely

6. **Lessons Learned**
   - Post-mortem analysis
   - Update procedures
   - Improve defenses

### Contact

Report security vulnerabilities to: security@restaurant-platform.com

## Continuous Improvement

Security is an ongoing process. We:

1. **Review** security policies quarterly
2. **Update** tools and dependencies regularly
3. **Train** developers on secure coding
4. **Test** security controls periodically
5. **Monitor** for new vulnerabilities
6. **Engage** in security community

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Go Security Best Practices](https://github.com/OWASP/Go-SCP)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)