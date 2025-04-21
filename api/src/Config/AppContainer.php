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
        
        // Set up definitions
        $containerBuilder->addDefinitions([
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
            
            // Logger
            LoggerInterface::class => function (ContainerInterface $container) {
                $logger = new Logger('app');
                $logFile = __DIR__ . '/../../logs/app.log';
                
                // Create logs directory if it doesn't exist
                if (!is_dir(dirname($logFile))) {
                    mkdir(dirname($logFile), 0777, true);
                }
                
                $logger->pushHandler(new StreamHandler($logFile, Logger::DEBUG));
                return $logger;
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
            ],
        ]);
        
        return $containerBuilder->build();
    }
} 