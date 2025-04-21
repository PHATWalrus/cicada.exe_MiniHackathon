<?php

namespace DiaX\Middleware;

use DiaX\Utils\JwtUtil;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Factory\ResponseFactory;

class JwtAuthMiddleware implements MiddlewareInterface
{
    private $container;
    
    public function __construct(ContainerInterface $container = null)
    {
        $this->container = $container;
    }
    
    public function process(Request $request, RequestHandler $handler): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        
        if (!$authHeader) {
            return $this->respondWithError('Missing authorization header', 401);
        }
        
        if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return $this->respondWithError('Invalid token format', 401);
        }
        
        $token = $matches[1];
        $settings = $this->container ? $this->container->get('settings') : null;
        $jwtSettings = $settings['jwt'] ?? [
            'secret' => $_ENV['JWT_SECRET'],
            'issuer' => 'diax.fileish.com',
            'audience' => 'diax.fileish.com'
        ];
        
        try {
            $userData = JwtUtil::decodeToken($token, $jwtSettings);
            
            // Add user data to request
            $request = $request->withAttribute('jwt', $userData);
            $request = $request->withAttribute('user_id', $userData->sub);
            
            return $handler->handle($request);
        } catch (\Exception $e) {
            return $this->respondWithError($e->getMessage(), 401);
        }
    }
    
    private function respondWithError(string $message, int $status = 400): Response
    {
        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse($status);
        $response->getBody()->write(json_encode([
            'error' => true,
            'message' => $message
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
} 