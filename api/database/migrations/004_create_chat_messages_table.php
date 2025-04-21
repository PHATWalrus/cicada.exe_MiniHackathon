<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateChatMessagesTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('chat_messages')) {
            Capsule::schema()->create('chat_messages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('chat_session_id')->constrained('chat_sessions')->onDelete('cascade');
                $table->enum('sender_type', ['user', 'bot']);
                $table->text('message');
                $table->json('context_data')->nullable();
                $table->timestamps();
            });
            
            echo "Table 'chat_messages' created successfully.\n";
        } else {
            echo "Table 'chat_messages' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('chat_messages');
    }
} 