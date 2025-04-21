<?php

class CreateLoginLogsTable
{
    public function up()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if (!$schema->hasTable('login_logs')) {
            $schema->create('login_logs', function ($table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('ip_address', 45)->nullable();
                $table->string('user_agent', 512)->nullable();
                $table->string('status', 20)->default('failed'); // success, failed, locked
                $table->string('failure_reason', 255)->nullable();
                $table->timestamps();
                
                // Foreign key
                $table->foreign('user_id')
                      ->references('id')
                      ->on('users')
                      ->onDelete('cascade');
            });
        }
    }
    
    public function down()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if ($schema->hasTable('login_logs')) {
            $schema->drop('login_logs');
        }
    }
} 