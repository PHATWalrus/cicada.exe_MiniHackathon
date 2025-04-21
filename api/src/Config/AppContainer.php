<?php

namespace DiaX\Config;

use DI\Container;
use DI\ContainerBuilder;
use Illuminate\Database\Capsule\Manager as Capsule;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

class AppContainer
{
    public static function create(): Container
    {
        $containerBuilder = new ContainerBuilder();
        
        // Load service definitions from dependencies.php
        $dependencies = require __DIR__ . '/dependencies.php';
        
        // Set up definitions
        $containerDefinitions = [
            // Database
            Capsule::class => function () {
                $capsule = new Capsule;
                
                $capsule->addConnection([
                    'driver'    => $_ENV['DB_CONNECTION'],
                    'host'      => $_ENV['DB_HOST'],
                    'port'      => $_ENV['DB_PORT'],
                    'database'  => $_ENV['DB_DATABASE'],
                    'username'  => $_ENV['DB_USERNAME'],
                    'password'  => $_ENV['DB_PASSWORD'],
                    'charset'   => 'utf8mb4',
                    'collation' => 'utf8mb4_unicode_ci',
                    'prefix'    => '',
                ]);
                
                // Make this Capsule instance available globally
                $capsule->setAsGlobal();
                
                // Setup the Eloquent ORM
                $capsule->bootEloquent();
                
                return $capsule;
            },
            
            // Logger interface
            LoggerInterface::class => function (ContainerInterface $container) {
                return $container->get(Logger::class);
            },
            
            // Settings
            'settings' => [
                'app' => [
                    'name' => 'DiaX API',
                    'url' => $_ENV['APP_URL'],
                    'env' => $_ENV['APP_ENV'],
                    'debug' => $_ENV['APP_DEBUG'] === 'true',
                ],
                'jwt' => [
                    'secret' => $_ENV['JWT_SECRET'],
                    'expiration' => (int) $_ENV['JWT_EXPIRATION'],
                    'issuer' => 'diax.fileish.com',
                    'audience' => 'diax.fileish.com',
                ],
                'perplexity' => [
                    'api_key' => $_ENV['PERPLEXITY_API_KEY'],
                    'model' => $_ENV['PERPLEXITY_MODEL'],
                ],
                'email' => [
                    'provider' => $_ENV['EMAIL_PROVIDER'] ?? $_ENV['MAIL_PROVIDER'] ?? 'php_mail', // Options: smtp, sendgrid, mailgun, php_mail
                    'from_name' => $_ENV['EMAIL_FROM_NAME'] ?? $_ENV['MAIL_FROM_NAME'] ?? 'DiaX',
                    'from_email' => $_ENV['EMAIL_FROM_ADDRESS'] ?? $_ENV['MAIL_FROM_EMAIL'] ?? 'noreply@diax.cc',
                    'environment' => $_ENV['APP_ENV'] ?? 'production',
                    'app_name' => $_ENV['APP_NAME'] ?? 'DiaX',
                    'frontend_url' => $_ENV['FRONTEND_URL'] ?? 'https://diax.fileish.com',
                    // Additional email settings
                    'cc_email' => $_ENV['EMAIL_CC'] ?? $_ENV['MAIL_CC_EMAIL'] ?? '',
                    'bcc_email' => $_ENV['EMAIL_BCC'] ?? $_ENV['MAIL_BCC_EMAIL'] ?? '',
                    // SendGrid specific settings
                    'sendgrid_api_key' => $_ENV['SENDGRID_API_KEY'] ?? '',
                    // Mailgun specific settings
                    'mailgun_api_key' => $_ENV['MAILGUN_API_KEY'] ?? '',
                    'mailgun_domain' => $_ENV['MAILGUN_DOMAIN'] ?? '',
                    // SMTP settings
                    'smtp_host' => $_ENV['SMTP_HOST'] ?? 'localhost',
                    'smtp_port' => $_ENV['SMTP_PORT'] ?? 25,
                    'smtp_username' => $_ENV['SMTP_USERNAME'] ?? '',
                    'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? '',
                    'smtp_encryption' => $_ENV['SMTP_ENCRYPTION'] ?? '', // tls or ssl
                    // Logo URL for emails
                    'logo_url' => $_ENV['EMAIL_LOGO_URL'] ?? '',
                ],
            ],
        ];
        
        // Merge container definitions with dependencies
        $containerBuilder->addDefinitions(array_merge($containerDefinitions, $dependencies));
        
        return $containerBuilder->build();
    }
} 