<?php

namespace DiaX\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class CorsMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // Handle preflight requests
        if ($request->getMethod() === 'OPTIONS') {
            $response = new \Slim\Psr7\Response();
            return $this->addCorsHeaders($response, $request);
        }

        // Process the request
        $response = $handler->handle($request);
        
        // Add CORS headers to the response
        return $this->addCorsHeaders($response, $request);
    }
    
    private function addCorsHeaders(ResponseInterface $response, ServerRequestInterface $request): ResponseInterface
    {
        // Get allowed origins from environment or use a default
        $allowedOrigins = $_ENV['CORS_ALLOWED_ORIGINS'] ?? 'https://diax.vercel.app,https://diax.fileish.com,https://diax.cc';
        $origins = explode(',', $allowedOrigins);
        
        // Get origin from request
        $origin = $request->getHeaderLine('Origin');
        
        // Check if origin is allowed
        $allowedOrigin = in_array($origin, $origins) ? $origin : $origins[0];
        
        return $response
            ->withHeader('Access-Control-Allow-Origin', $allowedOrigin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization, X-Auth-Token')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Max-Age', '86400') // 24 hours
            ->withHeader('Vary', 'Origin') // Important for caching
            ->withHeader('X-Content-Type-Options', 'nosniff')
            ->withHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
} 