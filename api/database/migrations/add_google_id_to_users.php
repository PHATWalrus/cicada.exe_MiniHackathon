<?php

use Illuminate\Database\Capsule\Manager as Capsule;

// Add google_id column to users table
Capsule::schema()->table('users', function ($table) {
    $table->string('google_id')->nullable()->after('email');
    $table->index('google_id');
});

echo "Migration completed: Added google_id to users table\n"; 