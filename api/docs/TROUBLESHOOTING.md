# DiaX API Troubleshooting Guide

This document provides solutions for common issues you might encounter when working with the DiaX API.

## Authentication Issues

### "Invalid token fingerprint" Error

**Problem:** When making API calls with a JWT token, you receive a 401 Unauthorized error with the message "Invalid token fingerprint".

**Cause:** This occurs when token fingerprinting is enabled. Token fingerprinting binds tokens to the client's IP address and user agent. If either of these change between when the token was generated and when it's used (which often happens with mobile clients, VPNs, or across different devices), the validation fails.

**Solutions:**

1. **Disable Token Fingerprinting (Recommended for most use cases)**

   Token fingerprinting has been disabled by default in the latest version of the API. If you're still seeing this error, check that you're using the latest codebase.

2. **Use a New Token**

   You can generate a new token by:
   - Logging out and logging back in
   - Using the token refresh endpoint (`POST /auth/refresh`)
   - Using the test token generator (`/generate_test_token.php`) for development purposes only

3. **Re-enable Token Fingerprinting with Modifications**

   If you need the additional security of token fingerprinting, you can re-enable it by modifying:
   - `src/Middleware/JwtAuthMiddleware.php` - Uncomment the fingerprint validation code
   - `src/Utils/JwtUtil.php` - Uncomment the fingerprint generation code
   - Set `ENABLE_TOKEN_FINGERPRINT=true` in your .env file

   However, you might want to modify the implementation to be more resilient:
   - Only validate part of the IP address (first two or three octets)
   - Use a more relaxed user agent check
   - Add a "device ID" parameter that the client can persist

## Rate Limiting Issues

### "Too many requests" Error

**Problem:** You receive a 429 Too Many Requests error when making API calls.

**Cause:** The API implements rate limiting to prevent abuse. Different endpoints have different rate limits:
- Authentication endpoints: 10 requests per 5 minutes
- Standard API endpoints: 60 requests per minute

**Solutions:**

1. **Wait and Retry**
   - The response includes a `retry_after` value indicating how many seconds to wait
   - Implement exponential backoff in your client

2. **Optimize Your Requests**
   - Batch operations where possible
   - Cache responses on the client side
   - Reduce polling frequency

## Email Delivery Issues

### Emails Not Being Sent

**Problem:** Password reset or welcome emails are not being delivered.

**Cause:** This could be due to email configuration issues or server limitations.

**Solutions:**

1. **Check Configuration**
   - Verify your email provider settings in the .env file
   - Ensure the correct FROM email address is configured

2. **Check Development Mode**
   - In development mode, emails are not sent but are logged to the `logs/emails` directory
   - Check this directory to see if the emails are being generated correctly

3. **Try a Different Provider**
   - If one provider isn't working, try switching to another one
   - Update the `MAIL_PROVIDER` setting in your .env file
   - Options: `smtp`, `php_mail`, `sendgrid`, or `mailgun`

### PHP mail() Function Issues

**Problem:** Emails aren't being sent when using the PHP mail() function.

**Causes:**
- Mail server not configured on the hosting environment
- PHP mail() function disabled by the hosting provider
- Incorrect sender email address format
- Anti-spam measures blocking outgoing mail

**Solutions:**

1. **Verify Server Configuration**
   - Check with your hosting provider if the mail() function is supported
   - Some shared hosts restrict mail() usage or require specific configurations

2. **Check PHP Configuration**
   - Look at your PHP configuration (phpinfo()) to ensure mail functionality is enabled
   - Check for any mail-related parameters in php.ini like `sendmail_path`

3. **Test with Safe Sender Addresses**
   - Use a FROM address that matches your server's domain
   - Avoid using free email domains (gmail.com, yahoo.com, etc.) as sender addresses

4. **Check Server Logs**
   - Review your server's mail logs for errors or rejected messages
   - Common locations: `/var/log/mail.log` or `/var/log/maillog`

5. **Switch to SMTP or API-Based Provider**
   - If PHP mail() isn't working, try an SMTP or API-based provider instead
   - SMTP and API providers often have better deliverability rates

## General Troubleshooting

### Check Logs

Always check the API logs for detailed error information:
- Application logs: `logs/app.log`
- Email logs (in development): `logs/emails/`
- PHP errors: Check your server's error log

### Debug Mode

You can enable debug mode by setting `APP_DEBUG=true` in your .env file to get more detailed error responses. 