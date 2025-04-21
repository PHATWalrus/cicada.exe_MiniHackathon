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
     * @return string
     */
    public static function generateToken(int $userId, string $email, array $settings): string
    {
        $issuedAt = time();
        $expirationTime = $issuedAt + ($settings['expiration'] ?? 3600);
        
        $payload = [
            'iat' => $issuedAt,
            'exp' => $expirationTime,
            'iss' => $settings['issuer'] ?? 'diax.fileish.com',
            'aud' => $settings['audience'] ?? 'diax.fileish.com',
            'sub' => $userId,
            'email' => $email
        ];
        
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
} 