<?php

namespace DiaX\Middleware;

use DiaX\Models\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Factory\ResponseFactory;

class AdminAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Get user ID from JWT middleware
        $userId = $request->getAttribute('user_id');
        
        // If no user ID is present, the user is not authenticated
        if (!$userId) {
            return $this->respondWithError('Unauthorized access', 401);
        }
        
        // Check if user exists and is an admin
        $user = User::find($userId);
        
        if (!$user || !$user->is_admin) {
            return $this->respondWithError('Admin access required', 403);
        }
        
        // User is an admin, proceed with the request
        return $handler->handle($request);
    }
    
    private function respondWithError(string $message, int $status = 400): Response
    {
        $response = (new ResponseFactory())->createResponse($status);
        $response->getBody()->write(json_encode([
            'error' => true,
            'message' => $message
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
} 