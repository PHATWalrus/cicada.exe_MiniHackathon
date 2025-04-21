<?php

namespace DiaX\Controllers;

use DiaX\Models\User;
use DiaX\Models\Resource;
use DiaX\Models\HealthMetric;
use DiaX\Models\MedicalProfile;
use DiaX\Models\ChatSession;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AdminController
{
    private $container;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }

    /**
     * Get a dashboard overview for admins
     */
    public function getDashboard(Request $request, Response $response): Response
    {
        // Count users, resources, pending resources, and chat sessions
        $userCount = User::count();
        $resourceCount = Resource::count();
        $pendingResourcesCount = Resource::where('is_approved', false)->count();
        $chatSessionCount = ChatSession::count();
        $metricsCount = HealthMetric::count();

        // Get recent registrations (last 7 days)
        $recentUsers = User::where('created_at', '>=', now()->subDays(7))
            ->count();

        // Get system stats
        $stats = [
            'total_users' => $userCount,
            'recent_registrations' => $recentUsers,
            'total_resources' => $resourceCount,
            'pending_resources' => $pendingResourcesCount,
            'total_chat_sessions' => $chatSessionCount,
            'total_metrics' => $metricsCount
        ];

        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $stats
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Get list of all users
     */
    public function getUsers(Request $request, Response $response): Response
    {
        $queryParams = $request->getQueryParams();
        
        // Pagination
        $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 50;
        $page = isset($queryParams['page']) ? (int) $queryParams['page'] : 1;
        $offset = ($page - 1) * $limit;
        
        // Get users with pagination
        $users = User::orderBy('created_at', 'desc')
            ->skip($offset)
            ->take($limit)
            ->get(['id', 'name', 'email', 'created_at']);
        
        $total = User::count();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => [
                'users' => $users,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'total_pages' => ceil($total / $limit)
                ]
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Get a specific user's details
     */
    public function getUserDetails(Request $request, Response $response, array $args): Response
    {
        $userId = $args['id'];
        
        $user = User::with('medicalProfile')->find($userId);
        
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Get user metrics count
        $metricsCount = HealthMetric::where('user_id', $userId)->count();
        $chatSessionsCount = ChatSession::where('user_id', $userId)->count();
        
        $userData = $user->toArray();
        $userData['metrics_count'] = $metricsCount;
        $userData['chat_sessions_count'] = $chatSessionsCount;
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $userData
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Update user's role (admin status)
     */
    public function updateUserRole(Request $request, Response $response, array $args): Response
    {
        $userId = $args['id'];
        $data = $request->getParsedBody();
        
        $user = User::find($userId);
        
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Update is_admin status
        if (isset($data['is_admin'])) {
            $user->is_admin = (bool) $data['is_admin'];
            $user->save();
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'User role updated successfully',
            'data' => [
                'id' => $user->id,
                'is_admin' => $user->is_admin
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Get all pending resources for approval
     */
    public function getPendingResources(Request $request, Response $response): Response
    {
        $resources = Resource::where('is_approved', false)
            ->orderBy('created_at', 'desc')
            ->get();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $resources
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Approve or reject a resource
     */
    public function updateResourceStatus(Request $request, Response $response, array $args): Response
    {
        $resourceId = $args['id'];
        $data = $request->getParsedBody();
        
        $resource = Resource::find($resourceId);
        
        if (!$resource) {
            return $this->respondWithError($response, 'Resource not found', 404);
        }
        
        // Validate input
        if (!isset($data['action']) || !in_array($data['action'], ['approve', 'reject'])) {
            return $this->respondWithError($response, 'Invalid action, must be "approve" or "reject"');
        }
        
        if ($data['action'] === 'approve') {
            $resource->is_approved = true;
            $message = 'Resource approved successfully';
        } else {
            $resource->delete();
            $message = 'Resource rejected and deleted successfully';
        }
        
        $resource->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => $message
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Get system statistics
     */
    public function getSystemStats(Request $request, Response $response): Response
    {
        // Total users registered
        $userCount = User::count();
        
        // New users in last 30 days
        $newUsers = User::where('created_at', '>=', now()->subDays(30))->count();
        
        // Total health metrics recorded
        $metricsCount = HealthMetric::count();
        
        // Metrics recorded in last 30 days
        $newMetrics = HealthMetric::where('created_at', '>=', now()->subDays(30))->count();
        
        // Active users (users who logged metrics in last 30 days)
        $activeUserIds = HealthMetric::where('created_at', '>=', now()->subDays(30))
            ->distinct('user_id')
            ->pluck('user_id');
        $activeUsersCount = count($activeUserIds);
        
        // Chat sessions in last 30 days
        $chatSessions = ChatSession::where('created_at', '>=', now()->subDays(30))->count();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => [
                'total_users' => $userCount,
                'new_users_30d' => $newUsers,
                'total_metrics' => $metricsCount,
                'new_metrics_30d' => $newMetrics,
                'active_users_30d' => $activeUsersCount,
                'chat_sessions_30d' => $chatSessions
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }

    /**
     * Respond with error message
     */
    private function respondWithError(Response $response, string $message, int $status = 400): Response
    {
        $response->getBody()->write(json_encode([
            'error' => true,
            'message' => $message
        ]));
        
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
} 