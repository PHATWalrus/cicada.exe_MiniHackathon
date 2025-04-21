<?php

require_once __DIR__ . '/../vendor/autoload.php';

use DiaX\Models\Resource;
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

// Seed resources
$resources = [
    // Nutrition resources
    [
        'title' => 'Diabetes Meal Planning',
        'description' => 'Guidelines for creating healthy meal plans for diabetes management, including carbohydrate counting and portion control.',
        'url' => 'https://www.diabetes.org/nutrition',
        'category' => 'nutrition',
        'type' => 'article',
        'tags' => ['meal planning', 'diet', 'carbohydrates', 'nutrition'],
        'is_approved' => true
    ],
    [
        'title' => 'Glycemic Index and Diabetes',
        'description' => 'Understanding the glycemic index and how it affects blood sugar levels, with a list of low GI foods beneficial for diabetes.',
        'url' => 'https://www.diabetes.org/glycemic-index-and-diabetes',
        'category' => 'nutrition',
        'type' => 'guide',
        'tags' => ['glycemic index', 'blood sugar', 'food', 'nutrition'],
        'is_approved' => true
    ],
    
    // Treatment resources
    [
        'title' => 'Insulin Therapy Basics',
        'description' => 'Introduction to insulin therapy including types of insulin, delivery methods, and best practices for administration.',
        'url' => 'https://www.cdc.gov/diabetes/managing/insulin.html',
        'category' => 'treatment',
        'type' => 'guide',
        'tags' => ['insulin', 'medication', 'therapy', 'treatment'],
        'is_approved' => true
    ],
    [
        'title' => 'Oral Diabetes Medications',
        'description' => 'Overview of common oral medications for type 2 diabetes, their mechanisms of action, and potential side effects.',
        'url' => 'https://www.niddk.nih.gov/health-information/diabetes/overview/insulin-medicines-treatments',
        'category' => 'treatment',
        'type' => 'article',
        'tags' => ['medication', 'oral medication', 'type 2', 'treatment'],
        'is_approved' => true
    ],
    
    // Management resources
    [
        'title' => 'Blood Glucose Monitoring',
        'description' => 'Guidance on monitoring blood glucose levels, including target ranges, testing frequency, and interpreting results.',
        'url' => 'https://www.cdc.gov/diabetes/managing/managing-blood-sugar/bloodglucosemonitoring.html',
        'category' => 'management',
        'type' => 'guide',
        'tags' => ['glucose', 'monitoring', 'blood sugar', 'testing'],
        'is_approved' => true
    ],
    [
        'title' => 'Managing Diabetes During Illness',
        'description' => 'Tips for managing diabetes during sick days, including medication adjustments, hydration, and when to seek medical help.',
        'url' => 'https://www.diabetes.org/diabetes/treatment-care/planning-sick-days',
        'category' => 'management',
        'type' => 'guide',
        'tags' => ['sick days', 'illness', 'management', 'care'],
        'is_approved' => true
    ],
    
    // Exercise resources
    [
        'title' => 'Exercise Guidelines for Diabetes',
        'description' => 'Recommended physical activity guidelines for people with diabetes, including types of exercise and blood sugar considerations.',
        'url' => 'https://www.diabetes.org/fitness',
        'category' => 'exercise',
        'type' => 'guide',
        'tags' => ['exercise', 'fitness', 'physical activity', 'health'],
        'is_approved' => true
    ],
    [
        'title' => 'Preventing Exercise-Related Hypoglycemia',
        'description' => 'Strategies to prevent low blood sugar during and after exercise, including timing of meals and medication adjustments.',
        'url' => 'https://www.diabetes.org/fitness/get-and-stay-fit/exercise-safety',
        'category' => 'exercise',
        'type' => 'article',
        'tags' => ['hypoglycemia', 'exercise', 'safety', 'blood sugar'],
        'is_approved' => true
    ],
    
    // Complications resources
    [
        'title' => 'Diabetic Retinopathy',
        'description' => 'Information about diabetic eye disease, screening recommendations, and treatment options to prevent vision loss.',
        'url' => 'https://www.nei.nih.gov/learn-about-eye-health/eye-conditions-and-diseases/diabetic-retinopathy',
        'category' => 'complications',
        'type' => 'article',
        'tags' => ['retinopathy', 'eyes', 'vision', 'complications'],
        'is_approved' => true
    ],
    [
        'title' => 'Diabetes and Kidney Disease',
        'description' => 'Understanding diabetic nephropathy, kidney function tests, and strategies to maintain kidney health with diabetes.',
        'url' => 'https://www.kidney.org/atoz/content/diabetes',
        'category' => 'complications',
        'type' => 'article',
        'tags' => ['kidney', 'nephropathy', 'complications', 'health'],
        'is_approved' => true
    ]
];

// Clear existing resources
Resource::truncate();
echo "Cleared existing resources.\n";

// Add resources
foreach ($resources as $resource) {
    Resource::create($resource);
    echo "Added resource: {$resource['title']}\n";
}

echo "Seed completed successfully!\n"; 