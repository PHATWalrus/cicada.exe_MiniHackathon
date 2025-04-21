# Email Setup Guide for DiaX API

This guide explains how to set up and use the email functionality for sending welcome emails, password reset notifications, and other communications.

## Configuration

Add the following environment variables to your `.env` file:

```
# Email Settings
MAIL_PROVIDER=smtp
MAIL_FROM_NAME=DiaX
MAIL_FROM_EMAIL=noreply@diax.app
MAIL_CC_EMAIL=  # Optional CC email address
MAIL_BCC_EMAIL=  # Optional BCC email address

# SendGrid Mail Settings (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# Mailgun Mail Settings (if using Mailgun)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain.com

# SMTP Mail Settings (if using SMTP)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_ENCRYPTION=tls

# Frontend URL (used for links in emails)
FRONTEND_URL=https://diax.fileish.com
```

## Email Providers

The system supports four email providers:

1. **SMTP** - Uses a properly configured mail server
2. **PHP Mail** - Uses PHP's built-in mail() function
3. **SendGrid** - API-based service, requires a SendGrid account and API key
4. **Mailgun** - API-based service, requires a Mailgun account, API key, and domain

### Provider Selection

Set the `MAIL_PROVIDER` environment variable to one of:
- `smtp` - Use SMTP server
- `php_mail` - Use PHP's built-in mail() function
- `sendgrid` - Use SendGrid API
- `mailgun` - Use Mailgun API

Note: **If no provider is specified or if the configured provider fails, the system will automatically fall back to PHP's mail() function.**

### PHP Mail Function

The `php_mail` provider uses PHP's native mail() function to send emails. This option:

- Requires a properly configured mail server on your hosting environment
- Works well on most shared hosting platforms
- Doesn't require additional credentials
- May have limitations regarding deliverability compared to professional email services

For the `php_mail` provider, you only need to set:
```
MAIL_PROVIDER=php_mail
MAIL_FROM_NAME=Your App Name
MAIL_FROM_EMAIL=your@email.com
```

Optional: You can also set CC and BCC recipients for all emails:
```
MAIL_CC_EMAIL=cc@example.com
MAIL_BCC_EMAIL=bcc@example.com
```

## Email Templates

Email templates are located in the `templates/emails` directory:

- `welcome.html` - Sent when a user registers
- `password_reset.html` - Sent when a user requests a password reset
- `password_reset_confirmation.html` - Sent after a user successfully resets their password

### Customizing Templates

You can customize these templates by modifying the HTML files. Each template supports variables that are replaced at runtime:

Common variables available in all templates:
- `{{appName}}` - The application name (from settings)
- `{{year}}` - The current year

Template-specific variables:
- Welcome email: `{{name}}`, `{{frontendUrl}}`
- Password reset: `{{resetUrl}}`, `{{token}}`, `{{expiryHours}}`
- Password reset confirmation: `{{loginUrl}}`

## Development Mode

When running in development mode (`APP_ENV=development`), emails aren't actually sent but are instead:

1. Logged to the console
2. Saved as HTML files in the `logs/emails` directory for review

This makes it easy to test email functionality without actually sending emails.

## Usage in Code

The email functionality is integrated into:

1. **User Registration** - Sends a welcome email
2. **Password Reset Request** - Sends the reset token
3. **Password Reset Completion** - Sends a confirmation

If you need to send emails from other parts of the code, inject the `EmailService` and use its methods:

```php
public function someMethod(Request $request, Response $response)
{
    // Get the email service
    $emailService = $this->container->get(\DiaX\Services\EmailService::class);
    
    // Send a welcome email
    $emailService->sendWelcomeEmail('user@example.com', 'User Name');
    
    // Send a password reset email
    $emailService->sendPasswordResetEmail('user@example.com', 'reset_token_here');
    
    // Send a password reset confirmation
    $emailService->sendPasswordResetConfirmationEmail('user@example.com');
    
    // Send a custom email
    $emailService->sendEmail('user@example.com', 'Subject', '<html><body>Email content</body></html>');
}
```

## Troubleshooting

If emails aren't being sent:

1. Check the application logs in `logs/app.log` for any error messages
2. Verify your email provider credentials are correct
3. In development mode, check the `logs/emails` directory for saved emails
4. For SendGrid/Mailgun, check your API key and account status
5. For SMTP, verify server settings and connectivity
6. For PHP mail(), ensure your hosting environment supports the mail() function
7. Try switching to a different provider if one is not working

### Testing Email Functionality

A convenient test script is included to verify your email configuration:

1. Access `/test_email.php` in your browser
2. Enter a test email address where you can receive emails
3. Optionally select a specific provider to test
4. Click "Send Test Email"

The test tool provides detailed information about:
- Whether the email was sent successfully
- Which provider was used
- How long it took to send
- Current email configuration settings

This is especially useful when setting up the system or troubleshooting email issues.

## Security Considerations

- Password reset tokens are cryptographically secure (using random_bytes)
- Only hashed tokens are stored in the database
- Tokens expire after 1 hour for security
- Generic response messages are used for forgot password to prevent user enumeration
- Email templates use inline CSS to ensure compatibility across email clients