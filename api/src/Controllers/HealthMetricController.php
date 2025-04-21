<?php

namespace DiaX\Controllers;

use DiaX\Models\HealthMetric;
use DiaX\Models\User;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;
use Carbon\Carbon;

class HealthMetricController
{
    private $container;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }
    
    /**
     * Get all health metrics for the current user
     */
    public function getMetrics(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $queryParams = $request->getQueryParams();
        
        // Get user
        $user = User::find($userId);
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Build query
        $query = $user->healthMetrics();
        
        // Filter by type if specified
        if (isset($queryParams['type'])) {
            $type = $queryParams['type'];
            
            switch ($type) {
                case 'blood_glucose':
                    $query->bloodGlucose();
                    break;
                case 'blood_pressure':
                    $query->bloodPressure();
                    break;
                case 'heart_rate':
                    $query->whereNotNull('heart_rate');
                    break;
                case 'weight':
                    $query->whereNotNull('weight_kg');
                    break;
                case 'a1c':
                    $query->whereNotNull('a1c_percentage');
                    break;
                case 'exercise':
                    $query->whereNotNull('exercise_duration');
                    break;
            }
        }
        
        // Filter by date range
        if (isset($queryParams['days'])) {
            $days = (int) $queryParams['days'];
            if ($days > 0) {
                $query->lastDays($days);
            }
        } else if (isset($queryParams['from']) && isset($queryParams['to'])) {
            $from = date('Y-m-d', strtotime($queryParams['from']));
            $to = date('Y-m-d', strtotime($queryParams['to']));
            $query->whereBetween('recorded_at', [$from, $to]);
        }
        
        // Order by recorded_at
        $query->orderBy('recorded_at', 'desc');
        
        // Paginate results
        $limit = isset($queryParams['limit']) ? (int) $queryParams['limit'] : 50;
        $page = isset($queryParams['page']) ? (int) $queryParams['page'] : 1;
        $offset = ($page - 1) * $limit;
        
        $metrics = $query->skip($offset)->take($limit)->get();
        $total = $query->count();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => [
                'metrics' => $metrics,
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
     * Add a new health metric
     */
    public function addMetric(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $data = $request->getParsedBody();
        
        // Validate required data
        if (empty($data)) {
            return $this->respondWithError($response, 'No data provided');
        }
        
        // Ensure at least one health metric is provided
        $hasMetricData = false;
        $metricFields = [
            'blood_glucose_level', 'systolic_pressure', 'diastolic_pressure', 
            'heart_rate', 'weight_kg', 'a1c_percentage', 'exercise_duration'
        ];
        
        foreach ($metricFields as $field) {
            if (isset($data[$field]) && !empty($data[$field])) {
                $hasMetricData = true;
                break;
            }
        }
        
        if (!$hasMetricData) {
            return $this->respondWithError($response, 'At least one health metric must be provided');
        }
        
        // Create health metric record
        $metric = new HealthMetric();
        $metric->user_id = $userId;
        
        // Set the recorded_at timestamp
        if (isset($data['recorded_at']) && !empty($data['recorded_at'])) {
            $metric->recorded_at = $data['recorded_at'];
        } else {
            $metric->recorded_at = Carbon::now();
        }
        
        // Set all provided metrics
        foreach ($metric->getFillable() as $field) {
            if (isset($data[$field]) && $field !== 'user_id' && $field !== 'recorded_at') {
                $metric->{$field} = $data[$field];
            }
        }
        
        $metric->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Health metric added successfully',
            'data' => ['id' => $metric->id]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
    }
    
    /**
     * Update a health metric
     */
    public function updateMetric(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $metricId = $args['id'] ?? null;
        $data = $request->getParsedBody();
        
        if (!$metricId) {
            return $this->respondWithError($response, 'Metric ID is required');
        }
        
        // Find the metric
        $metric = HealthMetric::where('id', $metricId)
                             ->where('user_id', $userId)
                             ->first();
        
        if (!$metric) {
            return $this->respondWithError($response, 'Health metric not found', 404);
        }
        
        // Update provided fields
        foreach ($metric->getFillable() as $field) {
            if (isset($data[$field]) && $field !== 'user_id') {
                $metric->{$field} = $data[$field];
            }
        }
        
        $metric->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Health metric updated successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Delete a health metric
     */
    public function deleteMetric(Request $request, Response $response, array $args): Response
    {
        $userId = $request->getAttribute('user_id');
        $metricId = $args['id'] ?? null;
        
        if (!$metricId) {
            return $this->respondWithError($response, 'Metric ID is required');
        }
        
        // Find the metric
        $metric = HealthMetric::where('id', $metricId)
                             ->where('user_id', $userId)
                             ->first();
        
        if (!$metric) {
            return $this->respondWithError($response, 'Health metric not found', 404);
        }
        
        $metric->delete();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Health metric deleted successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Get stats and summaries for health metrics
     */
    public function getStats(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $queryParams = $request->getQueryParams();
        
        // Get user
        $user = User::find($userId);
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Determine timeframe
        $days = isset($queryParams['days']) ? (int) $queryParams['days'] : 30;
        
        // Get metrics for the timeframe
        $metrics = $user->healthMetrics()->lastDays($days)->get();
        
        // Calculate stats
        $stats = [
            'blood_glucose' => [
                'count' => 0,
                'avg' => 0,
                'min' => null,
                'max' => null,
                'last' => null,
                'in_range_percentage' => 0
            ],
            'blood_pressure' => [
                'count' => 0,
                'avg_systolic' => 0,
                'avg_diastolic' => 0,
                'last' => null
            ],
            'heart_rate' => [
                'count' => 0,
                'avg' => 0,
                'min' => null,
                'max' => null,
                'last' => null
            ],
            'weight' => [
                'count' => 0,
                'last' => null,
                'change' => null
            ],
            'days_with_entries' => 0
        ];
        
        if ($metrics->count() > 0) {
            // Process blood glucose readings
            $glucoseReadings = $metrics->filter(function ($metric) {
                return !is_null($metric->blood_glucose_level);
            });
            
            if ($glucoseReadings->count() > 0) {
                $stats['blood_glucose']['count'] = $glucoseReadings->count();
                $stats['blood_glucose']['avg'] = round($glucoseReadings->avg('blood_glucose_level'), 1);
                $stats['blood_glucose']['min'] = $glucoseReadings->min('blood_glucose_level');
                $stats['blood_glucose']['max'] = $glucoseReadings->max('blood_glucose_level');
                $stats['blood_glucose']['last'] = $glucoseReadings->sortByDesc('recorded_at')->first()->blood_glucose_level;
                
                // Calculate in-range percentage
                $targetMin = $user->medicalProfile->target_glucose_min ?? 70;
                $targetMax = $user->medicalProfile->target_glucose_max ?? 180;
                
                $inRangeCount = $glucoseReadings->filter(function ($reading) use ($targetMin, $targetMax) {
                    return $reading->blood_glucose_level >= $targetMin && $reading->blood_glucose_level <= $targetMax;
                })->count();
                
                $stats['blood_glucose']['in_range_percentage'] = round(($inRangeCount / $glucoseReadings->count()) * 100);
            }
            
            // Process blood pressure readings
            $bpReadings = $metrics->filter(function ($metric) {
                return !is_null($metric->systolic_pressure) && !is_null($metric->diastolic_pressure);
            });
            
            if ($bpReadings->count() > 0) {
                $stats['blood_pressure']['count'] = $bpReadings->count();
                $stats['blood_pressure']['avg_systolic'] = round($bpReadings->avg('systolic_pressure'));
                $stats['blood_pressure']['avg_diastolic'] = round($bpReadings->avg('diastolic_pressure'));
                
                $lastBp = $bpReadings->sortByDesc('recorded_at')->first();
                $stats['blood_pressure']['last'] = $lastBp->blood_pressure;
            }
            
            // Process heart rate readings
            $hrReadings = $metrics->filter(function ($metric) {
                return !is_null($metric->heart_rate);
            });
            
            if ($hrReadings->count() > 0) {
                $stats['heart_rate']['count'] = $hrReadings->count();
                $stats['heart_rate']['avg'] = round($hrReadings->avg('heart_rate'));
                $stats['heart_rate']['min'] = $hrReadings->min('heart_rate');
                $stats['heart_rate']['max'] = $hrReadings->max('heart_rate');
                $stats['heart_rate']['last'] = $hrReadings->sortByDesc('recorded_at')->first()->heart_rate;
            }
            
            // Process weight readings
            $weightReadings = $metrics->filter(function ($metric) {
                return !is_null($metric->weight_kg);
            })->sortBy('recorded_at');
            
            if ($weightReadings->count() > 0) {
                $stats['weight']['count'] = $weightReadings->count();
                $stats['weight']['last'] = $weightReadings->last()->weight_kg;
                
                if ($weightReadings->count() >= 2) {
                    $firstWeight = $weightReadings->first()->weight_kg;
                    $lastWeight = $weightReadings->last()->weight_kg;
                    $stats['weight']['change'] = round($lastWeight - $firstWeight, 1);
                }
            }
            
            // Calculate days with entries
            $uniqueDays = $metrics->groupBy(function ($metric) {
                return $metric->recorded_at->format('Y-m-d');
            });
            
            $stats['days_with_entries'] = $uniqueDays->count();
        }
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => [
                'stats' => $stats,
                'timeframe_days' => $days
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Delete user's medical record
     */
    public function deleteMedicalRecord(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        
        // Get user
        $user = User::find($userId);
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Delete medical profile if it exists
        if ($user->medicalProfile) {
            $user->medicalProfile->delete();
        }
        
        // Delete all health metrics
        HealthMetric::where('user_id', $userId)->delete();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Medical record deleted successfully'
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
    
    /**
     * Get health metrics data for charts
     */
    public function getChartData(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $queryParams = $request->getQueryParams();
        
        // Get user
        $user = User::find($userId);
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Determine timeframe
        $days = isset($queryParams['days']) ? (int) $queryParams['days'] : 30;
        // Limit maximum days to prevent memory issues
        $days = min($days, 365);
        
        $metricType = $queryParams['type'] ?? 'all';
        
        // Get start and end dates
        $endDate = isset($queryParams['end_date']) ? Carbon::parse($queryParams['end_date']) : Carbon::now();
        $startDate = isset($queryParams['start_date']) 
            ? Carbon::parse($queryParams['start_date']) 
            : $endDate->copy()->subDays($days);
        
        // Format for SQL queries
        $startDateFormat = $startDate->format('Y-m-d');
        $endDateFormat = $endDate->format('Y-m-d 23:59:59');
        
        // Build base query
        $query = $user->healthMetrics()
            ->whereBetween('recorded_at', [$startDateFormat, $endDateFormat]);
        
        // Apply type filter
        if ($metricType !== 'all') {
            switch ($metricType) {
                case 'blood_glucose':
                    $query->bloodGlucose();
                    break;
                case 'blood_pressure':
                    $query->bloodPressure();
                    break;
                case 'heart_rate':
                    $query->whereNotNull('heart_rate');
                    break;
                case 'weight':
                    $query->whereNotNull('weight_kg');
                    break;
                case 'a1c':
                    $query->whereNotNull('a1c_percentage');
                    break;
                case 'exercise':
                    $query->whereNotNull('exercise_duration');
                    break;
            }
        }
        
        // Initialize array to store metrics by date
        $metricsByDate = [];
        
        // Process data in chunks to avoid memory exhaustion
        $query->orderBy('recorded_at', 'asc')
            ->chunk(100, function($metrics) use (&$metricsByDate, $metricType) {
                foreach ($metrics as $metric) {
                    $date = Carbon::parse($metric->recorded_at)->format('Y-m-d');
                    
                    // Initialize date in array if not exists
                    if (!isset($metricsByDate[$date])) {
                        $metricsByDate[$date] = [
                            'date' => $date,
                            'metrics' => []
                        ];
                    }
                    
                    // Add this metric to the date's collection
                    $metricsByDate[$date]['metrics'][] = $metric;
                }
            });
        
        // Process daily metrics to calculate averages
        $chartData = [];
        foreach ($metricsByDate as $date => $data) {
            $dailyMetrics = collect($data['metrics']);
            $dataPoint = ['date' => $date];
            
            // Blood glucose
            if ($metricType === 'all' || $metricType === 'blood_glucose') {
                $this->processBloodGlucoseForChart($dailyMetrics, $dataPoint);
            }
            
            // Blood pressure
            if ($metricType === 'all' || $metricType === 'blood_pressure') {
                $this->processBloodPressureForChart($dailyMetrics, $dataPoint);
            }
            
            // Heart rate
            if ($metricType === 'all' || $metricType === 'heart_rate') {
                $this->processHeartRateForChart($dailyMetrics, $dataPoint);
            }
            
            // Weight
            if ($metricType === 'all' || $metricType === 'weight') {
                $this->processWeightForChart($dailyMetrics, $dataPoint);
            }
            
            // A1C
            if ($metricType === 'all' || $metricType === 'a1c') {
                $this->processA1CForChart($dailyMetrics, $dataPoint);
            }
            
            // Exercise
            if ($metricType === 'all' || $metricType === 'exercise') {
                $this->processExerciseForChart($dailyMetrics, $dataPoint);
            }
            
            // Add to chart data if we have any metrics
            if (count($dataPoint) > 1) {
                $chartData[] = $dataPoint;
            }
        }
        
        // Sort chart data by date (ascending)
        usort($chartData, function($a, $b) {
            return strcmp($a['date'], $b['date']);
        });
        
        // Return response
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => [
                'chart_data' => $chartData,
                'timeframe' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'days' => $days
                ],
                'metric_type' => $metricType
            ]
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Process blood glucose readings for chart data
     */
    private function processBloodGlucoseForChart($dailyMetrics, &$dataPoint)
    {
        $bgReadings = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->blood_glucose_level);
        });
        
        if ($bgReadings->count() > 0) {
            $dataPoint['blood_glucose'] = round($bgReadings->avg('blood_glucose_level'), 1);
            
            // Add context-specific averages if available
            $beforeMealReadings = $bgReadings->where('measurement_context', 'before_meal');
            $afterMealReadings = $bgReadings->where('measurement_context', 'after_meal');
            $fastingReadings = $bgReadings->where('measurement_context', 'fasting');
            
            if ($beforeMealReadings->count() > 0) {
                $dataPoint['blood_glucose_before_meal'] = round($beforeMealReadings->avg('blood_glucose_level'), 1);
            }
            
            if ($afterMealReadings->count() > 0) {
                $dataPoint['blood_glucose_after_meal'] = round($afterMealReadings->avg('blood_glucose_level'), 1);
            }
            
            if ($fastingReadings->count() > 0) {
                $dataPoint['blood_glucose_fasting'] = round($fastingReadings->avg('blood_glucose_level'), 1);
            }
        }
    }
    
    /**
     * Process blood pressure readings for chart data
     */
    private function processBloodPressureForChart($dailyMetrics, &$dataPoint)
    {
        $bpReadings = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->systolic_pressure) && !is_null($metric->diastolic_pressure);
        });
        
        if ($bpReadings->count() > 0) {
            $dataPoint['systolic_pressure'] = round($bpReadings->avg('systolic_pressure'));
            $dataPoint['diastolic_pressure'] = round($bpReadings->avg('diastolic_pressure'));
        }
    }
    
    /**
     * Process heart rate readings for chart data
     */
    private function processHeartRateForChart($dailyMetrics, &$dataPoint)
    {
        $hrReadings = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->heart_rate);
        });
        
        if ($hrReadings->count() > 0) {
            $dataPoint['heart_rate'] = round($hrReadings->avg('heart_rate'));
        }
    }
    
    /**
     * Process weight readings for chart data
     */
    private function processWeightForChart($dailyMetrics, &$dataPoint)
    {
        $weightReadings = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->weight_kg);
        });
        
        if ($weightReadings->count() > 0) {
            $dataPoint['weight_kg'] = round($weightReadings->avg('weight_kg'), 1);
        }
    }
    
    /**
     * Process A1C readings for chart data
     */
    private function processA1CForChart($dailyMetrics, &$dataPoint)
    {
        $a1cReadings = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->a1c_percentage);
        });
        
        if ($a1cReadings->count() > 0) {
            $dataPoint['a1c_percentage'] = round($a1cReadings->avg('a1c_percentage'), 1);
        }
    }
    
    /**
     * Process exercise data for chart data
     */
    private function processExerciseForChart($dailyMetrics, &$dataPoint)
    {
        $exerciseEntries = $dailyMetrics->filter(function ($metric) {
            return !is_null($metric->exercise_duration);
        });
        
        if ($exerciseEntries->count() > 0) {
            $dataPoint['exercise_duration'] = round($exerciseEntries->sum('exercise_duration'));
            
            // Count exercise by type
            $exerciseTypes = $exerciseEntries->groupBy('exercise_type');
            foreach ($exerciseTypes as $type => $entries) {
                if (!empty($type)) {
                    $dataPoint['exercise_' . strtolower($type)] = round($entries->sum('exercise_duration'));
                }
            }
        }
    }
    
    /**
     * Get distribution statistics for health metrics
     */
    public function getDistributionData(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $queryParams = $request->getQueryParams();
        
        // Get user
        $user = User::find($userId);
        if (!$user) {
            return $this->respondWithError($response, 'User not found', 404);
        }
        
        // Determine timeframe
        $days = isset($queryParams['days']) ? (int) $queryParams['days'] : 90;
        // Limit maximum days to prevent memory issues
        $days = min($days, 365);
        
        $endDate = isset($queryParams['end_date']) ? Carbon::parse($queryParams['end_date']) : Carbon::now();
        $startDate = isset($queryParams['start_date']) 
            ? Carbon::parse($queryParams['start_date']) 
            : $endDate->copy()->subDays($days);
        
        // Format for SQL queries
        $startDateFormat = $startDate->format('Y-m-d');
        $endDateFormat = $endDate->format('Y-m-d 23:59:59');
        
        // Get metrics within the time period - use chunking to reduce memory usage
        $distribution = $this->initializeDistributionData($startDate, $endDate, $days);
        
        // Process data in chunks to avoid memory exhaustion
        $user->healthMetrics()
            ->whereBetween('recorded_at', [$startDateFormat, $endDateFormat])
            ->chunk(100, function($metrics) use (&$distribution) {
                $this->processMetricChunk($metrics, $distribution);
            });
        
        // Calculate percentages after all data is processed
        $this->calculatePercentages($distribution);
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $distribution
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    /**
     * Initialize empty distribution data structure
     */
    private function initializeDistributionData(Carbon $startDate, Carbon $endDate, int $days): array
    {
        return [
            'blood_glucose' => [
                'ranges' => [
                    '<70' => 0,
                    '70-90' => 0,
                    '90-120' => 0,
                    '120-150' => 0,
                    '150-180' => 0,
                    '180-250' => 0,
                    '>250' => 0
                ],
                'by_context' => [
                    'fasting' => [
                        '<70' => 0,
                        '70-90' => 0,
                        '90-120' => 0,
                        '120-150' => 0,
                        '150-180' => 0,
                        '180-250' => 0,
                        '>250' => 0
                    ],
                    'before_meal' => [
                        '<70' => 0,
                        '70-90' => 0,
                        '90-120' => 0,
                        '120-150' => 0,
                        '150-180' => 0,
                        '180-250' => 0,
                        '>250' => 0
                    ],
                    'after_meal' => [
                        '<70' => 0,
                        '70-90' => 0,
                        '90-120' => 0,
                        '120-150' => 0,
                        '150-180' => 0,
                        '180-250' => 0,
                        '>250' => 0
                    ],
                    'bedtime' => [
                        '<70' => 0,
                        '70-90' => 0,
                        '90-120' => 0,
                        '120-150' => 0,
                        '150-180' => 0,
                        '180-250' => 0,
                        '>250' => 0
                    ]
                ],
                'total_readings' => 0
            ],
            'blood_pressure' => [
                'systolic_ranges' => [
                    '<120' => 0,
                    '120-129' => 0,
                    '130-139' => 0,
                    '140-159' => 0,
                    '160-180' => 0,
                    '>180' => 0
                ],
                'diastolic_ranges' => [
                    '<80' => 0,
                    '80-89' => 0,
                    '90-99' => 0,
                    '100-110' => 0,
                    '>110' => 0
                ],
                'categories' => [
                    'normal' => 0,
                    'elevated' => 0,
                    'hypertension_stage1' => 0,
                    'hypertension_stage2' => 0,
                    'hypertensive_crisis' => 0
                ],
                'total_readings' => 0
            ],
            'heart_rate' => [
                'ranges' => [
                    '<60' => 0,
                    '60-70' => 0,
                    '70-80' => 0,
                    '80-90' => 0,
                    '90-100' => 0,
                    '>100' => 0
                ],
                'total_readings' => 0
            ],
            'weight' => [
                'changes' => [
                    'loss' => 0,
                    'gain' => 0,
                    'no_change' => 0
                ],
                'total_readings' => 0
            ],
            'timeframe' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'days' => $days
            ]
        ];
    }
    
    /**
     * Process a chunk of metrics and update the distribution counts
     */
    private function processMetricChunk($metrics, &$distribution)
    {
        // Track last weight for change calculations
        static $lastWeight = null;
        
        foreach ($metrics as $metric) {
            // Process blood glucose
            if (!is_null($metric->blood_glucose_level)) {
                $bg = $metric->blood_glucose_level;
                $context = $metric->measurement_context ?? 'unknown';
                
                // Increment total count
                $distribution['blood_glucose']['total_readings']++;
                
                // Categorize by range
                $range = $this->getBloodGlucoseRange($bg);
                $distribution['blood_glucose']['ranges'][$range]++;
                
                if (isset($distribution['blood_glucose']['by_context'][$context])) {
                    $distribution['blood_glucose']['by_context'][$context][$range]++;
                }
            }
            
            // Process blood pressure
            if (!is_null($metric->systolic_pressure) && !is_null($metric->diastolic_pressure)) {
                $systolic = $metric->systolic_pressure;
                $diastolic = $metric->diastolic_pressure;
                
                // Increment total count
                $distribution['blood_pressure']['total_readings']++;
                
                // Categorize systolic pressure
                $distribution['blood_pressure']['systolic_ranges'][$this->getSystolicRange($systolic)]++;
                
                // Categorize diastolic pressure
                $distribution['blood_pressure']['diastolic_ranges'][$this->getDiastolicRange($diastolic)]++;
                
                // Categorize BP by clinical category
                $distribution['blood_pressure']['categories'][$this->getBPCategory($systolic, $diastolic)]++;
            }
            
            // Process heart rate
            if (!is_null($metric->heart_rate)) {
                $hr = $metric->heart_rate;
                
                // Increment total count
                $distribution['heart_rate']['total_readings']++;
                
                // Categorize by range
                $distribution['heart_rate']['ranges'][$this->getHeartRateRange($hr)]++;
            }
            
            // Process weight
            if (!is_null($metric->weight_kg)) {
                $currentWeight = $metric->weight_kg;
                $distribution['weight']['total_readings']++;
                
                if ($lastWeight !== null) {
                    $change = $currentWeight - $lastWeight;
                    
                    // Categorize weight change (using 0.2kg threshold for significance)
                    if ($change < -0.2) {
                        $distribution['weight']['changes']['loss']++;
                    } elseif ($change > 0.2) {
                        $distribution['weight']['changes']['gain']++;
                    } else {
                        $distribution['weight']['changes']['no_change']++;
                    }
                }
                
                $lastWeight = $currentWeight;
            }
        }
    }
    
    /**
     * Calculate percentages for the distribution data
     */
    private function calculatePercentages(&$distribution)
    {
        foreach ($distribution as $metricType => &$data) {
            if ($metricType === 'timeframe') {
                continue;
            }
            
            if ($data['total_readings'] > 0) {
                // Add percentage calculations for main categories
                foreach ($data as $category => $values) {
                    if (is_array($values) && $category !== 'by_context') {
                        $data[$category . '_percent'] = [];
                        
                        foreach ($values as $range => $count) {
                            $data[$category . '_percent'][$range] = round(($count / $data['total_readings']) * 100, 1);
                        }
                    }
                }
                
                // Add percentages for by_context if it exists
                if (isset($data['by_context'])) {
                    $data['by_context_percent'] = [];
                    
                    foreach ($data['by_context'] as $context => $ranges) {
                        $contextTotal = array_sum($ranges);
                        if ($contextTotal > 0) {
                            $data['by_context_percent'][$context] = [];
                            
                            foreach ($ranges as $range => $count) {
                                $data['by_context_percent'][$context][$range] = round(($count / $contextTotal) * 100, 1);
                            }
                        }
                    }
                }
            }
        }
    }
    
    /**
     * Get the appropriate range category for a blood glucose reading
     */
    private function getBloodGlucoseRange($value)
    {
        if ($value < 70) return '<70';
        if ($value < 90) return '70-90';
        if ($value < 120) return '90-120';
        if ($value < 150) return '120-150';
        if ($value < 180) return '150-180';
        if ($value < 250) return '180-250';
        return '>250';
    }
    
    /**
     * Get the appropriate range category for a systolic blood pressure reading
     */
    private function getSystolicRange($value)
    {
        if ($value < 120) return '<120';
        if ($value < 130) return '120-129';
        if ($value < 140) return '130-139';
        if ($value < 160) return '140-159';
        if ($value < 180) return '160-180';
        return '>180';
    }
    
    /**
     * Get the appropriate range category for a diastolic blood pressure reading
     */
    private function getDiastolicRange($value)
    {
        if ($value < 80) return '<80';
        if ($value < 90) return '80-89';
        if ($value < 100) return '90-99';
        if ($value < 110) return '100-110';
        return '>110';
    }
    
    /**
     * Get the clinical category for a blood pressure reading
     */
    private function getBPCategory($systolic, $diastolic)
    {
        if ($systolic >= 180 || $diastolic >= 120) return 'hypertensive_crisis';
        if ($systolic >= 140 || $diastolic >= 90) return 'hypertension_stage2';
        if ($systolic >= 130 || $diastolic >= 80) return 'hypertension_stage1';
        if ($systolic >= 120 && $diastolic < 80) return 'elevated';
        return 'normal';
    }
    
    /**
     * Get the appropriate range category for a heart rate reading
     */
    private function getHeartRateRange($value)
    {
        if ($value < 60) return '<60';
        if ($value < 70) return '60-70';
        if ($value < 80) return '70-80';
        if ($value < 90) return '80-90';
        if ($value < 100) return '90-100';
        return '>100';
    }
} 