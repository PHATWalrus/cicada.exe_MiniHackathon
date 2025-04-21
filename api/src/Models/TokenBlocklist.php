<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;

class TokenBlocklist extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'token_blocklist';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'token_signature',
        'user_id',
        'expires_at',
        'revoked_at',
        'revoked_by_ip'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    /**
     * Purge expired tokens from the blocklist
     * 
     * @return int Number of purged tokens
     */
    public static function purgeExpired(): int
    {
        return self::where('expires_at', '<', now())->delete();
    }
} 