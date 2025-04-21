<?php

// Load dotenv
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

// Set error reporting and display errors
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "<h1>Perplexity API Debug</h1>";

// Check if API key is set
$apiKey = $_ENV['PERPLEXITY_API_KEY'] ?? null;
$model = $_ENV['PERPLEXITY_MODEL'] ?? 'sonar';

echo "<h2>Environment Check</h2>";
echo "API Key exists: " . (!empty($apiKey) ? "Yes (length: " . strlen($apiKey) . ")" : "No") . "<br>";
echo "Model name: " . $model . "<br>";

// Test cURL
echo "<h2>cURL Check</h2>";
if (function_exists('curl_version')) {
    $curlInfo = curl_version();
    echo "cURL installed: Yes (version: " . $curlInfo['version'] . ")<br>";
} else {
    echo "cURL installed: No<br>";
    die("Error: cURL is required for API calls");
}

// Simple test message to Perplexity API
echo "<h2>API Test</h2>";

if (empty($apiKey)) {
    echo "Error: No API key configured.<br>";
} else {
    // Prepare cURL request
    $url = "https://api.perplexity.ai/chat/completions";
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ];
    
    $data = [
        'model' => $model,
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a helpful assistant.'
            ],
            [
                'role' => 'user',
                'content' => 'Say hello and explain what makes a good diabetes management plan in one short paragraph.'
            ]
        ],
        'max_tokens' => 150,
        'temperature' => 0.2
    ];
    
    echo "Sending request to: " . $url . "<br>";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_VERBOSE, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    echo "HTTP Status: " . $httpCode . "<br>";
    
    if ($error) {
        echo "cURL Error: " . $error . "<br>";
    } elseif ($httpCode != 200) {
        echo "API Error. Response:<br><pre>" . htmlspecialchars($response) . "</pre><br>";
    } else {
        echo "API call successful!<br><pre>" . htmlspecialchars($response) . "</pre><br>";
        
        $responseData = json_decode($response, true);
        if (isset($responseData['choices'][0]['message']['content'])) {
            echo "Generated response: <br><strong>" . nl2br(htmlspecialchars($responseData['choices'][0]['message']['content'])) . "</strong><br>";
        }
    }
    
    curl_close($ch);
} 