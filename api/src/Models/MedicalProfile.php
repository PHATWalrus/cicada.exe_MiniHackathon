<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalProfile extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'diabetes_type',
        'diagnosis_year',
        'height_cm',
        'weight_kg',
        'target_glucose_min',
        'target_glucose_max',
        'medications',
        'allergies',
        'comorbidities',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'diagnosis_year' => 'integer',
        'height_cm' => 'float',
        'weight_kg' => 'float',
        'target_glucose_min' => 'float',
        'target_glucose_max' => 'float',
    ];

    /**
     * Get the user that owns the medical profile.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Calculate BMI if height and weight are available
     *
     * @return float|null
     */
    public function getBmiAttribute(): ?float
    {
        if (!$this->height_cm || !$this->weight_kg || $this->height_cm <= 0) {
            return null;
        }
        
        // BMI = weight(kg) / (height(m))²
        $heightInMeters = $this->height_cm / 100;
        return round($this->weight_kg / ($heightInMeters * $heightInMeters), 1);
    }
} 