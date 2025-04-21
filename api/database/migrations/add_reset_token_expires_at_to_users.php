<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class AddResetTokenExpiresAtToUsers
{
    public function up()
    {
        if (Capsule::schema()->hasTable('users') && !Capsule::schema()->hasColumn('users', 'reset_token_expires_at')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                $table->timestamp('reset_token_expires_at')->nullable()->after('reset_token');
            });
            
            echo "Column 'reset_token_expires_at' added to 'users' table successfully.\n";
        } else {
            echo "Table 'users' doesn't exist or column 'reset_token_expires_at' already exists.\n";
        }
    }

    public function down()
    {
        if (Capsule::schema()->hasTable('users') && Capsule::schema()->hasColumn('users', 'reset_token_expires_at')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                $table->dropColumn('reset_token_expires_at');
            });
        }
    }
} 