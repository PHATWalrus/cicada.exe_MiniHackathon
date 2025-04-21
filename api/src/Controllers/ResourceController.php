<?php

namespace DiaX\Controllers;

use DiaX\Models\Resource;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ResourceController
{
    private $container;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }
    
    public function getPublicResources(Request $request, Response $response): Response
    {
        $query = Resource::getApproved();
        
        // Apply filters
        $params = $request->getQueryParams();
        
        if (isset($params['category'])) {
            $query->where('category', $params['category']);
        }
        
        if (isset($params['type'])) {
            $query->where('type', $params['type']);
        }
        
        if (isset($params['tag'])) {
            $query->whereJsonContains('tags', $params['tag']);
        }
        
        $resources = $query->get();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $resources
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function getResourcesByCategory(Request $request, Response $response, array $args): Response
    {
        $category = $args['category'];
        
        $resources = Resource::getApproved()
            ->where('category', $category)
            ->get();
        
        if ($resources->isEmpty()) {
            $response->getBody()->write(json_encode([
                'error' => false,
                'data' => [],
                'message' => 'No resources found for this category'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $resources
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function saveResource(Request $request, Response $response): Response
    {
        $data = $request->getParsedBody();
        
        // Validate input
        $errors = [];
        
        if (!isset($data['title']) || empty($data['title'])) {
            $errors['title'] = 'Title is required';
        }
        
        if (!isset($data['description']) || empty($data['description'])) {
            $errors['description'] = 'Description is required';
        }
        
        if (!isset($data['category']) || empty($data['category'])) {
            $errors['category'] = 'Category is required';
        }
        
        if (!empty($errors)) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Validation failed',
                'errors' => $errors
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        $resource = new Resource();
        $resource->title = $data['title'];
        $resource->description = $data['description'];
        $resource->category = $data['category'];
        
        if (isset($data['url'])) {
            $resource->url = $data['url'];
        }
        
        if (isset($data['type'])) {
            $resource->type = $data['type'];
        }
        
        if (isset($data['tags']) && is_array($data['tags'])) {
            $resource->tags = $data['tags'];
        }
        
        // Set as unapproved by default - admin must approve
        $resource->is_approved = false;
        
        $resource->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Resource submitted successfully and is pending approval',
            'data' => [
                'id' => $resource->id
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }
} 