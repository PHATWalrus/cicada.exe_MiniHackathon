<?php

namespace DiaX\Services;

use GuzzleHttp\Client;
use Monolog\Logger;
use Psr\Container\ContainerInterface;

class EmailService
{
    private $container;
    private $logger;
    private $client;
    private $settings;

    public function __construct(ContainerInterface $container, Logger $logger)
    {
        $this->container = $container;
        $this->logger = $logger;
        $this->client = new Client();
        $this->settings = $container->get('settings')['email'] ?? [];
    }

    /**
     * Send a welcome email to a newly registered user
     *
     * @param string $email The recipient email address
     * @param string $name The recipient name
     * @return bool Whether the email was sent successfully
     */
    public function sendWelcomeEmail(string $email, string $name): bool
    {
        $subject = "Welcome to DiaX!";
        $body = $this->renderTemplate('welcome', [
            'name' => $name,
            'appName' => $this->settings['app_name'] ?? 'DiaX',
            'year' => date('Y')
        ]);

        return $this->sendEmail($email, $subject, $body);
    }

    /**
     * Send a password reset email with a reset token
     *
     * @param string $email The recipient email address
     * @param string $token The password reset token
     * @return bool Whether the email was sent successfully
     */
    public function sendPasswordResetEmail(string $email, string $token): bool
    {
        $subject = "Reset Your Password";
        $resetUrl = ($this->settings['frontend_url'] ?? '') . "/reset-password?token=" . $token;
        
        // Add a simple parameter to reduce spam filtering
        $resetUrl .= "&source=email";
        
        $body = $this->renderTemplate('password_reset', [
            'resetUrl' => $resetUrl,
            'token' => $token,
            'expiryHours' => '1', // Token expires in 1 hour
            'appName' => $this->settings['app_name'] ?? 'DiaX',
            'year' => date('Y')
        ]);

        // Add a note about checking spam folder at the top of the email
        $body = str_replace('<body', '<body><div style="background-color: #fffaf0; padding: 10px; margin-bottom: 15px; border: 1px solid #ffa500; border-radius: 5px;">If you\'re having trouble viewing this email, please check your spam folder.</div>' . substr($body, strpos($body, '<body') + 6), $body);

        return $this->sendEmail($email, $subject, $body);
    }

    /**
     * Send a confirmation email after password has been reset
     *
     * @param string $email The recipient email address
     * @return bool Whether the email was sent successfully
     */
    public function sendPasswordResetConfirmationEmail(string $email): bool
    {
        $subject = "Your Password Has Been Reset";
        $body = $this->renderTemplate('password_reset_confirmation', [
            'loginUrl' => ($this->settings['frontend_url'] ?? '') . "/login",
            'appName' => $this->settings['app_name'] ?? 'DiaX',
            'year' => date('Y')
        ]);

        // Add a note about checking spam folder at the top of the email
        $body = str_replace(search: '<body', '<body><div style="background-color: #fffaf0; padding: 10px; margin-bottom: 15px; border: 1px solid #ffa500; border-radius: 5px;">If you\'re having trouble viewing this email, please check your spam folder and mark our emails as "not spam".</div>' . substr($body, strpos($body, '<body') + 6), $body);

        return $this->sendEmail($email, $subject, $body);
    }

    /**
     * Send a generic email to a user
     *
     * @param string $email The recipient email address
     * @param string $subject The email subject
     * @param string $body The email body (HTML)
     * @return bool Whether the email was sent successfully
     */
    public function sendEmail(string $email, string $subject, string $body): bool
    {
        // Get provider from settings or default to php_mail
        $provider = $this->settings['provider'] ?? 'php_mail';
        
        // Store the original provider for logging purposes
        $originalProvider = $provider;
        
        try {
            // Attempt to send with the specified provider
            $result = $this->dispatchToProvider($provider, $email, $subject, $body);
            
            // If successful, return true
            if ($result) {
                return true;
            }
            
            // If the specified provider failed and it's not already php_mail, try php_mail as fallback
            if ($provider !== 'php_mail') {
                $this->logger->warning('Provider {provider} failed, falling back to php_mail', [
                    'provider' => $provider,
                    'recipient' => $email,
                ]);
                return $this->sendViaPhpMail($email, $subject, $body);
            }
            
            return false;
        } catch (\Exception $e) {
            $this->logger->error('Email sending failed: ' . $e->getMessage(), [
                'recipient' => $email,
                'subject' => $subject,
                'provider' => $originalProvider
            ]);
            
            // If this is development environment, log the email content instead of sending
            if (($this->settings['environment'] ?? '') === 'development') {
                $this->logEmailForDevelopment($email, $subject, $body);
                return true; // Return true in development to avoid breaking flows
            }
            
            // If original provider failed and it's not already php_mail, try php_mail as fallback
            if ($originalProvider !== 'php_mail') {
                try {
                    $this->logger->info('Attempting fallback to php_mail after exception');
                    return $this->sendViaPhpMail($email, $subject, $body);
                } catch (\Exception $fallbackEx) {
                    $this->logger->error('Fallback to php_mail also failed: ' . $fallbackEx->getMessage());
                }
            }
            
            return false;
        }
    }
    
