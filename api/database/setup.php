<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Initialize Eloquent
$capsule = new Capsule;

$capsule->addConnection([
    'driver'    => $_ENV['DB_CONNECTION'],
    'host'      => $_ENV['DB_HOST'],
    'port'      => $_ENV['DB_PORT'],
    'database'  => $_ENV['DB_DATABASE'],
    'username'  => $_ENV['DB_USERNAME'],
    'password'  => $_ENV['DB_PASSWORD'],
    'charset'   => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix'    => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

// Create database if it doesn't exist
try {
    $pdo = new PDO(
        "{$_ENV['DB_CONNECTION']}:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']}",
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    );
    
    //$pdo->exec("CREATE DATABASE IF NOT EXISTS {$_ENV['DB_DATABASE']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    //echo "Database {$_ENV['DB_DATABASE']} created or already exists.\n";
    
} catch (PDOException $e) {
    //die("Database error: " . $e->getMessage() . "\n");
}

// Run migrations
$migrationFiles = glob(__DIR__ . '/migrations/*.php');
sort($migrationFiles);

foreach ($migrationFiles as $file) {
    require_once $file;
    
    $className = basename($file, '.php');
    $migration = new $className();
    
    echo "Running migration: {$className}...\n";
    $migration->up();
    echo "Migration completed.\n";
}

// Manually include the email verification columns migration
// since it may not be picked up by the glob if saved in a different location
require_once __DIR__ . '/migrations/add_email_verification_columns.php';
$emailVerificationMigration = new AddEmailVerificationColumns();
echo "Running migration: AddEmailVerificationColumns...\n";
$emailVerificationMigration->up();
echo "Migration completed.\n";

echo "Database setup completed successfully!\n"; 