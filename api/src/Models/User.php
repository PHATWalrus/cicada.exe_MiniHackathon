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
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'date_of_birth' => 'date',
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
} 