    /**
     * Helper method to dispatch email to the appropriate provider
     */
    private function dispatchToProvider(string $provider, string $email, string $subject, string $body): bool
    {
        switch ($provider) {
            case 'sendgrid':
                return $this->sendViaSendgrid($email, $subject, $body);
            case 'mailgun':
                return $this->sendViaMailgun($email, $subject, $body);
            case 'smtp':
                return $this->sendViaSmtp($email, $subject, $body);
            case 'php_mail':
            default:
                return $this->sendViaPhpMail($email, $subject, $body);
        }
    }
    
    /**
     * Test if email functionality is working by sending a test email
     *
     * @param string $email The recipient email address for the test
     * @param string|null $provider Optional specific provider to test (php_mail, smtp, sendgrid, mailgun)
     * @return array Array containing success status and detailed result info
     */
    public function testEmailFunctionality(string $email, ?string $provider = null): array
    {
        // Use specified provider or get from settings (or default to php_mail)
        $testProvider = $provider ?? $this->settings['provider'] ?? 'php_mail';
        
        $subject = "DiaX Email Test - " . date('Y-m-d H:i:s');
        $body = $this->renderTemplate('test_email', [
            'appName' => $this->settings['app_name'] ?? 'DiaX',
            'testTime' => date('Y-m-d H:i:s'),
            'provider' => $testProvider,
            'year' => date('Y')
        ]);
        
        $startTime = microtime(true);
        $exception = null;
        
        try {
            if ($provider !== null) {
                // Test specific provider
                $result = $this->dispatchToProvider($testProvider, $email, $subject, $body);
            } else {
                // Test the entire sending process including fallbacks
                $result = $this->sendEmail($email, $subject, $body);
            }
        } catch (\Exception $e) {
            $result = false;
            $exception = $e;
        }
        
        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 3);
        
        // Create the test result data
        $testData = [
            'success' => $result,
            'provider' => $testProvider,
            'email' => $email,
            'duration' => $duration,
            'time' => date('Y-m-d H:i:s'),
            'settings' => [
                'from_email' => $this->settings['from_email'] ?? 'not set',
                'from_name' => $this->settings['from_name'] ?? 'not set',
                'environment' => $this->settings['environment'] ?? 'not set',
            ]
        ];
        
        if ($exception) {
            $testData['error'] = $exception->getMessage();
        }
        
        // Log the result
        if ($result) {
            $this->logger->info('Email test successful', $testData);
        } else {
            $this->logger->error('Email test failed', $testData);
        }
        
