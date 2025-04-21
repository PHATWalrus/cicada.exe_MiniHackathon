<?php

/**
 * Database setup script
 * 
 * This file runs the database migrations to create all necessary tables,
 * including security-related tables for token blocklist, rate limiting,
 * and login tracking.
 */

// Enable full error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;
use Illuminate\Database\Capsule\Manager as Capsule;

// Display setup banner
echo "\n";
echo "===========================================\n";
echo "      DiaX API - Database Setup Script     \n";
echo "===========================================\n\n";

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    echo "Environment file loaded successfully.\n";
} else {
    echo "Warning: .env file not found. Using default values.\n";
    echo "Please create a .env file from .env.example for proper configuration.\n\n";
}

echo "Starting database setup...\n";

// Initialize Eloquent
$capsule = new Capsule;

$capsule->addConnection([
    'driver'    => isset($_ENV['DB_CONNECTION']) ? $_ENV['DB_CONNECTION'] : 'mysql',
    'host'      => isset($_ENV['DB_HOST']) ? $_ENV['DB_HOST'] : 'localhost',
    'port'      => isset($_ENV['DB_PORT']) ? $_ENV['DB_PORT'] : '3306',
    'database'  => isset($_ENV['DB_DATABASE']) ? $_ENV['DB_DATABASE'] : 'diax',
    'username'  => isset($_ENV['DB_USERNAME']) ? $_ENV['DB_USERNAME'] : 'root',
    'password'  => isset($_ENV['DB_PASSWORD']) ? $_ENV['DB_PASSWORD'] : '',
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
        (isset($_ENV['DB_CONNECTION']) ? $_ENV['DB_CONNECTION'] : 'mysql') . 
        ":host=" . (isset($_ENV['DB_HOST']) ? $_ENV['DB_HOST'] : 'localhost') . 
        ";port=" . (isset($_ENV['DB_PORT']) ? $_ENV['DB_PORT'] : '3306'),
        isset($_ENV['DB_USERNAME']) ? $_ENV['DB_USERNAME'] : 'root',
        isset($_ENV['DB_PASSWORD']) ? $_ENV['DB_PASSWORD'] : ''
    );
    
    $dbName = isset($_ENV['DB_DATABASE']) ? $_ENV['DB_DATABASE'] : 'diax';
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "Database `$dbName` created or already exists.\n";
    
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

// Sort migrations to ensure they run in correct order
sort($migrationFiles);
$successCount = 0;
$securityTables = ['token_blocklist', 'rate_limits', 'login_logs'];
$securityTablesFound = [];

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
        
        // Track security tables
        foreach ($securityTables as $table) {
            if (stripos($className, $table) !== false) {
                $securityTablesFound[] = $table;
            }
        }
        
        $successCount++;
        echo "Migration completed successfully.\n";
    } catch (Throwable $e) {
        echo "ERROR executing migration $file: " . $e->getMessage() . "\n";
        echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
        echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    }
}

// Verify security tables
echo "\nVerifying security tables...\n";

$schema = $capsule->schema();
$missingSecurityTables = [];

foreach ($securityTables as $table) {
    if ($schema->hasTable($table)) {
        echo "✓ $table table exists\n";
    } else {
        $missingSecurityTables[] = $table;
        echo "✗ $table table is missing\n";
    }
}

if (!empty($missingSecurityTables)) {
    echo "\nWARNING: Some security tables are missing. API security features may not work properly.\n";
    echo "Run this setup script again or check the migration files.\n";
} else {
    echo "\nAll security tables are properly configured.\n";
}

// Verify account locking fields in users table
if ($schema->hasTable('users')) {
    echo "\nVerifying user account locking fields...\n";
    
    if ($schema->hasColumn('users', 'failed_login_attempts') && $schema->hasColumn('users', 'locked_until')) {
        echo "✓ Account locking fields exist in users table\n";
    } else {
        echo "✗ Account locking fields are missing from users table\n";
        echo "Run the migration for account locking (006_add_account_locking_to_users.php)\n";
    }
}

echo "\nDatabase setup completed with $successCount successful migrations!\n";

// Provide instruction for environment setup
echo "\nIMPORTANT: To enable security features, make sure your .env file includes:\n";
echo "- ENABLE_TOKEN_FINGERPRINT=true\n";
echo "- MAX_LOGIN_ATTEMPTS=5\n";
echo "- CORS_ALLOWED_ORIGINS=https://diax.vercel.app,https://diax.fileish.com\n";
echo "\nSee SECURITY.md for full security configuration options.\n";
echo "===========================================\n"; 