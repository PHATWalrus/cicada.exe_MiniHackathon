<?php

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;

class AddEmailVerificationColumns
{
    public function up()
    {
        if (Capsule::schema()->hasTable('users')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                // Check if columns don't exist before adding them
                if (!Capsule::schema()->hasColumn('users', 'verification_token')) {
                    $table->string('verification_token')->nullable();
                }
                if (!Capsule::schema()->hasColumn('users', 'verification_token_expires_at')) {
                    $table->timestamp('verification_token_expires_at')->nullable();
                }
                if (!Capsule::schema()->hasColumn('users', 'reset_token_expires_at')) {
                    $table->timestamp('reset_token_expires_at')->nullable();
                }
                if (!Capsule::schema()->hasColumn('users', 'is_admin')) {
                    $table->boolean('is_admin')->default(false);
                }
                if (!Capsule::schema()->hasColumn('users', 'failed_login_attempts')) {
                    $table->integer('failed_login_attempts')->default(0);
                }
                if (!Capsule::schema()->hasColumn('users', 'locked_until')) {
                    $table->timestamp('locked_until')->nullable();
                }
            });
            
            echo "Email verification columns added to users table successfully.\n";
        } else {
            echo "Table 'users' does not exist.\n";
        }
    }

    public function down()
    {
        if (Capsule::schema()->hasTable('users')) {
            Capsule::schema()->table('users', function (Blueprint $table) {
                // Drop columns if they exist
                if (Capsule::schema()->hasColumn('users', 'verification_token')) {
                    $table->dropColumn('verification_token');
                }
                if (Capsule::schema()->hasColumn('users', 'verification_token_expires_at')) {
                    $table->dropColumn('verification_token_expires_at');
                }
                if (Capsule::schema()->hasColumn('users', 'reset_token_expires_at')) {
                    $table->dropColumn('reset_token_expires_at');
                }
                if (Capsule::schema()->hasColumn('users', 'is_admin')) {
                    $table->dropColumn('is_admin');
                }
                if (Capsule::schema()->hasColumn('users', 'failed_login_attempts')) {
                    $table->dropColumn('failed_login_attempts');
                }
                if (Capsule::schema()->hasColumn('users', 'locked_until')) {
                    $table->dropColumn('locked_until');
                }
            });
            
            echo "Email verification columns removed from users table successfully.\n";
        }
    }
} 