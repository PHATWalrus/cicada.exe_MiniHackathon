<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'chat_session_id',
        'sender_type',
        'message',
        'context_data',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'context_data' => 'array',
    ];

    /**
     * Get the chat session that owns the message.
     */
    public function chatSession(): BelongsTo
    {
        return $this->belongsTo(ChatSession::class);
    }
    
    /**
     * Check if this message is from the bot
     */
    public function isFromBot(): bool
    {
        return $this->sender_type === 'bot';
    }
    
    /**
     * Check if this message is from the user
     */
    public function isFromUser(): bool
    {
        return $this->sender_type === 'user';
    }
} 