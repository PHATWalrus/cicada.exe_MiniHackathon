<?php

class CreateRateLimitsTable
{
    public function up()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if (!$schema->hasTable('rate_limits')) {
            $schema->create('rate_limits', function ($table) {
                $table->id();
                $table->string('key', 255)->unique();
                $table->string('ip', 45)->index();
                $table->integer('attempts')->default(0);
                $table->timestamp('expires_at')->index();
                $table->timestamps();
            });
        }
    }
    
    public function down()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if ($schema->hasTable('rate_limits')) {
            $schema->drop('rate_limits');
        }
    }
} 