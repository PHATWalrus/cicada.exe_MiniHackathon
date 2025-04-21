<?php

namespace DiaX\Controllers;

use DiaX\Models\ChatMessage;
use DiaX\Models\ChatSession;
use DiaX\Models\User;
use DiaX\Services\ChatbotService;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;

class ChatController
{
    private $container;
    private $logger;
    private $chatbotService;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->logger = $container->get(LoggerInterface::class);
        $this->chatbotService = new ChatbotService($container);
    }
    
    public function sendMessage(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = $request->getParsedBody();
        
        // Validate input
        if (!isset($data['message']) || empty(trim($data['message']))) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Message cannot be empty'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        try {
            $user = User::findOrFail($userId);
            
            // Get or create a chat session
            $sessionId = $data['session_id'] ?? null;
            
            if ($sessionId) {
                $session = ChatSession::where('id', $sessionId)
                    ->where('user_id', $userId)
                    ->first();
                
                if (!$session) {
                    $response->getBody()->write(json_encode([
                        'error' => true,
                        'message' => 'Chat session not found'
                    ]));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
                }
            } else {
                // Create a new session
                $session = new ChatSession();
                $session->user_id = $userId;
                $session->title = 'New Conversation';
                $session->save();
            }
            
            // Create user message
            $userMessage = new ChatMessage();
            $userMessage->chat_session_id = $session->id;
            $userMessage->sender_type = 'user';
            $userMessage->message = $data['message'];
            $userMessage->save();
            
            // Generate session title if this is the first message
            if ($session->title === 'New Conversation') {
                $session->generateSummary();
            }
            
            // Get chat history for context
            $chatHistory = $this->getChatHistory($session->id);
            
            // Get medical context if available
            $medicalContext = $this->getMedicalContext($userId);
            
            // Process with chatbot service
            $botResponse = $this->chatbotService->generateResponse(
                $data['message'],
                $chatHistory,
                $medicalContext
            );
            
            // Save bot response
            $botMessage = new ChatMessage();
            $botMessage->chat_session_id = $session->id;
            $botMessage->sender_type = 'bot';
            $botMessage->message = $botResponse['message'];
            $botMessage->context_data = $botResponse['context_data'] ?? null;
            $botMessage->save();
            
            $responseData = [
                'error' => false,
                'data' => [
                    'session_id' => $session->id,
                    'message' => $botResponse['message'],
                    'sources' => $botResponse['sources'] ?? []
                ]
            ];
            
            $response->getBody()->write(json_encode($responseData));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $this->logger->error('Error in chat: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while processing your request: ' . $e->getMessage()
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
    public function getSessions(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        
        try {
            $sessions = ChatSession::where('user_id', $userId)
                ->orderBy('updated_at', 'desc')
                ->get()
                ->map(function ($session) {
                    $latestMessage = $session->latestMessage;
                    
                    return [
                        'id' => $session->id,
                        'title' => $session->title,
                        'summary' => $session->summary,
                        'created_at' => $session->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $session->updated_at->format('Y-m-d H:i:s'),
                        'last_message' => $latestMessage ? [
                            'message' => $latestMessage->message,
                            'sender_type' => $latestMessage->sender_type,
                            'created_at' => $latestMessage->created_at->format('Y-m-d H:i:s')
                        ] : null
                    ];
                });
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'data' => $sessions
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $this->logger->error('Error fetching sessions: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while fetching chat sessions'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
    public function getSession(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $sessionId = $args['id'];
        
        try {
            $session = ChatSession::where('id', $sessionId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$session) {
                $response->getBody()->write(json_encode([
                    'error' => true,
                    'message' => 'Chat session not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }
            
            $messages = ChatMessage::where('chat_session_id', $sessionId)
                ->orderBy('created_at')
                ->get()
                ->map(function ($message) {
                    return [
                        'id' => $message->id,
                        'sender_type' => $message->sender_type,
                        'message' => $message->message,
                        'created_at' => $message->created_at->format('Y-m-d H:i:s')
                    ];
                });
            
            $sessionData = [
                'id' => $session->id,
                'title' => $session->title,
                'summary' => $session->summary,
                'created_at' => $session->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $session->updated_at->format('Y-m-d H:i:s'),
                'messages' => $messages
            ];
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'data' => $sessionData
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $this->logger->error('Error fetching session: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while fetching the chat session'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
    public function deleteSession(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $sessionId = $args['id'];
        
        try {
            $session = ChatSession::where('id', $sessionId)
                ->where('user_id', $userId)
                ->first();
            
            if (!$session) {
                $response->getBody()->write(json_encode([
                    'error' => true,
                    'message' => 'Chat session not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }
            
            // Delete session (messages will be cascade deleted)
            $session->delete();
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'message' => 'Chat session deleted successfully'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $this->logger->error('Error deleting session: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while deleting the chat session'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
    /**
     * Get chat history for context
     */
    private function getChatHistory(int $sessionId, int $limit = 10): array
    {
        $messages = ChatMessage::where('chat_session_id', $sessionId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->sortBy('created_at')
            ->map(function ($message) {
                return [
                    'role' => $message->isFromBot() ? 'assistant' : 'user',
                    'content' => $message->message
                ];
            })
            ->values()
            ->toArray();
        
        return $messages;
    }
    
    /**
     * Get medical context for the user
     */
    private function getMedicalContext(int $userId): ?array
    {
        $user = User::find($userId);
        
        if (!$user || !$user->medicalProfile) {
            return null;
        }
        
        $profile = $user->medicalProfile;
        
        // Get recent health metrics
        $recentMetrics = [
            'blood_glucose' => null,
            'blood_pressure' => null,
            'a1c' => null,
            'weight' => null,
            'heart_rate' => null,
            'exercise' => null
        ];
        
        // Get the most recent blood glucose readings (last 5)
        $bloodGlucose = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('blood_glucose_level')
            ->orderBy('recorded_at', 'desc')
            ->limit(5)
            ->get();
            
        if ($bloodGlucose->count() > 0) {
            $recentMetrics['blood_glucose'] = $bloodGlucose->map(function($metric) {
                return [
                    'value' => $metric->blood_glucose_level,
                    'context' => $metric->measurement_context,
                    'date' => $metric->recorded_at->format('Y-m-d H:i')
                ];
            })->toArray();
        }
        
        // Get most recent blood pressure reading
        $bloodPressure = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('systolic_pressure')
            ->whereNotNull('diastolic_pressure')
            ->orderBy('recorded_at', 'desc')
            ->first();
            
        if ($bloodPressure) {
            $recentMetrics['blood_pressure'] = [
                'systolic' => $bloodPressure->systolic_pressure,
                'diastolic' => $bloodPressure->diastolic_pressure,
                'date' => $bloodPressure->recorded_at->format('Y-m-d')
            ];
        }
        
        // Get most recent A1C reading
        $a1c = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('a1c_percentage')
            ->orderBy('recorded_at', 'desc')
            ->first();
            
        if ($a1c) {
            $recentMetrics['a1c'] = [
                'value' => $a1c->a1c_percentage,
                'date' => $a1c->recorded_at->format('Y-m-d')
            ];
        }
        
        // Get most recent weight
        $weight = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('weight_kg')
            ->orderBy('recorded_at', 'desc')
            ->first();
            
        if ($weight) {
            $recentMetrics['weight'] = [
                'value' => $weight->weight_kg,
                'date' => $weight->recorded_at->format('Y-m-d')
            ];
        }
        
        // Get most recent heart rate
        $heartRate = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('heart_rate')
            ->orderBy('recorded_at', 'desc')
            ->first();
            
        if ($heartRate) {
            $recentMetrics['heart_rate'] = [
                'value' => $heartRate->heart_rate,
                'date' => $heartRate->recorded_at->format('Y-m-d')
            ];
        }
        
        // Get most recent exercise data
        $exercise = \DiaX\Models\HealthMetric::where('user_id', $userId)
            ->whereNotNull('exercise_duration')
            ->orderBy('recorded_at', 'desc')
            ->first();
            
        if ($exercise) {
            $recentMetrics['exercise'] = [
                'duration' => $exercise->exercise_duration,
                'type' => $exercise->exercise_type,
                'intensity' => $exercise->exercise_intensity,
                'date' => $exercise->recorded_at->format('Y-m-d')
            ];
        }
        
        return [
            'diabetes_type' => $profile->diabetes_type,
            'diagnosis_year' => $profile->diagnosis_year,
            'height_cm' => $profile->height_cm,
            'weight_kg' => $profile->weight_kg,
            'bmi' => $profile->bmi,
            'target_glucose_min' => $profile->target_glucose_min,
            'target_glucose_max' => $profile->target_glucose_max,
            'medications' => $profile->medications,
            'allergies' => $profile->allergies,
            'comorbidities' => $profile->comorbidities,
            'health_metrics' => $recentMetrics
        ];
    }
    
    /**
     * Create a new chat session
     */
    public function createSession(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = $request->getParsedBody();
        
        try {
            $user = User::findOrFail($userId);
            
            // Create a new session
            $session = new ChatSession();
            $session->user_id = $userId;
            
            // If title is provided, use it; otherwise set default
            if (isset($data['title']) && !empty(trim($data['title']))) {
                $session->title = trim($data['title']);
            } else {
                $session->title = 'New Conversation';
            }
            
            // Set summary if provided
            if (isset($data['summary']) && !empty(trim($data['summary']))) {
                $session->summary = trim($data['summary']);
            }
            
            $session->save();
            
            $sessionData = [
                'id' => $session->id,
                'title' => $session->title,
                'summary' => $session->summary,
                'created_at' => $session->created_at->format('Y-m-d H:i:s'),
                'updated_at' => $session->updated_at->format('Y-m-d H:i:s')
            ];
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'message' => 'Chat session created successfully',
                'data' => $sessionData
            ]));
            
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
            
        } catch (\Exception $e) {
            $this->logger->error('Error creating chat session: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while creating the chat session: ' . $e->getMessage()
            ]));
            
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
    
    /**
     * Update an existing chat session
     */
    public function updateSession(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $sessionId = $args['id'];
        $data = $request->getParsedBody();
        
        try {
            // Find the session
            $session = ChatSession::where('id', $sessionId)
                ->where('user_id', $userId)
                ->first();
                
            if (!$session) {
                $response->getBody()->write(json_encode([
                    'error' => true,
                    'message' => 'Chat session not found'
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }
            
            // Update title if provided
            if (isset($data['title']) && !empty(trim($data['title']))) {
                $session->title = trim($data['title']);
            }
            
            // Update summary if provided
            if (isset($data['summary'])) {
                $session->summary = trim($data['summary']);
            }
            
            $session->save();
            
            $sessionData = [
                'id' => $session->id,
                'title' => $session->title,
                'summary' => $session->summary,
                'updated_at' => $session->updated_at->format('Y-m-d H:i:s')
            ];
            
            $response->getBody()->write(json_encode([
                'error' => false,
                'message' => 'Chat session updated successfully',
                'data' => $sessionData
            ]));
            
            return $response->withHeader('Content-Type', 'application/json');
            
        } catch (\Exception $e) {
            $this->logger->error('Error updating chat session: ' . $e->getMessage());
            
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'An error occurred while updating the chat session: ' . $e->getMessage()
            ]));
            
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
} 