        return $testData;
    }

    /**
     * Send email via Sendgrid API
     */
    private function sendViaSendgrid(string $email, string $subject, string $body): bool
    {
        if (empty($this->settings['sendgrid_api_key'])) {
            throw new \Exception('Sendgrid API key not configured');
        }

        $payload = [
            'personalizations' => [
                [
                    'to' => [['email' => $email]],
                    'subject' => $subject,
                ]
            ],
            'from' => [
                'email' => $this->settings['from_email'] ?? 'noreply@diax.app',
                'name' => $this->settings['from_name'] ?? 'DiaX'
            ],
            'content' => [
                [
                    'type' => 'text/html',
                    'value' => $body
                ]
            ]
        ];

        $response = $this->client->post('https://api.sendgrid.com/v3/mail/send', [
            'headers' => [
                'Authorization' => 'Bearer ' . $this->settings['sendgrid_api_key'],
                'Content-Type' => 'application/json'
            ],
            'json' => $payload
        ]);

        return $response->getStatusCode() === 202;
    }

    /**
     * Send email via Mailgun API
     */
    private function sendViaMailgun(string $email, string $subject, string $body): bool
    {
        if (empty($this->settings['mailgun_api_key']) || empty($this->settings['mailgun_domain'])) {
            throw new \Exception('Mailgun configuration is incomplete');
        }

        $response = $this->client->post("https://api.mailgun.net/v3/{$this->settings['mailgun_domain']}/messages", [
            'auth' => ['api', $this->settings['mailgun_api_key']],
            'form_params' => [
                'from' => $this->settings['from_name'] . ' <' . $this->settings['from_email'] . '>',
                'to' => $email,
                'subject' => $subject,
                'html' => $body
            ]
        ]);

        return $response->getStatusCode() === 200;
    }

    /**
     * Send email via SMTP (requires a properly configured mail server)
     */
    private function sendViaSmtp(string $email, string $subject, string $body): bool
    {
        // This method should be updated to use a proper SMTP library like PHPMailer
        // For now, we'll just use the PHP mail function as a fallback
        return $this->sendViaPhpMail($email, $subject, $body);
    }

    /**
     * Send email using PHP's native mail() function
     * 
     * @param string $email The recipient email address
     * @param string $subject The email subject
     * @param string $body The email body (HTML)
     * @return bool Whether the email was sent successfully
     */
    private function sendViaPhpMail(string $email, string $subject, string $body): bool
    {
        // Set up proper email headers for HTML content
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=utf-8',
            'From: ' . ($this->settings['from_name'] ?? 'DiaX') . ' <' . ($this->settings['from_email'] ?? 'noreply@diax.cc') . '>',
            'Reply-To: ' . ($this->settings['from_email'] ?? 'noreply@diax.cc'),
            'X-Mailer: PHP/' . phpversion(),
            // Add these headers to improve deliverability
            'X-Priority: 3',
            'X-MSMail-Priority: Normal',
            'Importance: Normal',
            // Add Message-ID header to prevent emails from being seen as duplicate
            'Message-ID: <' . time() . '-' . md5($email . $subject) . '@' . parse_url($this->settings['frontend_url'] ?? 'diax.cc', PHP_URL_HOST) . '>'
        ];

        // Add optional headers if they exist in settings
        if (!empty($this->settings['cc_email'])) {
            $headers[] = 'Cc: ' . $this->settings['cc_email'];
        }
        
        if (!empty($this->settings['bcc_email'])) {
            $headers[] = 'Bcc: ' . $this->settings['bcc_email'];
        }

        // Configure additional mail parameters if available in PHP version
        $additional_params = null;
        
        // In PHP >= 8.0 we can use additional parameters for mail()
        if (version_compare(PHP_VERSION, '8.0.0', '>=')) {
            if (!empty($this->settings['from_email'])) {
                $additional_params = "-f" . $this->settings['from_email'];
            }
        }
        
        // Convert line breaks to CRLF as per RFC 822
        $body = str_replace("\n.", "\n..", $body);
        
        // Attempt to send the email
        $result = mail($email, $subject, $body, implode("\r\n", $headers), $additional_params);
        
        // Log the result
        if ($result) {
            $this->logger->info('Email sent via PHP mail() to ' . $email);
            
            // Special handling for password reset emails
            if (strpos($subject, 'Reset Your Password') !== false) {
                $this->logger->info('Password reset email sent. If not received, check spam folder or server deliverability.');
            }
        } else {
            $this->logger->error('Failed to send email via PHP mail() to ' . $email);
            
            // In development mode, still log the email content
            if (($this->settings['environment'] ?? '') === 'development') {
                $this->logEmailForDevelopment($email, $subject, $body);
                return true; // Return true in development to avoid breaking flows
            }
        }
        
        return $result;
    }

    /**
     * Render an email template with variables
     *
     * @param string $template Template name
     * @param array $variables Variables to replace in the template
     * @return string The rendered HTML
     */
    private function renderTemplate(string $template, array $variables = []): string
    {
        $templatePath = __DIR__ . "/../../templates/emails/{$template}.html";
        
        // If template doesn't exist, use a default template
        if (!file_exists($templatePath)) {
            $html = $this->getDefaultTemplate($template, $variables);
        } else {
            $html = file_get_contents($templatePath);
        }
        
        // Replace variables in template
        foreach ($variables as $key => $value) {
            $html = str_replace('{{' . $key . '}}', $value, $html);
        }
        
        return $html;
    }

    /**
     * Get a default template when a file template doesn't exist
     */
    private function getDefaultTemplate(string $template, array $variables = []): string
    {
        $appName = $variables['appName'] ?? 'DiaX';
        $year = $variables['year'] ?? date('Y');
        
        switch ($template) {
            case 'test_email':
                return '
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Email System Test</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4a86e8;">' . $appName . '</h1>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2>Email System Test</h2>
                        <p>This is a test email to verify that the email system is working correctly.</p>
                        <p><strong>Provider:</strong> {{provider}}</p>
                        <p><strong>Test Time:</strong> {{testTime}}</p>
                        <p>If you received this email, it means the email system is functioning properly.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
                        <p>&copy; ' . $year . ' ' . $appName . '. All rights reserved.</p>
                    </div>
                </body>
                </html>';
                
            case 'welcome':
                return '
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Welcome to ' . $appName . '</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4a86e8;">' . $appName . '</h1>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2>Welcome to ' . $appName . ', {{name}}!</h2>
                        <p>Thank you for registering with ' . $appName . '. We\'re excited to have you on board!</p>
                        <p>Your account has been successfully created and you can now access all our features.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="' . ($this->settings['frontend_url'] ?? '') . '/dashboard" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                        </div>
                        <p>If you have any questions, please don\'t hesitate to contact our support team.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
                        <p>&copy; ' . $year . ' ' . $appName . '. All rights reserved.</p>
                    </div>
                </body>
                </html>';
                
            case 'password_reset':
                return '
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Reset Your Password</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4a86e8;">' . $appName . '</h1>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2>Password Reset Request</h2>
                        <p>We received a request to reset your password. If you didn\'t make this request, you can safely ignore this email.</p>
                        <p>To reset your password, click the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{resetUrl}}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
                        </div>
                        <p>If the button doesn\'t work, copy and paste this URL into your browser:</p>
                        <p style="background-color: #eee; padding: 10px; word-break: break-all;">{{resetUrl}}</p>
                        <p>This link will expire in {{expiryHours}} hour(s).</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
                        <p>&copy; ' . $year . ' ' . $appName . '. All rights reserved.</p>
                    </div>
                </body>
                </html>';
                
            case 'password_reset_confirmation':
                return '
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Password Reset Successful</title>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4a86e8;">' . $appName . '</h1>
                    </div>
                    <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px;">
                        <h2>Password Reset Successful</h2>
                        <p>Your password has been reset successfully.</p>
                        <p>You can now log in with your new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{{loginUrl}}" style="background-color: #4a86e8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In</a>
                        </div>
                        <p>If you did not request this change, please contact our support team immediately.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #777;">
                        <p>&copy; ' . $year . ' ' . $appName . '. All rights reserved.</p>
                    </div>
                </body>
                </html>';
                
            default:
                return '<html><body><h1>' . $appName . '</h1><p>This is an automated email from ' . $appName . '.</p></body></html>';
        }
    }

    /**
     * Log email details for development purposes instead of sending
     */
    private function logEmailForDevelopment(string $email, string $subject, string $body): void
    {
        $logPath = __DIR__ . '/../../logs/emails';
        
        // Create the directory if it doesn't exist
        if (!is_dir($logPath)) {
            mkdir($logPath, 0755, true);
        }
        
        $filename = $logPath . '/' . date('Y-m-d_H-i-s') . '_' . md5($email . $subject . time()) . '.html';
        
        $content = "To: {$email}\n";
        $content .= "Subject: {$subject}\n";
        $content .= "Date: " . date('Y-m-d H:i:s') . "\n";
        $content .= "--------------------\n\n";
        $content .= $body;
        
        file_put_contents($filename, $content);
        
        $this->logger->info('Development email logged to file', [
            'recipient' => $email,
            'subject' => $subject,
            'file' => $filename
        ]);
    }
} 