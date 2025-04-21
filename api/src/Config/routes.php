<?php

use DiaX\Controllers\AuthController;
use DiaX\Controllers\ChatController;
use DiaX\Controllers\ResourceController;
use DiaX\Controllers\UserController;
use DiaX\Controllers\HealthMetricController;
use DiaX\Controllers\AdminController;
use DiaX\Middleware\JwtAuthMiddleware;
use DiaX\Middleware\AdminAuthMiddleware;
use DiaX\Middleware\RateLimitMiddleware;
use Slim\Routing\RouteCollectorProxy;

// Create rate limiters with different configurations
$authRateLimiter = new RateLimitMiddleware(10, 5, 'auth:'); // 10 requests per 5 minutes for auth
$apiRateLimiter = new RateLimitMiddleware(60, 1, 'api:'); // 60 requests per minute for standard API

// Public routes
$app->group('/api', function (RouteCollectorProxy $group) use ($authRateLimiter) {
    // Auth routes (with stricter rate limiting)
    $group->group('/auth', function (RouteCollectorProxy $group) {
        $group->post('/register', [AuthController::class, 'register']);
        $group->post('/login', [AuthController::class, 'login']);
        $group->post('/refresh', [AuthController::class, 'refresh']);
        $group->post('/forgot-password', [AuthController::class, 'forgotPassword']);
        $group->post('/reset-password', [AuthController::class, 'resetPassword']);
        $group->post('/verify-email', [AuthController::class, 'verifyEmail']);
        $group->post('/resend-verification', [AuthController::class, 'resendVerification']);
    })->add($authRateLimiter); // Apply stricter rate limiting to auth endpoints

    // Resources (public)
    $group->get('/resources', [ResourceController::class, 'getPublicResources']);
    
    // Health check
    $group->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode([
            'status' => 'ok',
            'message' => 'DiaX API is running',
            'timestamp' => time()
        ]));
        return $response->withHeader('Content-Type', 'application/json');
    });
});

// Protected routes
$app->group('/api', function (RouteCollectorProxy $group) use ($authRateLimiter) {
    // Auth routes requiring authentication
    $group->group('/auth', function (RouteCollectorProxy $group) {
        $group->post('/logout', [AuthController::class, 'logout']);
    })->add($authRateLimiter); // Apply stricter rate limiting to auth endpoints
    
    // User routes
    $group->group('/users', function (RouteCollectorProxy $group) {
        $group->get('/profile', [UserController::class, 'getProfile']);
        $group->put('/profile', [UserController::class, 'updateProfile']);
        $group->post('/medical-info', [UserController::class, 'updateMedicalInfo']);
        $group->get('/medical-info', [UserController::class, 'getMedicalInfo']);
        $group->delete('/medical-record', [HealthMetricController::class, 'deleteMedicalRecord']);
    });
    
    // Health metrics routes
    $group->group('/health', function (RouteCollectorProxy $group) {
        $group->get('/metrics', [HealthMetricController::class, 'getMetrics']);
        $group->post('/metrics', [HealthMetricController::class, 'addMetric']);
        $group->put('/metrics/{id}', [HealthMetricController::class, 'updateMetric']);
        $group->delete('/metrics/{id}', [HealthMetricController::class, 'deleteMetric']);
        $group->get('/stats', [HealthMetricController::class, 'getStats']);
        $group->get('/charts', [HealthMetricController::class, 'getChartData']);
        $group->get('/distribution', [HealthMetricController::class, 'getDistributionData']);
    });
    
    // Chat routes
    $group->group('/chat', function (RouteCollectorProxy $group) {
        $group->post('/sessions', [ChatController::class, 'createSession']);
        $group->post('/message', [ChatController::class, 'sendMessage']);
        $group->get('/sessions', [ChatController::class, 'getSessions']);
        $group->get('/sessions/{id}', [ChatController::class, 'getSession']);
        $group->put('/sessions/{id}', [ChatController::class, 'updateSession']);
        $group->delete('/sessions/{id}', [ChatController::class, 'deleteSession']);
    });
    
    // Resource routes (protected)
    $group->group('/resources', function (RouteCollectorProxy $group) {
        $group->get('/{category}', [ResourceController::class, 'getResourcesByCategory']);
        $group->post('/save', [ResourceController::class, 'saveResource']);
    });
    
})->add(new JwtAuthMiddleware());

// Admin routes (requires both JWT authentication and admin role)
$app->group('/api/admin', function (RouteCollectorProxy $group) {
    // Dashboard overview
    $group->get('/dashboard', [AdminController::class, 'getDashboard']);
    
    // User management
    $group->get('/users', [AdminController::class, 'getUsers']);
    $group->get('/users/{id}', [AdminController::class, 'getUserDetails']);
    $group->put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
    
    // Resource management
    $group->get('/resources/pending', [AdminController::class, 'getPendingResources']);
    $group->put('/resources/{id}/status', [AdminController::class, 'updateResourceStatus']);
    
    // System statistics
    $group->get('/stats', [AdminController::class, 'getSystemStats']);
})->add(new AdminAuthMiddleware())->add(new JwtAuthMiddleware()); 