<?php
/**
 * Email Testing Utility
 * 
 * This script allows testing the email functionality with different providers.
 * DO NOT USE IN PRODUCTION - for development and testing only.
 */

// Load environment variables and autoloader
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

use DiaX\Config\AppContainer;
use DiaX\Services\EmailService;

// Create container
$container = AppContainer::create();

// Get logger
$logger = $container->get(\Monolog\Logger::class);

// Create email service
$emailService = new EmailService($container, $logger);

// Define header for HTML output
function outputHeader($title) {
    echo '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>' . htmlspecialchars($title) . '</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            .success { color: green; font-weight: bold; }
            .error { color: red; font-weight: bold; }
            .box { background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            table, th, td { border: 1px solid #ddd; }
            th, td { padding: 10px; text-align: left; }
            th { background-color: #f2f2f2; }
            pre { background: #f4f4f4; padding: 10px; overflow: auto; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input, select { padding: 8px; width: 100%; box-sizing: border-box; }
            button { background-color: #4a86e8; color: white; padding: 10px 15px; border: none; cursor: pointer; }
        </style>
    </head>
    <body>
        <h1>' . htmlspecialchars($title) . '</h1>';
}

// Define footer for HTML output
function outputFooter() {
    echo '
        <div class="box">
            <h3>Note</h3>
            <p>This utility is for testing purposes only. Do not deploy to production environments.</p>
            <p>For more information, see the <a href="/docs/EMAIL_SETUP.md">Email Setup Guide</a>.</p>
        </div>
    </body>
    </html>';
}

// Process form submission
$result = null;
$testEmail = $_POST['email'] ?? '';
$provider = !empty($_POST['provider']) ? $_POST['provider'] : null;

if (!empty($testEmail)) {
    // Validate email
    if (!filter_var($testEmail, FILTER_VALIDATE_EMAIL)) {
        $error = "Invalid email address";
    } else {
        $result = $emailService->testEmailFunctionality($testEmail, $provider);
    }
}

// Output the page
outputHeader('DiaX Email Test Utility');

// Display test form
echo '<div class="box">
    <h2>Test Email Functionality</h2>
    <form method="post">
        <div class="form-group">
            <label for="email">Email address to send test to:</label>
            <input type="email" name="email" id="email" value="' . htmlspecialchars($testEmail) . '" required>
        </div>
        <div class="form-group">
            <label for="provider">Email Provider (optional):</label>
            <select name="provider" id="provider">
                <option value="">Default (Use configured provider with fallback)</option>
                <option value="php_mail" ' . ($provider === 'php_mail' ? 'selected' : '') . '>PHP mail()</option>
                <option value="smtp" ' . ($provider === 'smtp' ? 'selected' : '') . '>SMTP</option>
                <option value="sendgrid" ' . ($provider === 'sendgrid' ? 'selected' : '') . '>SendGrid</option>
                <option value="mailgun" ' . ($provider === 'mailgun' ? 'selected' : '') . '>Mailgun</option>
            </select>
        </div>
        <button type="submit">Send Test Email</button>
    </form>
</div>';

// Display any error
if (isset($error)) {
    echo '<div class="box error">
        <h2>Error</h2>
        <p>' . htmlspecialchars($error) . '</p>
    </div>';
}

// Display test results
if ($result !== null) {
    echo '<div class="box ' . ($result['success'] ? 'success' : 'error') . '">
        <h2>Test Results</h2>
        <p><strong>Status:</strong> ' . ($result['success'] ? 'Success' : 'Failed') . '</p>';
    
    if (isset($result['error'])) {
        echo '<p><strong>Error:</strong> ' . htmlspecialchars($result['error']) . '</p>';
    }
    
    echo '</div>
    
    <div class="box">
        <h2>Test Details</h2>
        <table>
            <tr>
                <th>Property</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Provider Used</td>
                <td>' . htmlspecialchars($result['provider']) . '</td>
            </tr>
            <tr>
                <td>Test Email</td>
                <td>' . htmlspecialchars($result['email']) . '</td>
            </tr>
            <tr>
                <td>Time</td>
                <td>' . htmlspecialchars($result['time']) . '</td>
            </tr>
            <tr>
                <td>Duration</td>
                <td>' . htmlspecialchars($result['duration']) . ' seconds</td>
            </tr>
        </table>
    </div>
    
    <div class="box">
        <h2>Email Settings</h2>
        <table>
            <tr>
                <th>Setting</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>From Email</td>
                <td>' . htmlspecialchars($result['settings']['from_email']) . '</td>
            </tr>
            <tr>
                <td>From Name</td>
                <td>' . htmlspecialchars($result['settings']['from_name']) . '</td>
            </tr>
            <tr>
                <td>Environment</td>
                <td>' . htmlspecialchars($result['settings']['environment']) . '</td>
            </tr>
        </table>
    </div>';
}

// Display current email configuration
echo '<div class="box">
    <h2>Current Email Configuration</h2>
    <table>
        <tr>
            <th>Setting</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>MAIL_PROVIDER</td>
            <td>' . htmlspecialchars($_ENV['MAIL_PROVIDER'] ?? 'Not set (defaults to php_mail)') . '</td>
        </tr>
        <tr>
            <td>MAIL_FROM_NAME</td>
            <td>' . htmlspecialchars($_ENV['MAIL_FROM_NAME'] ?? 'Not set (defaults to DiaX)') . '</td>
        </tr>
        <tr>
            <td>MAIL_FROM_EMAIL</td>
            <td>' . htmlspecialchars($_ENV['MAIL_FROM_EMAIL'] ?? 'Not set (defaults to noreply@diax.app)') . '</td>
        </tr>
        <tr>
            <td>APP_ENV</td>
            <td>' . htmlspecialchars($_ENV['APP_ENV'] ?? 'Not set') . '</td>
        </tr>
    </table>
</div>';

outputFooter(); 