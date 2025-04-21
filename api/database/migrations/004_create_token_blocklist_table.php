<?php

class CreateTokenBlocklistTable
{
    public function up()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if (!$schema->hasTable('token_blocklist')) {
            $schema->create('token_blocklist', function ($table) {
                $table->id();
                $table->string('token_signature', 512)->unique();
                $table->unsignedBigInteger('user_id')->index();
                $table->timestamp('expires_at');
                $table->timestamp('revoked_at');
                $table->string('revoked_by_ip', 45)->nullable();
                $table->timestamps();
                
                // Add index on expires_at for purging
                $table->index('expires_at');
                
                // Add foreign key
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
        
        if ($schema->hasTable('token_blocklist')) {
            $schema->drop('token_blocklist');
        }
    }
} 