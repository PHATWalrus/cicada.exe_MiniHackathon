<?php

use App\Controllers\AuthController;
use App\Middlewares\JwtAuthMiddleware;

// Auth routes
$app->post('/auth/register', AuthController::class . ':register');
$app->post('/auth/login', AuthController::class . ':login');
$app->post('/auth/refresh', AuthController::class . ':refresh');
$app->post('/auth/logout', AuthController::class . ':logout')->add($jwtAuthMiddleware);
$app->post('/auth/forgot-password', AuthController::class . ':forgotPassword');
$app->post('/auth/reset-password', AuthController::class . ':resetPassword');
$app->post('/auth/verify-email', AuthController::class . ':verifyEmail');
$app->post('/auth/resend-verification', AuthController::class . ':resendVerification'); 