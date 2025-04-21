<?php

class AddAccountLockingToUsers
{
    public function up()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if ($schema->hasTable('users') && 
            !$schema->hasColumn('users', 'failed_login_attempts') && 
            !$schema->hasColumn('users', 'locked_until')) {
            
            $schema->table('users', function ($table) {
                $table->integer('failed_login_attempts')->default(0)->after('remember_token');
                $table->timestamp('locked_until')->nullable()->after('failed_login_attempts');
            });
        }
    }
    
    public function down()
    {
        $schema = \Illuminate\Database\Capsule\Manager::schema();
        
        if ($schema->hasTable('users')) {
            $schema->table('users', function ($table) use ($schema) {
                if ($schema->hasColumn('users', 'failed_login_attempts')) {
                    $table->dropColumn('failed_login_attempts');
                }
                
                if ($schema->hasColumn('users', 'locked_until')) {
                    $table->dropColumn('locked_until');
                }
            });
        }
    }
} 