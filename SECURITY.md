# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of Restaurant Platform seriously. If you have discovered a security vulnerability in our project, please follow these steps:

### 1. Do NOT Create a Public Issue

Security vulnerabilities should NOT be reported through public GitHub issues.

### 2. Email Security Team

Please email us at: **security@restaurant-platform.com**

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 7 days
  - High: 14 days
  - Medium: 30 days
  - Low: 90 days

### 4. Disclosure Policy

- We will confirm the receipt of your vulnerability report
- We will confirm the issue and determine its impact
- We will release a fix based on the severity
- We will credit you in the release notes (unless you prefer to remain anonymous)

## Security Measures

This project implements comprehensive security measures:

### Automated Security Scanning
- Dependency vulnerability scanning (npm audit, go mod audit)
- Static Application Security Testing (SAST)
- Container image vulnerability scanning
- Secret detection in code
- OWASP Top 10 compliance checks

### Security Headers
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy
- Referrer-Policy
- Permissions-Policy

### Secure Development
- Pre-commit hooks for security checks
- Automated dependency updates via Dependabot
- Regular security audits
- Secure coding guidelines

## Security Best Practices for Contributors

1. **Never commit secrets** (passwords, API keys, tokens)
2. **Validate all inputs** to prevent injection attacks
3. **Use parameterized queries** for database operations
4. **Implement proper authentication** and authorization
5. **Keep dependencies updated** regularly
6. **Follow the principle of least privilege**
7. **Use secure communication** (HTTPS/TLS)
8. **Implement proper error handling** without exposing sensitive information

## Security Tools

We use the following security tools:
- **Go**: gosec, go-critic, nancy
- **Node.js**: npm audit, Snyk, ESLint security plugin
- **Containers**: Trivy, Docker Scout
- **Secrets**: TruffleHog, detect-secrets
- **SAST**: CodeQL, SonarQube

## Compliance

This project aims to comply with:
- OWASP Top 10
- CWE/SANS Top 25
- PCI DSS (for payment processing)
- GDPR (for data privacy)

## Security Champions

Our security champions help maintain and improve security:
- Review security-related pull requests
- Stay updated on security best practices
- Conduct security training
- Coordinate vulnerability responses

## Additional Information

For more details on our security practices, see:
- [Security Documentation](docs/SECURITY.md)
- [GitHub Security Advisories](https://github.com/francknouama/restaurant-platform/security/advisories)
- [Dependency Security Updates](https://github.com/francknouama/restaurant-platform/network/updates)

## Acknowledgments

We thank the following researchers for responsibly disclosing vulnerabilities:
- (Your name could be here!)

---

**Remember**: Security is everyone's responsibility. When in doubt, ask the security team!