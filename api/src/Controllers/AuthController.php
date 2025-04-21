<?php

namespace DiaX\Controllers;

use DiaX\Models\User;
use DiaX\Utils\JwtUtil;
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
        
        if (!$user || !$user->verifyPassword($data['password'])) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Invalid credentials'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);
        }
        
        // Generate token
        $token = JwtUtil::generateToken(
            $user->id,
            $user->email,
            $this->container->get('settings')['jwt']
        );
        
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
        // In a stateless JWT auth system, logout is typically handled client-side
        // by removing the token, but we can add the token to a blacklist if needed.
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Logged out successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
} 