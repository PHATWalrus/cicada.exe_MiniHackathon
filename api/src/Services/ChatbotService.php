<?php

namespace DiaX\Services;

use DiaX\Models\Resource;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Psr\Container\ContainerInterface;
use Psr\Log\LoggerInterface;

class ChatbotService
{
    private $container;
    private $logger;
    private $client;
    private $settings;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->logger = $container->get(LoggerInterface::class);
        $this->client = new Client();
        $this->settings = $container->get('settings');
    }
    
    /**
     * Generate a response from the chatbot
     * 
     * @param string $message User message
     * @param array $history Chat history
     * @param array|null $medicalContext User's medical context
     * @return array Response data
     */
    public function generateResponse(string $message, array $history, ?array $medicalContext = null): array
    {
        try {
            // Check for greeting messages and respond directly without using AI
            if ($this->isGreeting($message)) {
                $this->logger->info('Greeting detected, using predefined response');
                return $this->generateGreetingResponse($message, $medicalContext);
            }
            
            // First, search for relevant resources
            $relevantResources = $this->findRelevantResources($message);
            
            // Build the system prompt
            $systemMessage = $this->buildSystemPrompt($medicalContext, $relevantResources);
            
            // Format messages for Perplexity - ensuring proper alternation of user/assistant roles
            $formattedMessages = [];
            
            // Add system message
            $formattedMessages[] = [
                "role" => "system",
                "content" => $systemMessage
            ];
            
            // Perplexity API requires strict alternation of user/assistant messages
            // after the system message, starting with a user message
            
            // Prepare history messages with proper alternation
            $validHistory = [];
            
            if (!empty($history)) {
                // First, ensure roles are either "user" or "assistant"
                foreach ($history as $historyMessage) {
                    $role = strtolower($historyMessage['role']);
                    // Convert roles to either "user" or "assistant"
                    if ($role !== 'user' && $role !== 'assistant') {
                        $role = ($role === 'bot') ? 'assistant' : 'user';
                    }
                    
                    // Skip empty messages
                    if (empty(trim($historyMessage['content']))) {
                        continue;
                    }
                    
                    $validHistory[] = [
                        'role' => $role,
                        'content' => $historyMessage['content']
                    ];
                }
            }
            
            // Add the current user message to history
            $validHistory[] = [
                'role' => 'user',
                'content' => $message
            ];
            
            // Ensure messages alternate properly
            $processedHistory = $this->ensureAlternatingMessages($validHistory);
            
            // Combine all messages
            $formattedMessages = array_merge([$formattedMessages[0]], $processedHistory);
            
            // Log message sequence for debugging
            $roles = array_map(function($msg) {
                return $msg['role'];
            }, $formattedMessages);
            $this->logger->debug('Message sequence being sent to Perplexity', [
                'roles' => $roles,
                'message_count' => count($formattedMessages)
            ]);
            
            $apiKey = $this->settings['perplexity']['api_key'] ?? null;
            $model = $this->settings['perplexity']['model'] ?? 'sonar';
            
            // Debug log API configuration
            $this->logger->debug('Perplexity API configuration', [
                'model' => $model,
                'api_key_exists' => !empty($apiKey),
                'api_key_length' => strlen($apiKey ?? ''),
                'api_key_preview' => !empty($apiKey) ? substr($apiKey, 0, 5) . '...' . substr($apiKey, -5) : 'not set',
                'settings_structure' => array_keys($this->settings)
            ]);
            
            // Check if API key is configured
            if (empty($apiKey)) {
                // More detailed logging for API key issues
                $this->logger->error('Perplexity API key not configured', [
                    'available_settings' => array_keys($this->settings),
                    'perplexity_settings' => $this->settings['perplexity'] ?? 'not found',
                    'env_var' => isset($_ENV['PERPLEXITY_API_KEY']) ? 'is set' : 'not set'
                ]);
                
                throw new \Exception('Perplexity API key not configured');
            }

            // For testing purposes - this helps isolate if the problem is with the API or something else
            if (strtolower($message) === 'test') {
                $this->logger->info('Test message received, returning fixed response');
                return [
                    'message' => "This is a test response from the ChatbotService. API key and model configuration look good.",
                    'sources' => [],
                    'context_data' => [
                        'model' => $model,
                        'test_mode' => true
                    ]
                ];
            }
            
            // Simple response for debugging
            if (strtolower($message) === 'debug') {
                return [
                    'message' => "Debug info: Using Perplexity API with model: $model. API key length: " . strlen($apiKey) . " chars. Settings available: " . implode(', ', array_keys($this->settings)) . ".",
                    'sources' => [],
                    'context_data' => [
                        'model' => $model,
                        'debug_mode' => true
                    ]
                ];
            }
            
            // Prepare request data
            $requestData = [
                'model' => $model,
                'messages' => $formattedMessages,
                'max_tokens' => 1000,
                'temperature' => 0.2,
                'top_p' => 0.9
            ];
            
            // Log the request being sent (without the full prompt text for brevity)
            $this->logger->debug('Sending request to Perplexity API', [
                'endpoint' => "https://api.perplexity.ai/chat/completions",
                'message_count' => count($formattedMessages),
                'model' => $model,
                'request_structure' => array_keys($requestData)
            ]);
            
            // Call Perplexity API
            try {
                $response = $this->client->post("https://api.perplexity.ai/chat/completions", [
                    'headers' => [
                        'Content-Type' => 'application/json',
                        'Authorization' => 'Bearer ' . $apiKey
                    ],
                    'json' => $requestData,
                    'timeout' => 30, // Set a timeout of 30 seconds
                    'connect_timeout' => 10, // Set connection timeout to 10 seconds
                    'http_errors' => true // Enable HTTP errors for better error handling
                ]);
                
                $responseBody = $response->getBody()->getContents();
                $responseData = json_decode($responseBody, true);
                
                // Log the raw response for debugging
                $this->logger->debug('Received response from Perplexity API', [
                    'status_code' => $response->getStatusCode(),
                    'response_structure' => is_array($responseData) ? array_keys($responseData) : 'invalid JSON response',
                    'raw_response_preview' => substr($responseBody, 0, 100) . '...'
                ]);
                
                // Handle potential empty or error responses
                if (empty($responseData['choices']) || 
                    empty($responseData['choices'][0]['message']) || 
                    empty($responseData['choices'][0]['message']['content'])) {
                    
                    $this->logger->error('Empty response from Perplexity API: ' . substr($responseBody, 0, 200));
                    throw new \Exception('Received invalid response from Perplexity API');
                }
                
                $botMessage = $responseData['choices'][0]['message']['content'];
                
                // Extract citations from response if available
                $citations = [];
                if (isset($responseData['choices'][0]['message']['context']) && 
                    isset($responseData['choices'][0]['message']['context']['citations'])) {
                    $rawCitations = $responseData['choices'][0]['message']['context']['citations'];
                    foreach ($rawCitations as $citation) {
                        $citations[] = [
                            'title' => $citation['title'] ?? 'Unknown Source',
                            'url' => $citation['url'] ?? '',
                            'text' => $citation['text'] ?? '',
                            'domain' => $citation['domain'] ?? ''
                        ];
                    }
                }
                
                // Prepare sources to return, including both database resources and API citations
                $sources = [];
                
                // Add relevant resources from database
                if (!empty($relevantResources)) {
                    foreach ($relevantResources as $resource) {
                        $sources[] = [
                            'id' => is_array($resource) ? $resource['id'] : $resource->id,
                            'title' => is_array($resource) ? $resource['title'] : $resource->title,
                            'url' => is_array($resource) ? ($resource['url'] ?? '') : ($resource->url ?? ''),
                            'category' => is_array($resource) ? ($resource['category'] ?? '') : ($resource->category ?? ''),
                            'source_type' => 'database'
                        ];
                    }
                }
                
                // Add citations from Perplexity
                foreach ($citations as $citation) {
                    $sources[] = [
                        'title' => $citation['title'],
                        'url' => $citation['url'],
                        'text' => $citation['text'],
                        'domain' => $citation['domain'],
                        'source_type' => 'perplexity'
                    ];
                }
                
                // Get token usage from response
                $tokenUsage = [
                    'prompt' => $responseData['usage']['prompt_tokens'] ?? 0,
                    'completion' => $responseData['usage']['completion_tokens'] ?? 0,
                    'total' => $responseData['usage']['total_tokens'] ?? 0
                ];
                
                $this->logger->info('Successful Perplexity response', [
                    'model' => $model,
                    'tokens' => $tokenUsage,
                    'citation_count' => count($citations)
                ]);
                
                return [
                    'message' => $botMessage,
                    'sources' => $sources,
                    'context_data' => [
                        'model' => $model,
                        'tokens' => $tokenUsage,
                        'has_citations' => !empty($citations)
                    ]
                ];
            } catch (GuzzleException $apiE) {
                // Enhanced logging for API errors
                $this->logger->error('Perplexity API request failed', [
                    'exception' => get_class($apiE),
                    'message' => $apiE->getMessage(),
                    'code' => $apiE->getCode(),
                    'has_response' => $apiE->hasResponse() ? 'yes' : 'no',
                    'response_status' => $apiE->hasResponse() ? $apiE->getResponse()->getStatusCode() : 'n/a',
                    'response_body' => $apiE->hasResponse() ? substr($apiE->getResponse()->getBody()->getContents(), 0, 200) : 'n/a'
                ]);
                
                // Add request info
                $this->logger->debug('Failed request details', [
                    'url' => "https://api.perplexity.ai/chat/completions",
                    'model' => $model,
                    'headers' => ['Content-Type' => 'application/json', 'Authorization' => 'Bearer ' . substr($apiKey, 0, 3) . '...' . substr($apiKey, -3)],
                    'data_preview' => json_encode(array_intersect_key($requestData, array_flip(['model', 'max_tokens', 'temperature', 'top_p'])))
                ]);
                
                throw $apiE; // Re-throw for the outer catch block
            }
            
        } catch (GuzzleException $e) {
            $errorMessage = $e->getMessage();
            $statusCode = $e->getCode();
            
            $this->logger->error('Perplexity API Error', [
                'message' => $errorMessage,
                'code' => $statusCode,
                'type' => get_class($e)
            ]);
            
            // Check for common API errors
            if (strpos($errorMessage, 'Could not resolve host') !== false) {
                return [
                    'message' => 'I apologize, but I\'m having trouble connecting to the AI service. Please check your internet connection and try again.',
                    'sources' => [],
                    'context_data' => ['error' => 'Network connectivity issue: ' . $errorMessage]
                ];
            }
            
            // Check if it's an authentication error
            if ($statusCode == 401 || $statusCode == 403 || strpos($errorMessage, 'API key') !== false) {
                return [
                    'message' => 'I apologize, but there seems to be an issue with my authentication. Please contact support to ensure the API key is properly configured.',
                    'sources' => [],
                    'context_data' => ['error' => 'Authentication error: ' . $errorMessage]
                ];
            }
            
            // Check for model not found error
            if ($statusCode == 404 || strpos($errorMessage, 'model not found') !== false) {
                return [
                    'message' => 'I apologize, but there was an issue with the AI model configuration. Please contact support to update the model settings.',
                    'sources' => [],
                    'context_data' => ['error' => 'Model error: ' . $errorMessage]
                ];
            }
            
            // Fallback response for API errors
            return [
                'message' => 'I apologize, but I\'m having trouble connecting to my knowledge database right now. Please try again in a moment.',
                'sources' => [],
                'context_data' => ['error' => $errorMessage]
            ];
        } catch (\Exception $e) {
            $this->logger->error('Error generating response', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Special debugging message for the fallback error
            return [
                'message' => 'I apologize, but I encountered an issue while processing your message. Error: ' . $e->getMessage(),
                'sources' => [],
                'context_data' => ['error' => $e->getMessage()]
            ];
        }
    }
    
    /**
     * Determines if a message is a greeting
     * 
     * @param string $message The user's message
     * @return bool True if the message is a greeting
     */
    private function isGreeting(string $message): bool
    {
        $message = strtolower(trim($message));
        
        // If message is too long, it's probably not just a greeting
        if (str_word_count($message) > 5) {
            return false;
        }
        
        $greetings = [
            'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 
            'good evening', 'howdy', 'hi there', 'hello there', 'hey there',
            'hola', 'namaste', 'bonjour', 'ciao', 'salut', 'hallo', 'sup', 
            'yo', 'what\'s up', 'wassup', 'morning', 'evening', 'afternoon',
            'how are you', 'how\'s it going', 'how do you do', 'nice to meet you', 
            'pleased to meet you', 'good day', 'whats up', 'whatsup', 'heya'
        ];
        
        foreach ($greetings as $greeting) {
            // Check for exact match
            if ($message === $greeting) {
                return true;
            }
            
            // Check for greeting at the start of message
            if (strpos($message, $greeting . ' ') === 0) {
                return true;
            }
            
            // Check for greeting followed by punctuation
            if (strpos($message, $greeting . '!') === 0 || 
                strpos($message, $greeting . '.') === 0 || 
                strpos($message, $greeting . ',') === 0) {
                return true;
            }
        }
        
        // Additional checks for greetings with question marks
        $questionGreetings = [
            'how are you', 'how\'s it going', 'how do you do', 'how are you doing',
            'how have you been', 'what\'s up', 'whats up'  
        ];
        
        foreach ($questionGreetings as $greeting) {
            if (strpos($message, $greeting . '?') !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate a personalized greeting response without using AI
     * 
     * @param string $greeting The greeting message
     * @param array|null $medicalContext The user's medical context
     * @return array Response data
     */
    private function generateGreetingResponse(string $greeting, ?array $medicalContext = null): array
    {
        // Get a random greeting intro to make responses more varied
        $greetingIntros = [
            "Hello! I'm DiaX, your diabetes support assistant. ",
            "Hi there! I'm DiaX, your friendly diabetes management companion. ",
            "Greetings! I'm DiaX, here to help with your diabetes management needs. ",
            "Good day! I'm DiaX, your dedicated diabetes support assistant. ",
            "Welcome! I'm DiaX, ready to assist with your diabetes management. "
        ];
        
        $randomIndex = mt_rand(0, count($greetingIntros) - 1);
        $response = $greetingIntros[$randomIndex];
        
        if ($medicalContext) {
            // Personalize the greeting with medical context if available
            $diabetesType = $medicalContext['diabetes_type'] ?? null;
            
            if ($diabetesType) {
                $typeName = '';
                switch ($diabetesType) {
                    case 'type1':
                        $typeName = 'Type 1';
                        break;
                    case 'type2':
                        $typeName = 'Type 2';
                        break;
                    case 'gestational':
                        $typeName = 'Gestational';
                        break;
                    case 'prediabetes':
                        $typeName = 'Prediabetes';
                        break;
                    default:
                        $typeName = $diabetesType;
                }
                
                $response .= "I see you're managing {$typeName} diabetes. ";
            }
            
            // Check if there are recent health metrics to mention
            if (!empty($medicalContext['health_metrics'])) {
                $metrics = $medicalContext['health_metrics'];
                
                // Mention recent glucose if available
                if (!empty($metrics['blood_glucose']) && count($metrics['blood_glucose']) > 0) {
                    $latestReading = $metrics['blood_glucose'][0];
                    $glucoseValue = $latestReading['value'];
                    
                    // Check if glucose value is within target range
                    $minTarget = $medicalContext['target_glucose_min'] ?? 70;
                    $maxTarget = $medicalContext['target_glucose_max'] ?? 180;
                    
                    if ($glucoseValue < $minTarget) {
                        $response .= "I notice your last glucose reading was {$glucoseValue} mg/dL, which is below your target range. ";
                    } elseif ($glucoseValue > $maxTarget) {
                        $response .= "I notice your last glucose reading was {$glucoseValue} mg/dL, which is above your target range. ";
                    } else {
                        $response .= "I notice your last glucose reading of {$glucoseValue} mg/dL is within your target range. ";
                    }
                }
                
                // Mention A1C if available and recent (within 3 months)
                if (!empty($metrics['a1c']) && strtotime($metrics['a1c']['date']) > strtotime('-3 months')) {
                    $a1cValue = $metrics['a1c']['value'];
                    $response .= "Your recent A1C was {$a1cValue}%. ";
                }
                
                // Mention recent exercise if recorded in the last 48 hours
                if (!empty($metrics['exercise']) && strtotime($metrics['exercise']['date']) > strtotime('-48 hours')) {
                    $exDuration = $metrics['exercise']['duration'];
                    $exType = $metrics['exercise']['type'];
                    $response .= "Great job on your recent {$exDuration} minutes of {$exType}! ";
                }
            }
            
            // Get a random closing question for variety
            $closingQuestions = [
                "How can I help you today with your diabetes management?",
                "What can I assist you with regarding your diabetes care today?",
                "How may I support your diabetes management today?",
                "What information or support do you need today?",
                "How can I be of assistance with your health goals today?"
            ];
            
            $randomIndex = mt_rand(0, count($closingQuestions) - 1);
            $response .= $closingQuestions[$randomIndex];
        } else {
            // Get a random closing question for new users
            $newUserClosings = [
                "I can provide information and support for managing diabetes. How can I assist you today?",
                "I'm here to help with diabetes information and management. What would you like to know?",
                "I can offer support and information about diabetes. What questions do you have?",
                "I'm designed to help with diabetes care and information. How can I support you?",
                "I provide diabetes support and information. What would you like assistance with today?"
            ];
            
            $randomIndex = mt_rand(0, count($newUserClosings) - 1);
            $response .= $newUserClosings[$randomIndex];
        }
        
        return [
            'message' => $response,
            'sources' => [],
            'context_data' => [
                'greeting_detected' => true,
                'ai_bypassed' => true
            ]
        ];
    }
    
    /**
     * Build the system prompt based on medical context and resources
     */
    private function buildSystemPrompt(?array $medicalContext, array $relevantResources): string
    {
        // Create an optimized system prompt for Perplexity
        $systemPrompt = "You are DiaX, a specialized diabetes support chatbot created by diaX.fileish.com. ";
        $systemPrompt .= "Your purpose is to provide personalized assistance, evidence-based information, and emotional support to people managing diabetes. ";
        
        $systemPrompt .= "\nCORE PRINCIPLES:";
        $systemPrompt .= "\n1. Be compassionate, supportive, and empathetic in all responses.";
        $systemPrompt .= "\n2. Provide accurate, evidence-based information about diabetes management, nutrition, medication, and complications.";
        $systemPrompt .= "\n3. Personalize all responses based on the user's specific data, medical context, and conversation history.";
        $systemPrompt .= "\n4. Maintain continuity across conversations by referencing previous discussions when relevant.";
        $systemPrompt .= "\n5. Always include a clear disclaimer to consult healthcare professionals for medical advice when appropriate.";
        
        $systemPrompt .= "\nRESPONSE GUIDELINES:";
        $systemPrompt .= "\n1. Use clear, concise language that is accessible to people with various levels of medical knowledge.";
        $systemPrompt .= "\n2. When answering questions about diet, exercise, or medication, be specific and practical, tailoring recommendations to the user's diabetes type and health status.";
        $systemPrompt .= "\n3. If you notice concerning trends in the user's health metrics (e.g., consistently high blood glucose), acknowledge them and suggest appropriate actions.";
        $systemPrompt .= "\n4. When discussing health metrics, compare current values to the user's target ranges and previous readings to provide context.";
        $systemPrompt .= "\n5. If you cannot provide a confident answer, acknowledge limitations rather than giving potentially harmful information.";
        $systemPrompt .= "\n6. When relevant, mention the importance of regular blood sugar monitoring, A1C testing, and medical check-ups.";
        $systemPrompt .= "\n7. Reference the user's specific medications, allergies, and comorbidities when providing advice about treatments or lifestyle changes.";
        $systemPrompt .= "\n8. If the user mentions symptoms or complications, acknowledge their experience and provide targeted information.";
        $systemPrompt .= "\n9. Base your responses on the most recent and reliable diabetes management guidelines and research.";
        $systemPrompt .= "\n10. When referencing health metrics, connect them to potential lifestyle factors or behavioral patterns that may be influencing them.";
        
        // Add user medical context if available
        if ($medicalContext) {
            $systemPrompt .= "\n\nUSER MEDICAL CONTEXT:";
            
            if (!empty($medicalContext['diabetes_type'])) {
                $diabetesType = $medicalContext['diabetes_type'];
                $systemPrompt .= "\n- Diabetes Type: {$diabetesType}";
                
                // Add type-specific considerations
                switch ($diabetesType) {
                    case 'type1':
                        $systemPrompt .= "\n  * Type 1 considerations: Insulin dependency, risk of DKA, carb counting importance, technology management (pumps/CGMs if mentioned)";
                        break;
                    case 'type2':
                        $systemPrompt .= "\n  * Type 2 considerations: Insulin resistance, lifestyle modification importance, progressive condition, medication management";
                        break;
                    case 'gestational':
                        $systemPrompt .= "\n  * Gestational considerations: Temporary condition, fetal health impacts, postpartum follow-up importance, future T2D risk";
                        break;
                    case 'prediabetes':
                        $systemPrompt .= "\n  * Prediabetes considerations: Prevention focus, lifestyle changes can reverse condition, regular screening importance";
                        break;
                }
            }
            
            if (!empty($medicalContext['diagnosis_year'])) {
                $yearsSinceDiagnosis = date('Y') - $medicalContext['diagnosis_year'];
                $systemPrompt .= "\n- Diagnosed in: {$medicalContext['diagnosis_year']} ({$yearsSinceDiagnosis} years ago)";
            }
            
            if (!empty($medicalContext['height_cm']) && !empty($medicalContext['weight_kg'])) {
                $systemPrompt .= "\n- Height: {$medicalContext['height_cm']} cm";
                $systemPrompt .= "\n- Weight: {$medicalContext['weight_kg']} kg";
            }
            
            if (!empty($medicalContext['bmi'])) {
                $bmi = $medicalContext['bmi'];
                $bmiCategory = "";
                if ($bmi < 18.5) $bmiCategory = "underweight";
                else if ($bmi < 25) $bmiCategory = "normal weight";
                else if ($bmi < 30) $bmiCategory = "overweight";
                else $bmiCategory = "obese";
                
                $systemPrompt .= "\n- BMI: {$bmi} ({$bmiCategory})";
            }
            
            if (!empty($medicalContext['target_glucose_min']) && !empty($medicalContext['target_glucose_max'])) {
                $systemPrompt .= "\n- Target glucose range: {$medicalContext['target_glucose_min']} - {$medicalContext['target_glucose_max']} mg/dL";
                $systemPrompt .= "\n  * Use these personalized targets when discussing blood glucose values";
            }
            
            if (!empty($medicalContext['medications'])) {
                $systemPrompt .= "\n- Medications: {$medicalContext['medications']}";
                $systemPrompt .= "\n  * Consider these medications when discussing treatment, side effects, or drug interactions";
            }
            
            if (!empty($medicalContext['allergies'])) {
                $systemPrompt .= "\n- Allergies: {$medicalContext['allergies']}";
                $systemPrompt .= "\n  * Consider these allergies when discussing foods, medications, or treatments";
            }
            
            if (!empty($medicalContext['comorbidities'])) {
                $systemPrompt .= "\n- Comorbidities: {$medicalContext['comorbidities']}";
                $systemPrompt .= "\n  * Consider these conditions when discussing overall health management, exercise, and nutrition";
            }
            
            // Add health metrics if available
            if (!empty($medicalContext['health_metrics'])) {
                $healthMetrics = $medicalContext['health_metrics'];
                $systemPrompt .= "\n\nUSER HEALTH METRICS:";
                
                // Add blood glucose readings
                if (!empty($healthMetrics['blood_glucose'])) {
                    $readings = $healthMetrics['blood_glucose'];
                    $avgGlucose = array_reduce($readings, function($carry, $item) {
                        return $carry + $item['value'];
                    }, 0) / count($readings);
                    
                    $systemPrompt .= "\n- Recent Blood Glucose Readings (average: " . round($avgGlucose, 1) . " mg/dL):";
                    
                    // Check if values are in target range
                    $minTarget = $medicalContext['target_glucose_min'] ?? 70;
                    $maxTarget = $medicalContext['target_glucose_max'] ?? 130;
                    
                    $inRangeCount = 0;
                    foreach ($readings as $reading) {
                        if ($reading['value'] >= $minTarget && $reading['value'] <= $maxTarget) {
                            $inRangeCount++;
                        }
                    }
                    
                    $inRangePercentage = round(($inRangeCount / count($readings)) * 100);
                    $systemPrompt .= " {$inRangePercentage}% within target range";
                    
                    foreach ($readings as $index => $reading) {
                        $context = !empty($reading['context']) ? " ({$reading['context']})" : "";
                        $rangeStatus = "";
                        if ($reading['value'] < $minTarget) {
                            $rangeStatus = " - below target";
                        } else if ($reading['value'] > $maxTarget) {
                            $rangeStatus = " - above target";
                        } else {
                            $rangeStatus = " - within target";
                        }
                        $systemPrompt .= "\n  * {$reading['value']} mg/dL on {$reading['date']}{$context}{$rangeStatus}";
                    }
                }
                
                // Add blood pressure
                if (!empty($healthMetrics['blood_pressure'])) {
                    $bp = $healthMetrics['blood_pressure'];
                    $bpCategory = "";
                    
                    // Classify BP according to guidelines
                    if ($bp['systolic'] < 120 && $bp['diastolic'] < 80) {
                        $bpCategory = "normal";
                    } else if ($bp['systolic'] < 130 && $bp['diastolic'] < 80) {
                        $bpCategory = "elevated";
                    } else if (($bp['systolic'] >= 130 && $bp['systolic'] < 140) || ($bp['diastolic'] >= 80 && $bp['diastolic'] < 90)) {
                        $bpCategory = "Stage 1 hypertension";
                    } else if ($bp['systolic'] >= 140 || $bp['diastolic'] >= 90) {
                        $bpCategory = "Stage 2 hypertension";
                    }
                    
                    $systemPrompt .= "\n- Blood Pressure: {$bp['systolic']}/{$bp['diastolic']} mmHg (as of {$bp['date']}) - {$bpCategory}";
                }
                
                // Add A1C
                if (!empty($healthMetrics['a1c'])) {
                    $a1c = $healthMetrics['a1c'];
                    $a1cStatus = "";
                    
                    if ($a1c['value'] < 5.7) {
                        $a1cStatus = "normal";
                    } else if ($a1c['value'] < 6.5) {
                        $a1cStatus = "prediabetic range";
                    } else {
                        $a1cStatus = "diabetic range";
                    }
                    
                    // Estimate average blood glucose
                    $eAG = round(($a1c['value'] * 28.7) - 46.7);
                    
                    $systemPrompt .= "\n- A1C: {$a1c['value']}% (as of {$a1c['date']}) - {$a1cStatus}, estimated average glucose: {$eAG} mg/dL";
                }
                
                // Add weight if different from profile
                if (!empty($healthMetrics['weight']) && 
                    (!isset($medicalContext['weight_kg']) || 
                     $healthMetrics['weight']['value'] != $medicalContext['weight_kg'])) {
                    $weight = $healthMetrics['weight'];
                    $systemPrompt .= "\n- Current Weight: {$weight['value']} kg (as of {$weight['date']})";
                    
                    // Add weight change information if historical values available
                    if (isset($medicalContext['weight_kg'])) {
                        $diff = $weight['value'] - $medicalContext['weight_kg'];
                        $changeDirection = $diff > 0 ? "gained" : "lost";
                        $absDiff = abs($diff);
                        
                        if ($absDiff > 0.5) { // Only mention if change is significant
                            $systemPrompt .= " - has {$changeDirection} {$absDiff} kg since previous recording";
                        }
                    }
                }
                
                // Add heart rate
                if (!empty($healthMetrics['heart_rate'])) {
                    $hr = $healthMetrics['heart_rate'];
                    $hrCategory = "";
                    
                    if ($hr['value'] < 60) {
                        $hrCategory = "bradycardia";
                    } else if ($hr['value'] <= 100) {
                        $hrCategory = "normal range";
                    } else {
                        $hrCategory = "tachycardia";
                    }
                    
                    $systemPrompt .= "\n- Heart Rate: {$hr['value']} bpm (as of {$hr['date']}) - {$hrCategory}";
                }
                
                // Add exercise data
                if (!empty($healthMetrics['exercise'])) {
                    $ex = $healthMetrics['exercise'];
                    $intensity = "";
                    if (isset($ex['intensity'])) {
                        if ($ex['intensity'] == 1) $intensity = "Low";
                        else if ($ex['intensity'] == 2) $intensity = "Moderate";
                        else $intensity = "High";
                    }
                    
                    $systemPrompt .= "\n- Recent Exercise: {$ex['duration']} minutes of {$ex['type']}";
                    if (!empty($intensity)) {
                        $systemPrompt .= " (Intensity: {$intensity})";
                    }
                    $systemPrompt .= " on {$ex['date']}";
                    
                    // Add exercise impact insight
                    $systemPrompt .= "\n  * Consider how this exercise pattern might impact blood glucose management";
                }
            }
        }
        
        // Add relevant resources if available
        if (!empty($relevantResources)) {
            $systemPrompt .= "\n\nRELEVANT RESOURCES:";
            $systemPrompt .= "\nUse these evidence-based resources to inform your responses to the current query:";
            
            foreach ($relevantResources as $index => $resource) {
                $title = is_array($resource) ? $resource['title'] : $resource->title;
                $description = is_array($resource) ? $resource['description'] : $resource->description;
                $systemPrompt .= "\n" . ($index + 1) . ". {$title}: {$description}";
                
                $url = is_array($resource) ? ($resource['url'] ?? '') : ($resource->url ?? '');
                if (!empty($url)) {
                    $systemPrompt .= "\n   Source: {$url}";
                }
            }
            $systemPrompt .= "\nRefer to these resources in your answer when appropriate, providing evidence-based information.";
        }
        
        // Add conversation continuity instructions
        $systemPrompt .= "\n\nCONVERSATION CONTINUITY:";
        $systemPrompt .= "\n1. Maintain context from previous messages in the conversation.";
        $systemPrompt .= "\n2. If referring to previous health metrics or information, be specific about when they were mentioned.";
        $systemPrompt .= "\n3. If the user mentions new symptoms, metrics, or concerns, incorporate them into your understanding of their situation.";
        $systemPrompt .= "\n4. If the user has mentioned specific goals in previous conversations (e.g., weight loss, better glucose control), reference and reinforce these.";
        $systemPrompt .= "\n5. Build upon previous explanations rather than repeating the same basic information.";
        
        return $systemPrompt;
    }
    
    /**
     * Find resources relevant to the user's query
     */
    private function findRelevantResources(string $query): array
    {
        // This is a simple implementation; a more sophisticated approach would use
        // semantic search, embeddings, or a vector database

        // For now, extract keywords from the query
        $keywords = preg_split('/\W+/', strtolower($query));
        $keywords = array_filter($keywords, function($word) {
            // Filter out short words and common stopwords
            $stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'of', 'to', 'for', 'in', 'with', 'what', 'how', 'why', 'when', 'where', 'who'];
            return strlen($word) > 2 && !in_array($word, $stopwords);
        });
        
        if (empty($keywords)) {
            return [];
        }
        
        // Find resources that match these keywords
        $resources = Resource::getApproved();
        
        foreach ($keywords as $keyword) {
            $resources->where(function($query) use ($keyword) {
                $query->where('title', 'like', "%{$keyword}%")
                    ->orWhere('description', 'like', "%{$keyword}%")
                    ->orWhereJsonContains('tags', $keyword);
            });
        }
        
        return $resources->limit(3)->get()->toArray();
    }
    
    /**
     * Ensure messages strictly alternate between user and assistant roles
     * 
     * @param array $messages Messages to process
     * @return array Processed messages with proper alternation
     */
    private function ensureAlternatingMessages(array $messages): array
    {
        if (empty($messages)) {
            return [];
        }
        
        $result = [];
        $lastRole = null;
        
        // Make sure the first message is from the user
        if ($messages[0]['role'] !== 'user') {
            // Insert a placeholder user message if needed
            $result[] = [
                'role' => 'user',
                'content' => 'Hello'
            ];
            $lastRole = 'user';
        }
        
        foreach ($messages as $message) {
            $currentRole = $message['role'];
            
            // If this message has the same role as the last one, combine them
            if ($lastRole === $currentRole && !empty($result)) {
                $lastIndex = count($result) - 1;
                $result[$lastIndex]['content'] .= "\n\n" . $message['content'];
            }
            // If this is the first message or it alternates properly with the last one
            else if ($lastRole === null || 
                    ($lastRole === 'user' && $currentRole === 'assistant') || 
                    ($lastRole === 'assistant' && $currentRole === 'user')) {
                $result[] = $message;
                $lastRole = $currentRole;
            }
            // If we have two consecutive messages of the same role type, insert a dummy message
            else {
                // Insert a placeholder message for the missing role
                $placeholderRole = ($lastRole === 'user') ? 'assistant' : 'user';
                $placeholderContent = ($placeholderRole === 'assistant') ? 
                    'I understand.' : 'Thank you.';
                
                $result[] = [
                    'role' => $placeholderRole,
                    'content' => $placeholderContent
                ];
                
                // Then add the current message
                $result[] = $message;
                $lastRole = $currentRole;
            }
        }
        
        // Ensure the final sequence ends with a user message
        // This is not needed for Perplexity, but kept for completeness
        if (!empty($result) && end($result)['role'] === 'assistant') {
            $result[] = [
                'role' => 'user',
                'content' => 'Can you expand on that?'
            ];
        }
        
        return $result;
    }
} 