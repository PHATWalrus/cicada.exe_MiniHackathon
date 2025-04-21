<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LoginLog extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'login_logs';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'ip_address',
        'user_agent',
        'status',
        'failure_reason'
    ];

    /**
     * Get the user that owns the login log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Record a failed login attempt and handle account locking
     *
     * @param User $user
     * @param string|null $ip
     * @param string|null $userAgent
     * @param string $reason
     * @return void
     */
    public static function recordFailedAttempt(User $user, ?string $ip, ?string $userAgent, string $reason = 'Invalid credentials'): void
    {
        // Record the failed attempt
        self::create([
            'user_id' => $user->id,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
            'status' => 'failed',
            'failure_reason' => $reason
        ]);
        
        // Increment failed login counter
        $user->failed_login_attempts = ($user->failed_login_attempts ?? 0) + 1;
        
        // Check if we should lock the account
        $maxAttempts = $_ENV['MAX_LOGIN_ATTEMPTS'] ?? 5;
        
        if ($user->failed_login_attempts >= $maxAttempts) {
            // Lock for increasing periods based on number of failures
            $lockMinutes = min(60, pow(2, $user->failed_login_attempts - $maxAttempts));
            $user->locked_until = date('Y-m-d H:i:s', time() + ($lockMinutes * 60));
            
            // Log the lock
            self::create([
                'user_id' => $user->id,
                'ip_address' => $ip,
                'user_agent' => $userAgent,
                'status' => 'locked',
                'failure_reason' => "Account locked for {$lockMinutes} minutes after {$user->failed_login_attempts} failed attempts"
            ]);
        }
        
        $user->save();
    }
} 