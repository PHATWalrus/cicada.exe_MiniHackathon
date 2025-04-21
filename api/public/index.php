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

// Set the base path for the application
// This helps when the app is deployed in a subdirectory
$basePath = isset($_ENV['APP_BASE_PATH']) ? $_ENV['APP_BASE_PATH'] : '';

// Create DI container
$container = AppContainer::create();

// Ensure database connection is initialized
$container->get(Capsule::class);

// Create app
AppFactory::setContainer($container);
$app = AppFactory::create();

// Set base path if needed
if (!empty($basePath)) {
    $app->setBasePath($basePath);
}

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

// Debug route - helps with confirming base path is set correctly
$app->get('/test-route', function ($request, $response) use ($basePath) {
    $response->getBody()->write(json_encode([
        'status' => 'success',
        'message' => 'DiaX API route test is working',
        'base_path' => $basePath,
        'uri' => (string)$request->getUri(),
        'request_target' => $request->getRequestTarget(),
    ]));
    return $response->withHeader('Content-Type', 'application/json');
});

// Handle 404 errors - with more diagnostic information
$app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) use ($basePath) {
    // For API requests, return JSON response
    if (strpos($request->getHeaderLine('Accept'), 'application/json') !== false) {
        $response->getBody()->write(json_encode([
            'status' => 'error',
            'message' => 'Route not found',
            'path' => $request->getUri()->getPath(),
            'method' => $request->getMethod(),
            'base_path' => $basePath,
        ]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
    }
    
    // Otherwise, throw the standard 404 exception
    throw new HttpNotFoundException($request);
});

// Handle CORS preflight requests
$app->options('/{routes:.+}', function ($request, $response) {
    return $response;
});

// NOTE: To create database tables, run: php database/setup.php

// Run app
$app->run(); 