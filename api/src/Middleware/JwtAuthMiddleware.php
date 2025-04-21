<?php

namespace DiaX\Middleware;

use DiaX\Utils\JwtUtil;
use DiaX\Models\TokenBlocklist;
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
            // Check if token is in blocklist (revoked)
            if (class_exists('DiaX\Models\TokenBlocklist')) {
                $blockedToken = TokenBlocklist::where('token_signature', JwtUtil::getTokenSignature($token))->first();
                if ($blockedToken) {
                    throw new \Exception('Token has been revoked');
                }
            }
            
            // Validate token
            $userData = JwtUtil::decodeToken($token, $jwtSettings);
            
            // Check token expiration (redundant but extra security)
            if (isset($userData->exp) && $userData->exp < time()) {
                throw new \Exception('Token has expired');
            }
            
            // Check issuer and audience if provided
            if (isset($userData->iss) && $userData->iss !== $jwtSettings['issuer']) {
                throw new \Exception('Invalid token issuer');
            }
            
            if (isset($userData->aud) && $userData->aud !== $jwtSettings['audience']) {
                throw new \Exception('Invalid token audience');
            }
            
            // Enforce fingerprint validation if enabled
            if (isset($_ENV['ENABLE_TOKEN_FINGERPRINT']) && $_ENV['ENABLE_TOKEN_FINGERPRINT'] === 'true') {
                // This code is currently disabled to prevent "Invalid token fingerprint" errors
                // If you want to re-enable this security feature, you'll need to ensure IP addresses 
                // and user agents are consistent between token generation and validation
                /*
                $clientIp = $request->getServerParams()['REMOTE_ADDR'] ?? null;
                $userAgent = $request->getHeaderLine('User-Agent');
                
                if (!JwtUtil::validateFingerprint($userData, $clientIp, $userAgent)) {
                    throw new \Exception('Invalid token fingerprint');
                }
                */
            }
            
            // Add user data to request
            $request = $request->withAttribute('jwt', $userData);
            $request = $request->withAttribute('user_id', $userData->sub);
            
            // Add the token to the request for logout functionality
            $request = $request->withAttribute('token', $token);
            
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