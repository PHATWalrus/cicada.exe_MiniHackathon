<?php

namespace DiaX\Utils;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use stdClass;

class JwtUtil
{
    /**
     * Generate a JWT token for a user
     *
     * @param int $userId
     * @param string $email
     * @param array $settings
     * @param string|null $clientIp
     * @param string|null $userAgent
     * @return string
     */
    public static function generateToken(int $userId, string $email, array $settings, ?string $clientIp = null, ?string $userAgent = null): string
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + ($settings['expiration'] ?? 3600);
        
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'iss' => $settings['issuer'] ?? 'diax.fileish.com',
            'aud' => $settings['audience'] ?? 'diax.fileish.com',
            'sub' => $userId,
            'email' => $email,
            'jti' => bin2hex(random_bytes(16)), // JWT ID - unique identifier for the token
        ];
        
        // Add fingerprint data if enabled
        if (isset($_ENV['ENABLE_TOKEN_FINGERPRINT']) && $_ENV['ENABLE_TOKEN_FINGERPRINT'] === 'true') {
            // This section is disabled by default to prevent "Invalid token fingerprint" errors
            // Uncomment this code if you need this security feature and have consistent client information
            /*
            // Create a fingerprint hash using user info and client details
            $fingerprintData = [
                'ip' => $clientIp,
                'ua' => substr(md5($userAgent ?? ''), 0, 10), // Store only a partial hash of user agent
            ];
            
            $payload['fgp'] = $fingerprintData;
            */
        }
        
        return JWT::encode($payload, $settings['secret'], 'HS256');
    }
    
    /**
     * Decode and validate a JWT token
     *
     * @param string $token
     * @param array $settings
     * @return stdClass The token payload
     * @throws \Exception If token is invalid
     */
    public static function decodeToken(string $token, array $settings): stdClass
    {
        try {
            return JWT::decode(
                $token,
                new Key($settings['secret'], 'HS256')
            );
        } catch (\Exception $e) {
            throw new \Exception('Invalid token: ' . $e->getMessage());
        }
    }
    
    /**
     * Extract the token signature for blocklist comparison
     *
     * @param string $token
     * @return string
     */
    public static function getTokenSignature(string $token): string
    {
        $tokenParts = explode('.', $token);
        if (count($tokenParts) !== 3) {
            return '';
        }
        
        // Return just the signature part
        return $tokenParts[2];
    }
    
    /**
     * Validate token fingerprint against current request
     *
     * @param stdClass $payload
     * @param string|null $clientIp
     * @param string|null $userAgent
     * @return bool
     */
    public static function validateFingerprint(stdClass $payload, ?string $clientIp, ?string $userAgent): bool
    {
        // If fingerprint checking is disabled or no fingerprint in token
        if (!isset($payload->fgp)) {
            return true;
        }
        
        // Check IP if it was stored
        if (isset($payload->fgp->ip) && $payload->fgp->ip !== $clientIp) {
            return false;
        }
        
        // Check user agent hash if it was stored
        if (isset($payload->fgp->ua) && $payload->fgp->ua !== substr(md5($userAgent ?? ''), 0, 10)) {
            return false;
        }
        
        return true;
    }
} 