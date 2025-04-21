<?php

use DiaX\Services\EmailService;
use DiaX\Services\ChatbotService;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use Psr\Container\ContainerInterface;

/**
 * DiaX API Service Dependencies
 * 
 * This file defines explicit dependency injections for services used in the application.
 * It is loaded by the AppContainer.
 */

return [
    // Email Service
    EmailService::class => function (ContainerInterface $c) {
        return new EmailService($c, $c->get(Logger::class));
    },
    
    // Chatbot Service
    ChatbotService::class => function (ContainerInterface $c) {
        return new ChatbotService($c);
    },
    
    // Explicitly define Logger for services that need it
    Logger::class => function () {
        $logger = new Logger('diax-api');
        $logFile = __DIR__ . '/../../logs/app.log';
        
        // Create logs directory if it doesn't exist
        if (!is_dir(dirname($logFile))) {
            mkdir(dirname($logFile), 0777, true);
        }
        
        $logger->pushHandler(new StreamHandler($logFile, Logger::DEBUG));
        return $logger;
    },
]; 