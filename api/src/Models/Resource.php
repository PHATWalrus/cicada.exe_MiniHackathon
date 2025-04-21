<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'title',
        'description',
        'url',
        'category',
        'type',
        'tags',
        'is_approved',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'tags' => 'array',
        'is_approved' => 'boolean',
    ];
    
    /**
     * Get approved resources
     */
    public static function getApproved()
    {
        return self::where('is_approved', true);
    }
    
    /**
     * Scope a query to resources in a specific category.
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }
    
    /**
     * Scope a query to resources of a specific type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
    
    /**
     * Scope a query to resources with a specific tag.
     */
    public function scopeWithTag($query, $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }
} 