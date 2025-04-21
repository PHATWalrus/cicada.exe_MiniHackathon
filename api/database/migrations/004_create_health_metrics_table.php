<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateHealthMetricsTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('health_metrics')) {
            Capsule::schema()->create('health_metrics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                
                // Blood glucose measurements
                $table->decimal('blood_glucose_level', 6, 2)->nullable()->comment('Blood glucose level in mg/dL');
                $table->enum('measurement_context', ['fasting', 'before_meal', 'after_meal', 'before_exercise', 'after_exercise', 'bedtime', 'random'])->nullable();
                
                // Blood pressure
                $table->integer('systolic_pressure')->nullable()->comment('Systolic blood pressure in mmHg');
                $table->integer('diastolic_pressure')->nullable()->comment('Diastolic blood pressure in mmHg');
                
                // Heart rate
                $table->integer('heart_rate')->nullable()->comment('Heart rate in beats per minute');
                
                // Weight tracking
                $table->decimal('weight_kg', 5, 2)->nullable()->comment('Weight in kilograms');
                
                // A1C results
                $table->decimal('a1c_percentage', 3, 1)->nullable()->comment('A1C test result percentage');
                
                // Medication taken
                $table->text('medication_notes')->nullable()->comment('Notes about medication taken');
                
                // Exercise
                $table->integer('exercise_duration')->nullable()->comment('Exercise duration in minutes');
                $table->string('exercise_type', 100)->nullable();
                $table->integer('exercise_intensity')->nullable()->comment('Exercise intensity (1-10 scale)');
                
                // Food intake
                $table->text('food_notes')->nullable()->comment('Notes about food consumed');
                $table->integer('carbs_grams')->nullable()->comment('Carbohydrates consumed in grams');
                
                // General notes
                $table->text('notes')->nullable()->comment('General notes for this entry');
                
                // Timestamps
                $table->timestamp('recorded_at')->useCurrent()->comment('When the measurement was taken');
                $table->timestamps();
                
                // Indexes
                $table->index('user_id');
                $table->index('recorded_at');
                $table->index('measurement_context');
            });
            
            echo "Table 'health_metrics' created successfully.\n";
        } else {
            echo "Table 'health_metrics' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('health_metrics');
    }
} 