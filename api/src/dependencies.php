<?php

use DiaX\Controller\PdfController;
use DiaX\Controller\Gemini\ChatCompletionController;
use DiaX\Middleware\CorsMiddleware;

// Controllers
$container[ApiSearchController::class] = function (ContainerInterface $c) {
    return new ApiSearchController($c);
};

// Middleware
$container[CorsMiddleware::class] = function (ContainerInterface $c) {
    return new CorsMiddleware();
}; 