<?php

/**
 * Database setup script
 * 
 * This file runs the database migrations to create all necessary tables.
 */

// Enable full error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

echo "Starting database setup...\n";

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

echo "Database connection established successfully.\n";

// Create database if it doesn't exist
try {
    $pdo = new PDO(
        "{$_ENV['DB_CONNECTION']}:host={$_ENV['DB_HOST']};port={$_ENV['DB_PORT']}",
        $_ENV['DB_USERNAME'],
        $_ENV['DB_PASSWORD']
    );
    
    $pdo->exec("CREATE DATABASE IF NOT EXISTS {$_ENV['DB_DATABASE']} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database {$_ENV['DB_DATABASE']} created or already exists.\n";
    
} catch (PDOException $e) {
    die("Database error: " . $e->getMessage() . "\n");
}

// Migration class name mapping
function getMigrationClassName($filename) {
    // Extract the part after the sequence number (remove XXX_ prefix)
    $namePart = preg_replace('/^\d+_/', '', $filename);
    
    // Convert to StudlyCase (e.g. create_users_table -> CreateUsersTable)
    $namePart = str_replace('_', ' ', $namePart);
    $namePart = ucwords($namePart);
    $namePart = str_replace(' ', '', $namePart);
    
    return $namePart;
}

// Run migrations
$migrationsPath = __DIR__ . '/database/migrations/*.php';
echo "Looking for migrations in: $migrationsPath\n";

$migrationFiles = glob($migrationsPath);
echo "Found " . count($migrationFiles) . " migration files.\n";

if (count($migrationFiles) == 0) {
    echo "No migrations found! Checking directory exists...\n";
    
    $dirPath = __DIR__ . '/database/migrations';
    if (!is_dir($dirPath)) {
        echo "ERROR: Migrations directory not found at: $dirPath\n";
    } else {
        echo "Directory exists. Contents:\n";
        $files = scandir($dirPath);
        print_r($files);
    }
    
    exit(1);
}

sort($migrationFiles);
foreach ($migrationFiles as $file) {
    echo "Processing file: $file\n";
    
    try {
        require_once $file;
        
        $baseName = basename($file, '.php');
        $className = getMigrationClassName($baseName);
        
        echo "Looking for class: $className\n";
        
        // Check if the class exists
        if (!class_exists($className)) {
            echo "ERROR: Class '$className' not found in file $file\n";
            continue;
        }
        
        $migration = new $className();
        
        // Check if the up method exists
        if (!method_exists($migration, 'up')) {
            echo "ERROR: Method 'up' not found in class $className\n";
            continue;
        }
        
        echo "Running migration: {$className}...\n";
        $migration->up();
        echo "Migration completed successfully.\n";
    } catch (Throwable $e) {
        echo "ERROR executing migration $file: " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
        echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    }
}

echo "Database setup completed successfully!\n"; 