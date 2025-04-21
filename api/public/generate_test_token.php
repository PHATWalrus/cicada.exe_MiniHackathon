<?php
/**
 * This is a utility script for generating a test JWT token without fingerprinting.
 * DO NOT USE THIS IN PRODUCTION - it's only for troubleshooting purposes.
 */

// Load environment variables
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Import JWT utility
use DiaX\Utils\JwtUtil;

// Generate a token for user 1 (admin)
$userId = 1;
$email = 'admin@example.com';
$jwtSettings = [
    'secret' => $_ENV['JWT_SECRET'],
    'expiration' => 86400, // 24 hours
    'issuer' => 'diax.fileish.com',
    'audience' => 'diax.fileish.com'
];

// Generate token without fingerprinting
$token = JwtUtil::generateToken($userId, $email, $jwtSettings);

// Show the token
header('Content-Type: application/json');
echo json_encode([
    'token' => $token,
    'expires_in' => 86400,
    'user_id' => $userId,
    'note' => 'This token was generated WITHOUT fingerprinting for testing purposes'
]); 