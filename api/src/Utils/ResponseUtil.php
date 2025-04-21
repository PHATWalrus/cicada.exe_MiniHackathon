<?php

namespace DiaX\Utils;

use Psr\Http\Message\ResponseInterface;

class ResponseUtil
{
    /**
     * Create a JSON success response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param array|null $data The response data
     * @param string|null $message Success message
     * @param int $status HTTP status code
     * @return ResponseInterface
     */
    public static function success(ResponseInterface $response, ?array $data = null, ?string $message = null, int $status = 200): ResponseInterface
    {
        $payload = [
            'error' => false
        ];
        
        if ($data !== null) {
            $payload['data'] = $data;
        }
        
        if ($message !== null) {
            $payload['message'] = $message;
        }
        
        $response->getBody()->write(json_encode($payload));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
    
    /**
     * Create a JSON error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param string $message Error message
     * @param array|null $errors Additional error details
     * @param int $status HTTP status code
     * @return ResponseInterface
     */
    public static function error(ResponseInterface $response, string $message, ?array $errors = null, int $status = 400): ResponseInterface
    {
        $payload = [
            'error' => true,
            'message' => $message
        ];
        
        if ($errors !== null) {
            $payload['errors'] = $errors;
        }
        
        $response->getBody()->write(json_encode($payload));
        
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus($status);
    }
    
    /**
     * Create a JSON validation error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param array $errors Validation errors
     * @param string $message Error message
     * @return ResponseInterface
     */
    public static function validationError(ResponseInterface $response, array $errors, string $message = 'Validation failed'): ResponseInterface
    {
        return self::error($response, $message, $errors, 400);
    }
    
    /**
     * Create a not found error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param string $message Error message
     * @return ResponseInterface
     */
    public static function notFound(ResponseInterface $response, string $message = 'Resource not found'): ResponseInterface
    {
        return self::error($response, $message, null, 404);
    }
    
    /**
     * Create an unauthorized error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param string $message Error message
     * @return ResponseInterface
     */
    public static function unauthorized(ResponseInterface $response, string $message = 'Unauthorized'): ResponseInterface
    {
        return self::error($response, $message, null, 401);
    }
    
    /**
     * Create a forbidden error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param string $message Error message
     * @return ResponseInterface
     */
    public static function forbidden(ResponseInterface $response, string $message = 'Forbidden'): ResponseInterface
    {
        return self::error($response, $message, null, 403);
    }
    
    /**
     * Create a server error response
     *
     * @param ResponseInterface $response The PSR-7 response
     * @param string $message Error message
     * @return ResponseInterface
     */
    public static function serverError(ResponseInterface $response, string $message = 'Server error'): ResponseInterface
    {
        return self::error($response, $message, null, 500);
    }
} 