# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please email security@eworld.app immediately.

**Please do not open a public issue.**

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response Timeline

- Initial response: Within 24 hours
- Status update: Within 7 days
- Fix timeline: Depends on severity

## Security Measures

### Data Protection

- All user data encrypted at rest
- HTTPS only for API communications
- Secure token storage using Expo SecureStore
- Row Level Security in Supabase

### Authentication

- Biometric authentication support
- Secure session management
- Automatic token refresh
- Password reset via email

### Privacy

- Minimal data collection
- No third-party data sharing
- User data deletion on request
- GDPR compliant

## Best Practices

For developers:

1. Never commit API keys or secrets
2. Use environment variables
3. Validate all user inputs
4. Keep dependencies updated
5. Follow secure coding guidelines