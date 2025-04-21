<?php

use DiaX\Controller\PdfController;
use DiaX\Controller\Gemini\ChatCompletionController;
use DiaX\Middleware\CorsMiddleware;
use DiaX\Services\EmailService;
use Psr\Container\ContainerInterface;

// Controllers
$container[ApiSearchController::class] = function (ContainerInterface $c) {
    return new ApiSearchController($c);
};

// Services
$container[EmailService::class] = function (ContainerInterface $c) {
    return new EmailService($c, $c->get(\Monolog\Logger::class));
};

// Middleware
$container[CorsMiddleware::class] = function (ContainerInterface $c) {
    return new CorsMiddleware();
}; 