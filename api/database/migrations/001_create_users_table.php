<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class CreateUsersTable
{
    public function up()
    {
        if (!Capsule::schema()->hasTable('users')) {
            Capsule::schema()->create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->string('password');
                $table->string('phone_number')->nullable();
                $table->date('date_of_birth')->nullable();
                $table->enum('gender', ['male', 'female', 'other'])->nullable();
                $table->string('reset_token')->nullable();
                $table->timestamp('email_verified_at')->nullable();
                $table->timestamps();
            });
            
            echo "Table 'users' created successfully.\n";
        } else {
            echo "Table 'users' already exists.\n";
        }
    }

    public function down()
    {
        Capsule::schema()->dropIfExists('users');
    }
} 