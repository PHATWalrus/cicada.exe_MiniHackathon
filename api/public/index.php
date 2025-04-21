<?php

use DiaX\Config\AppContainer;
use Slim\Factory\AppFactory;
use Slim\Exception\HttpNotFoundException;
use Illuminate\Database\Capsule\Manager as Capsule;
use DiaX\Middleware\RateLimitMiddleware;

require __DIR__ . '/../vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Create DI container
$container = AppContainer::create();

// Ensure database connection is initialized
$container->get(Capsule::class);

// Create app
AppFactory::setContainer($container);
$app = AppFactory::create();

// Add security headers to all responses
$app->add(function ($request, $handler) {
    $response = $handler->handle($request);
    
    return $response
        ->withHeader('X-Content-Type-Options', 'nosniff')
        ->withHeader('X-Frame-Options', 'DENY')
        ->withHeader('X-XSS-Protection', '1; mode=block')
        ->withHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
        ->withHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';");
});

// Add error middleware
$app->addErrorMiddleware($_ENV['APP_DEBUG'] === 'true', true, true);

// Add routing middleware
$app->addRoutingMiddleware();

// Add body parsing middleware
$app->addBodyParsingMiddleware();

// Create rate limiters
$authRateLimiter = new RateLimitMiddleware(10, 5, 'auth:'); // 10 requests per 5 minutes for auth
$standardRateLimiter = new RateLimitMiddleware(600, 1, 'api:'); // 60 requests per minute for API

// Add CORS middleware
$app->add(new \DiaX\Middleware\CorsMiddleware());

// Register routes
require __DIR__ . '/../src/Config/routes.php';

// Handle 404 errors
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
    throw new HttpNotFoundException($request);
});

// Handle CORS preflight requests
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// NOTE: To create database tables, run: php database/setup.php

// Run app
$app->run(); 