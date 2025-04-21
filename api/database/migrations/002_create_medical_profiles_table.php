<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateMedicalProfilesTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('medical_profiles')) {
            Capsule::schema()->create('medical_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->enum('diabetes_type', ['type1', 'type2', 'gestational', 'prediabetes', 'other'])->nullable();
                $table->year('diagnosis_year')->nullable();
                $table->decimal('height_cm', 5, 2)->nullable();
                $table->decimal('weight_kg', 5, 2)->nullable();
                $table->decimal('target_glucose_min', 5, 2)->nullable();
                $table->decimal('target_glucose_max', 5, 2)->nullable();
                $table->text('medications')->nullable();
                $table->text('allergies')->nullable();
                $table->text('comorbidities')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
            
            echo "Table 'medical_profiles' created successfully.\n";
        } else {
            echo "Table 'medical_profiles' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('medical_profiles');
    }
} 