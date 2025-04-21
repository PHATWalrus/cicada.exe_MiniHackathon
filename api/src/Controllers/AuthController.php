<?php

namespace DiaX\Controllers;

use DiaX\Models\User;
use DiaX\Utils\JwtUtil;
use DiaX\Services\EmailService;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;

class AuthController
{
    private $container;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }
    
    public function register(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate input
        $errors = [];
        
        if (!isset($data['name']) || empty($data['name'])) {
            $errors['name'] = 'Name is required';
        }
        
        if (!isset($data['email']) || !v::email()->validate($data['email'])) {
            $errors['email'] = 'Valid email is required';
        } else {
            // Check if email already exists
            $existingUser = User::where('email', $data['email'])->first();
            if ($existingUser) {
                $errors['email'] = 'Email is already registered';
            }
        }
        
        if (!isset($data['password']) || strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        }
        
        if (!empty($errors)) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Validation failed',
                'errors' => $errors
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Create user
        $user = new User();
        $user->name = $data['name'];
        $user->email = $data['email'];
        $user->password = $data['password']; // Password will be hashed in the model
        
        if (isset($data['phone_number'])) {
            $user->phone_number = $data['phone_number'];
        }
        
        if (isset($data['date_of_birth'])) {
            $user->date_of_birth = $data['date_of_birth'];
        }
        
        if (isset($data['gender'])) {
            $user->gender = $data['gender'];
        }
        
        $user->save();
        
        // Send welcome email
        try {
            $emailService = $this->container->get(EmailService::class);
            $emailService->sendWelcomeEmail($user->email, $user->name);
        } catch (\Exception $e) {
            // Log the error but don't prevent registration
            if ($this->container->has('logger')) {
                $this->container->get('logger')->error('Failed to send welcome email: ' . $e->getMessage());
            }
        }
        
        // Generate token
        $token = JwtUtil::generateToken(
            $user->id,
            $user->email,
            $this->container->get('settings')['jwt']
        );
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'User registered successfully',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ],
                'token' => $token
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }
    
    public function login(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Get client information for security logs
        $clientIp = $request->getServerParams()['REMOTE_ADDR'] ?? null;
        $userAgent = $request->getHeaderLine('User-Agent');
        
        // Validate input
        if (!isset($data['email']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Email and password are required'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Find user by email
        $user = User::where('email', $data['email'])->first();
        
        // Check if account exists
        if (!$user) {
            // Use a consistent message to prevent user enumeration
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Invalid credentials'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
        
        // Check if account is locked
        if (isset($user->locked_until) && $user->locked_until > date('Y-m-d H:i:s')) {
            $lockedUntil = strtotime($user->locked_until);
            $minutesRemaining = ceil(($lockedUntil - time()) / 60);
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => "Account is temporarily locked. Please try again in {$minutesRemaining} minute(s)."
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
        
        // Verify password
        if (!$user->verifyPassword($data['password'])) {
            // Record failed login attempt if the model exists
            if (class_exists('DiaX\Models\LoginLog')) {
                \DiaX\Models\LoginLog::recordFailedAttempt($user, $clientIp, $userAgent);
            } else {
                // Simple incremental lock without the model
                $user->failed_login_attempts = ($user->failed_login_attempts ?? 0) + 1;
                
                // Lock after 5 attempts
                if ($user->failed_login_attempts >= 5) {
                    $lockMinutes = min(60, pow(2, $user->failed_login_attempts - 5));
                    $user->locked_until = date('Y-m-d H:i:s', time() + ($lockMinutes * 60));
                }
                
                $user->save();
            }
            
            // Use a consistent message to prevent user enumeration
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Invalid credentials'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
        
        // Generate token with fingerprinting
        $token = JwtUtil::generateToken(
            $user->id,
            $user->email,
            $this->container->get('settings')['jwt'],
            $clientIp,
            $userAgent
        );
        
        // Reset failed login attempts if any
        if (isset($user->failed_login_attempts) && $user->failed_login_attempts > 0) {
            $user->failed_login_attempts = 0;
            $user->locked_until = null;
            $user->save();
        }
        
        // Log successful login
        if (class_exists('DiaX\Models\LoginLog')) {
            \DiaX\Models\LoginLog::create([
                'user_id' => $user->id,
                'ip_address' => $clientIp,
                'user_agent' => $userAgent,
                'status' => 'success'
            ]);
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Login successful',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email
                ],
                'token' => $token
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function refresh(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        if (!isset($data['token'])) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Token is required'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        try {
            $userData = JwtUtil::decodeToken(
                $data['token'],
                $this->container->get('settings')['jwt']
            );
            
            $user = User::find($userData->sub);
            
            if (!$user) {
                throw new \Exception('User not found');
            }
            
            // Generate new token
            $newToken = JwtUtil::generateToken(
                $user->id,
                $user->email,
                $this->container->get('settings')['jwt']
            );
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'message' => 'Token refreshed successfully',
                'data' => [
                    'token' => $newToken
                ]
            ]));
            
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Invalid token: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
    }
    
    public function logout(Request $request, Response $response): Response
    {
        // Get token from the request (added by JwtAuthMiddleware)
        $token = $request->getAttribute('token');
        $userId = $request->getAttribute('user_id');
        
        // Get token payload to extract expiration
        $userData = null;
        try {
            $userData = JwtUtil::decodeToken(
                $token,
                $this->container->get('settings')['jwt']
            );
        } catch (\Exception $e) {
            // Continue even if token isn't valid - we still want to respond with success
        }
        
        // Add token to blocklist if TokenBlocklist model exists
        if (class_exists('DiaX\Models\TokenBlocklist') && $token && $userId) {
            $tokenSignature = JwtUtil::getTokenSignature($token);
            
            // Get client IP for audit
            $clientIp = $request->getServerParams()['REMOTE_ADDR'] ?? null;
            
            // Create blocklist entry
            $tokenBlocklist = new \DiaX\Models\TokenBlocklist();
            $tokenBlocklist->token_signature = $tokenSignature;
            $tokenBlocklist->user_id = $userId;
            $tokenBlocklist->revoked_at = now();
            $tokenBlocklist->revoked_by_ip = $clientIp;
            
            // Set expiry time from token if available, otherwise default to 24 hours
            if ($userData && isset($userData->exp)) {
                $tokenBlocklist->expires_at = date('Y-m-d H:i:s', $userData->exp);
            } else {
                $tokenBlocklist->expires_at = date('Y-m-d H:i:s', time() + 86400);
            }
            
            $tokenBlocklist->save();
            
            // Periodically clean up expired tokens (do this occasionally to avoid doing it on every request)
            if (rand(1, 10) === 1) {
                \DiaX\Models\TokenBlocklist::purgeExpired();
            }
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Logged out successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Request a password reset token
     */
    public function forgotPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate input
        if (!isset($data['email']) || !v::email()->validate($data['email'])) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Valid email is required'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Find user by email
        $user = User::where('email', $data['email'])->first();
        
        // Always return the same response regardless of whether the email exists
        // This prevents user enumeration attacks
        if ($user) {
            // Generate a secure random token
            $token = bin2hex(random_bytes(32)); // 64 character string
            
            // Store a hash of the token (not the token itself) for security
            $user->reset_token = password_hash($token, PASSWORD_DEFAULT);
            $user->reset_token_expires_at = date('Y-m-d H:i:s', time() + 3600); // Token expires in 1 hour
            $user->save();
            
            // Send password reset email
            try {
                $emailService = $this->container->get(EmailService::class);
                $emailService->sendPasswordResetEmail($user->email, $token);
            } catch (\Exception $e) {
                // Log the error but continue with success response
                if ($this->container->has('logger')) {
                    $this->container->get('logger')->error('Failed to send password reset email: ' . $e->getMessage());
                }
            }
            
            // For development/testing purposes, you can log the token
            if ($this->container->get('settings')['app']['env'] === 'development') {
                error_log("Password reset token for {$user->email}: {$token}");
            }
        }
        
        // Return a generic success message regardless of whether the email exists
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'If the email address exists in our system, a password reset link has been sent.'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Reset password using a valid token
     */
    public function resetPassword(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate input
        $errors = [];
        
        if (!isset($data['token']) || empty($data['token'])) {
            $errors['token'] = 'Token is required';
        }
        
        if (!isset($data['password']) || strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        }
        
        if (!isset($data['password_confirmation']) || $data['password'] !== $data['password_confirmation']) {
            $errors['password_confirmation'] = 'Password confirmation does not match';
        }
        
        if (!empty($errors)) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Validation failed',
                'errors' => $errors
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Find the user with a non-expired token
        $user = User::whereNotNull('reset_token')
            ->where('reset_token_expires_at', '>', date('Y-m-d H:i:s'))
            ->get();
        
        // Check each user to find the one with the matching token
        $validUser = null;
        foreach ($user as $u) {
            // Since we stored a hash of the token, we need to verify it
            if (password_verify($data['token'], $u->reset_token)) {
                $validUser = $u;
                break;
            }
        }
        
        if (!$validUser) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Invalid or expired password reset token.'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Update the password
        $validUser->password = $data['password']; // Password will be hashed in the model
        $validUser->reset_token = null; // Invalidate the token
        $validUser->reset_token_expires_at = null;
        $validUser->save();
        
        // Send password reset confirmation email
        try {
            $emailService = $this->container->get(EmailService::class);
            $emailService->sendPasswordResetConfirmationEmail($validUser->email);
        } catch (\Exception $e) {
            // Log the error but continue with success response
            if ($this->container->has('logger')) {
                $this->container->get('logger')->error('Failed to send password reset confirmation email: ' . $e->getMessage());
            }
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Password has been reset successfully.'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
} 