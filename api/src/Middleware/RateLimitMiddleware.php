<?php

namespace DiaX\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Factory\ResponseFactory;
use Illuminate\Database\Capsule\Manager as DB;

class RateLimitMiddleware implements MiddlewareInterface
{
    private $maxAttempts;
    private $decayMinutes;
    private $prefix;
    
    /**
     * Create a new rate limiting middleware.
     *
     * @param int $maxAttempts
     * @param int $decayMinutes
     * @param string $prefix
     */
    public function __construct(int $maxAttempts = 60, int $decayMinutes = 1, string $prefix = 'rate_limit:')
    {
        $this->maxAttempts = $maxAttempts;
        $this->decayMinutes = $decayMinutes;
        $this->prefix = $prefix;
    }
    
    /**
     * Process an incoming request.
     *
     * @param Request $request
     * @param RequestHandler $handler
     * @return Response
     */
    public function process(Request $request, RequestHandler $handler): Response
    {
        // Get client IP
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';
        
        // Create a unique key for this IP and endpoint
        $key = $this->prefix . $ip . ':' . md5($request->getUri()->getPath());
        
        // Check if we have a rate_limits table
        $hasRateLimitsTable = false;
        try {
            $hasRateLimitsTable = DB::schema()->hasTable('rate_limits');
        } catch (\Exception $e) {
            // Table doesn't exist, we'll use a simpler in-memory approach
        }
        
        if ($hasRateLimitsTable) {
            // Use database for rate limiting
            $result = $this->handleDatabaseRateLimit($key, $ip);
            if (!$result['allowed']) {
                return $this->respondWithTooManyRequests($result['retry_after']);
            }
        } else {
            // Use simpler in-memory approach (less reliable but functional)
            // This uses APC if available or a simple file-based cache
            if (function_exists('apcu_inc')) {
                // Use APCu if available
                $success = false; // Initialize the variable
                $count = apcu_inc($key, 1, $success, $this->decayMinutes * 60);
                if (!$success) {
                    apcu_store($key, 1, $this->decayMinutes * 60);
                    $count = 1;
                }
                
                if ($count > $this->maxAttempts) {
                    return $this->respondWithTooManyRequests(60);
                }
            } else {
                // Fallback to very simple mechanism - not ideal but better than nothing
                $cacheDir = sys_get_temp_dir() . '/diax_rate_limits';
                if (!is_dir($cacheDir)) {
                    mkdir($cacheDir, 0755, true);
                }
                
                $file = $cacheDir . '/' . md5($key) . '.tmp';
                $count = 1;
                
                if (file_exists($file)) {
                    $data = unserialize(file_get_contents($file));
                    $count = $data['count'] + 1;
                    
                    // If expiry has passed, reset the count
                    if (time() > $data['expires']) {
                        $count = 1;
                    }
                    
                    // If rate limit exceeded
                    if ($count > $this->maxAttempts && time() <= $data['expires']) {
                        return $this->respondWithTooManyRequests(
                            max(0, $data['expires'] - time())
                        );
                    }
                }
                
                // Update the file
                file_put_contents($file, serialize([
                    'count' => $count,
                    'expires' => time() + ($this->decayMinutes * 60),
                ]));
            }
        }
        
        // Process the request
        $response = $handler->handle($request);
        
        return $response;
    }
    
    /**
     * Handle database-based rate limiting
     *
     * @param string $key
     * @param string $ip
     * @return array
     */
    private function handleDatabaseRateLimit(string $key, string $ip): array
    {
        // Cleanup old entries first (occasionally)
        if (rand(1, 20) === 1) {
            DB::table('rate_limits')
                ->where('expires_at', '<', DB::raw('NOW()'))
                ->delete();
        }
        
        // Get current rate limit record
        $rateLimit = DB::table('rate_limits')
            ->where('key', $key)
            ->first();
        
        if (!$rateLimit) {
            // First request, create a new record
            DB::table('rate_limits')->insert([
                'key' => $key,
                'ip' => $ip,
                'attempts' => 1,
                'expires_at' => DB::raw('DATE_ADD(NOW(), INTERVAL ' . $this->decayMinutes . ' MINUTE)'),
                'created_at' => DB::raw('NOW()'),
                'updated_at' => DB::raw('NOW()')
            ]);
            
            return ['allowed' => true, 'attempts' => 1, 'retry_after' => 0];
        }
        
        // Check if the rate limit has expired
        $isExpired = strtotime($rateLimit->expires_at) < time();
        
        if ($isExpired) {
            // Reset the rate limit
            DB::table('rate_limits')
                ->where('key', $key)
                ->update([
                    'attempts' => 1,
                    'expires_at' => DB::raw('DATE_ADD(NOW(), INTERVAL ' . $this->decayMinutes . ' MINUTE)'),
                    'updated_at' => DB::raw('NOW()')
                ]);
            
            return ['allowed' => true, 'attempts' => 1, 'retry_after' => 0];
        }
        
        $newAttempts = $rateLimit->attempts + 1;
        
        if ($newAttempts > $this->maxAttempts) {
            // Rate limit exceeded
            return [
                'allowed' => false,
                'attempts' => $newAttempts,
                'retry_after' => max(0, strtotime($rateLimit->expires_at) - time())
            ];
        }
        
        // Increment the attempts
        DB::table('rate_limits')
            ->where('key', $key)
            ->update([
                'attempts' => $newAttempts,
                'updated_at' => DB::raw('NOW()')
            ]);
        
        return ['allowed' => true, 'attempts' => $newAttempts, 'retry_after' => 0];
    }
    
    /**
     * Create a 'too many requests' response.
     *
     * @param int $retryAfter
     * @return Response
     */
    private function respondWithTooManyRequests(int $retryAfter): Response
    {
        $responseFactory = new ResponseFactory();
        $response = $responseFactory->createResponse(429);
        
        $response = $response
            ->withHeader('Content-Type', 'application/json')
            ->withHeader('Retry-After', (string) $retryAfter);
        
        $response->getBody()->write(json_encode([
            'error' => true,
            'message' => 'Too many requests. Please try again later.',
            'retry_after' => $retryAfter
        ]));
        
        return $response;
    }
} 