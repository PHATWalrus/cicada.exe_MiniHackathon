<?php
// A simple diagnostic script to debug path issues

header('Content-Type: application/json');

// Information about the request
$info = [
    'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
    'script_name' => $_SERVER['SCRIPT_NAME'] ?? null,
    'php_self' => $_SERVER['PHP_SELF'] ?? null,
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? null,
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? null,
    'http_host' => $_SERVER['HTTP_HOST'] ?? null,
    'path_info' => $_SERVER['PATH_INFO'] ?? null,
    'query_string' => $_SERVER['QUERY_STRING'] ?? null,
    'server_protocol' => $_SERVER['SERVER_PROTOCOL'] ?? null,
    'https' => isset($_SERVER['HTTPS']) ? 'yes' : 'no',
    'current_directory' => dirname(__FILE__)
];

// Get list of available routes
if (file_exists(__DIR__ . '/../src/routes.php')) {
    $routeContent = file_get_contents(__DIR__ . '/../src/routes.php');
    preg_match_all('/\$app->(get|post|put|delete)\s*\(\s*[\'"]([^\'"]+)[\'"]/', $routeContent, $matches);
    
    $routes = [];
    if (!empty($matches[1]) && !empty($matches[2])) {
        for ($i = 0; $i < count($matches[1]); $i++) {
            $routes[] = [
                'method' => strtoupper($matches[1][$i]),
                'path' => $matches[2][$i]
            ];
        }
    }
    
    $info['available_routes'] = $routes;
}

echo json_encode($info, JSON_PRETTY_PRINT); 