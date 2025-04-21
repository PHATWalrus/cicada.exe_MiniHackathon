<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class AddEmailVerificationToUsers
{
    public function up()
    {
        if (Capsule::schema()->hasTable('users')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                if (!Capsule::schema()->hasColumn('users', 'verification_token')) {
                    $table->string('verification_token')->nullable();
                }
                if (!Capsule::schema()->hasColumn('users', 'verification_token_expires_at')) {
                    $table->timestamp('verification_token_expires_at')->nullable();
                }
            });
            
            echo "Added email verification fields to 'users' table successfully.\n";
        } else {
            echo "Table 'users' does not exist.\n";
        }
    }

    public function down()
    {
        if (Capsule::schema()->hasTable('users')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                $table->dropColumn(['verification_token', 'verification_token_expires_at']);
            });
        }
    }
} 