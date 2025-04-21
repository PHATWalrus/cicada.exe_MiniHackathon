<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'date_of_birth',
        'gender',
        'email_verified_at',
        'google_id',
        'verification_token',
        'verification_token_expires_at',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password',
        'reset_token',
        'reset_token_expires_at',
        'verification_token',
        'verification_token_expires_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
        'verification_token_expires_at' => 'datetime',
    ];

    /**
     * Get the user's medical profile.
     */
    public function medicalProfile(): HasOne
    {
        return $this->hasOne(MedicalProfile::class);
    }

    /**
     * Get the health metrics for the user.
     */
    public function healthMetrics(): HasMany
    {
        return $this->hasMany(HealthMetric::class);
    }

    /**
     * Get the chat sessions for the user.
     */
    public function chatSessions(): HasMany
    {
        return $this->hasMany(ChatSession::class);
    }
    
    /**
     * Hash the password before saving
     */
    public function setPasswordAttribute($value): void
    {
        $this->attributes['password'] = password_hash($value, PASSWORD_DEFAULT);
    }
    
    /**
     * Verify if the given password matches the user's password
     */
    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->password);
    }

    /**
     * Check if the user's email is verified
     */
    public function isEmailVerified(): bool
    {
        return $this->email_verified_at !== null;
    }

    /**
     * Mark the user's email as verified
     */
    public function markEmailAsVerified(): void
    {
        $this->email_verified_at = now();
        $this->verification_token = null;
        $this->verification_token_expires_at = null;
        $this->save();
    }

    /**
     * Generate verification token for the user
     */
    public function generateVerificationToken(): string
    {
        $this->verification_token = bin2hex(random_bytes(32));
        $this->verification_token_expires_at = now()->addHours(24);
        $this->save();
        
        return $this->verification_token;
    }

    /**
     * Check if the verification token is valid
     */
    public function isVerificationTokenValid(string $token): bool
    {
        return $this->verification_token === $token && 
               $this->verification_token_expires_at !== null && 
               $this->verification_token_expires_at->isFuture();
    }
} 