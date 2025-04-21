<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatSession extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'title',
        'summary',
    ];

    /**
     * Get the user that owns the chat session.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the messages for the chat session.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
    }
    
    /**
     * Get the latest message in the session
     */
    public function getLatestMessageAttribute()
    {
        return $this->messages()->latest()->first();
    }
    
    /**
     * Generate a summary from the chat conversation
     */
    public function generateSummary(): void
    {
        // Get first user message
        $firstMessage = $this->messages()->where('sender_type', 'user')->orderBy('created_at')->first();
        
        if ($firstMessage) {
            // Use first message as the title if not already set
            if (!$this->title || $this->title === 'New Conversation') {
                $this->title = substr(trim($firstMessage->message), 0, 50);
                if (strlen($firstMessage->message) > 50) {
                    $this->title .= '...';
                }
                $this->save();
            }
        }
    }
} 