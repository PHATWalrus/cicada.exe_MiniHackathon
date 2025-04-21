<?php

namespace DiaX\Middleware;

use DiaX\Models\User;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class EmailVerificationMiddleware implements MiddlewareInterface
{
    /**
     * Middleware to check if a user's email is verified
     * 
     * @param Request $request
     * @param RequestHandler $handler
     * @return Response
     */
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Get the user ID from the request attributes (set by JWT middleware)
        $userId = $request->getAttribute('user_id');
        
        if ($userId) {
            // Fetch the user
            $user = User::find($userId);
            
            // Check if user exists and email is verified
            if (!$user || $user->email_verified_at === null) {
                $response = new \Slim\Psr7\Response();
                $response->getBody()->write(json_encode([
                    'error' => true,
                    'message' => 'Email verification required. Please verify your email before accessing this resource.',
                    'code' => 'EMAIL_NOT_VERIFIED'
                ]));
                
                return $response
                    ->withHeader('Content-Type', 'application/json')
                    ->withStatus(403);
            }
        }
        
        // If email is verified or no user ID in request, proceed to next middleware
        return $handler->handle($request);
    }
} 