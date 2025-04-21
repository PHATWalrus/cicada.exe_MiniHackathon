<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateChatSessionsTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('chat_sessions')) {
            Capsule::schema()->create('chat_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('title');
                $table->text('summary')->nullable();
                $table->timestamps();
            });
            
            echo "Table 'chat_sessions' created successfully.\n";
        } else {
            echo "Table 'chat_sessions' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('chat_sessions');
    }
} 