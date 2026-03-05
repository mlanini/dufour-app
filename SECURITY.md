# Security Policy

## Supported Versions

Currently supported versions of Dufour.app:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in Dufour.app, please report it responsibly.

### How to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please:

1. **Email**: Send details to the repository maintainer through GitHub's private vulnerability reporting feature
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Updates**: Within 7 days on investigation progress
- **Resolution**: Security patches will be prioritized
- **Credit**: You will be credited in release notes (if desired)

## Security Best Practices

### For Developers

**When contributing code:**

- Never commit credentials, API keys, or secrets
- Use environment variables for configuration
- Validate and sanitize all user inputs
- Follow OWASP security guidelines
- Keep dependencies up to date

**Sensitive files to avoid committing:**
```
.env
.env.local
.env.production
*secrets*
*credentials*
*.key
*.pem
```

### For Deployment

**Production security checklist:**

- [ ] Use HTTPS/TLS for all connections
- [ ] Set strong database passwords
- [ ] Configure firewall rules to restrict ports
- [ ] Enable CORS only for trusted domains
- [ ] Implement rate limiting
- [ ] Keep Docker images updated
- [ ] Regular security audits
- [ ] Enable container security scanning
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Implement monitoring and alerting

**Environment variables:**
```env
# Never use default passwords in production!
POSTGRES_PASSWORD=<strong-random-password>

# Restrict CORS
QGIS_SERVER_ALLOWED_ORIGINS=https://yourdomain.com

# Use HTTPS
APP_BASE_URL=https://dufour.yourdomain.com
```

## Known Security Considerations

### Current Implementation

1. **Authentication**: Currently not implemented
   - Suitable for internal networks or demo environments
   - Production deployments should add authentication layer

2. **CORS**: Development mode allows all origins
   - Must be restricted in production

3. **Input Validation**: Basic validation implemented
   - File upload size limits enforced
   - Coordinate validation in place
   - Additional validation ongoing

### Planned Improvements

- OAuth2/SAML integration
- Role-based access control (RBAC)
- API rate limiting
- Audit logging
- Security headers (CSP, HSTS, etc.)

## Dependencies

We use Dependabot to monitor dependencies for known vulnerabilities.

**To update dependencies:**

```bash
# Frontend
cd frontend
npm audit
npm audit fix

# Docker base images
docker pull postgis/postgis:15-3.4-alpine
docker pull openquake/qgis-server:stable
```

## Vulnerability Disclosure Timeline

1. **Day 0**: Vulnerability reported
2. **Day 1-2**: Acknowledge receipt and begin investigation
3. **Day 3-7**: Assess impact and develop fix
4. **Day 8-14**: Test and validate fix
5. **Day 15**: Release security patch
6. **Day 16**: Public disclosure (after users have time to update)

## Security Updates

Security patches will be released as soon as possible and announced via:

- GitHub Security Advisories
- GitHub Releases with `[SECURITY]` tag
- Project README

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [QGIS Server Security](https://docs.qgis.org/latest/en/docs/server_manual/security.html)

## Contact

For security concerns, use GitHub's private vulnerability reporting or contact the maintainer directly through GitHub.

---

**Last Updated**: March 2026
