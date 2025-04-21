<?php

namespace DiaX\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class HealthMetric extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'user_id',
        'blood_glucose_level',
        'measurement_context',
        'systolic_pressure',
        'diastolic_pressure',
        'heart_rate',
        'weight_kg',
        'a1c_percentage',
        'medication_notes',
        'exercise_duration',
        'exercise_type',
        'exercise_intensity',
        'food_notes',
        'carbs_grams',
        'notes',
        'recorded_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'blood_glucose_level' => 'float',
        'systolic_pressure' => 'integer',
        'diastolic_pressure' => 'integer',
        'heart_rate' => 'integer',
        'weight_kg' => 'float',
        'a1c_percentage' => 'float',
        'exercise_duration' => 'integer',
        'exercise_intensity' => 'integer',
        'carbs_grams' => 'integer',
        'recorded_at' => 'datetime',
    ];
    
    /**
     * Get the user that owns this health metric record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * Get blood pressure as a formatted string
     * 
     * @return string|null
     */
    public function getBloodPressureAttribute(): ?string
    {
        if ($this->systolic_pressure && $this->diastolic_pressure) {
            return "{$this->systolic_pressure}/{$this->diastolic_pressure} mmHg";
        }
        
        return null;
    }
    
    /**
     * Scope a query to only include metrics from a specific time period
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $days Number of days to look back
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLastDays($query, int $days)
    {
        return $query->where('recorded_at', '>=', Carbon::now()->subDays($days));
    }
    
    /**
     * Scope a query to only include blood glucose readings
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBloodGlucose($query)
    {
        return $query->whereNotNull('blood_glucose_level');
    }
    
    /**
     * Scope a query to only include blood pressure readings
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBloodPressure($query)
    {
        return $query->whereNotNull('systolic_pressure')->whereNotNull('diastolic_pressure');
    }
} 