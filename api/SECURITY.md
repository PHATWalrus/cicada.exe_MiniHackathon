# DiaX API Security Features

This document outlines the security features implemented in the DiaX API.

## Authentication & Authorization

### JWT Security

- **Token Fingerprinting**: JWT tokens are fingerprinted based on client IP and user agent.
- **Token Revocation**: Logged-out tokens are added to a blocklist to prevent token reuse.
- **Automatic Expiration**: Tokens automatically expire after the configured time (default: 1 hour).
- **Issuer and Audience Validation**: Tokens are verified against their intended issuer and audience.
- **Unique Token IDs**: Each token contains a unique identifier (jti) to prevent token replays.

### Account Protection

- **Account Locking**: After multiple failed login attempts, accounts are temporarily locked.
- **Progressive Lockout**: Lock duration increases exponentially with repeated failures.
- **Login Logging**: All login attempts (successful and failed) are logged with IP and user agent.

## Rate Limiting

- **Authentication Endpoints**: Stricter rate limits on auth endpoints (10 requests per 5 minutes).
- **Standard API Endpoints**: Standard rate limits for most API endpoints (60 requests per minute).
- **Lockout Protection**: Prevents brute force attacks on login and registration endpoints.

## API Security

- **CORS Protection**: Restricted to specific whitelisted origins rather than allowing all origins.
- **Security Headers**: Implemented security headers including:
  - Content-Security-Policy
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Referrer-Policy
  - Strict-Transport-Security

- **Request Sanitization**: All input is validated and sanitized before processing.

## Database Security

- **Secure Password Storage**: Passwords are hashed using PHP's password_hash with bcrypt.
- **Parameterized Queries**: All database queries use parameterized statements to prevent SQL injection.
- **Column-level Protection**: Sensitive columns are protected from mass assignment.

## Environment Configuration

Add the following to your `.env` file to configure security features:

```
# Security settings
ENABLE_TOKEN_FINGERPRINT=true
MAX_LOGIN_ATTEMPTS=5
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://diax.vercel.app,https://diax.fileish.com

# Rate limiting
RATE_LIMIT_MAX_ATTEMPTS=60
RATE_LIMIT_DECAY_MINUTES=1

# Auth rate limiting (more strict)
AUTH_RATE_LIMIT_MAX_ATTEMPTS=10
AUTH_RATE_LIMIT_DECAY_MINUTES=5
```

## New Database Tables

The security enhancements added the following new tables:

1. **token_blocklist**: Stores revoked tokens to prevent reuse
2. **login_logs**: Tracks login attempts with IP and user agent information
3. **rate_limits**: Manages API rate limiting (if enabled)

## Upgrading

To upgrade your existing DiaX API with these security enhancements:

1. Run database migrations to add the new tables:
   ```
   php setup.php
   ```

2. Update your `.env` file with the new security settings.

3. Restart your API server.

## Security Best Practices

1. Always use HTTPS in production.
2. Regularly update dependencies.
3. Monitor login logs for suspicious activity.
4. Use strong JWT secrets and rotate them periodically.
5. Set appropriate CORS allowed origins for your environment.
6. Configure rate limiting based on your application needs.
7. Keep debug mode disabled in production. 