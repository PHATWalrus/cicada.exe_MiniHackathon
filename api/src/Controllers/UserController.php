<?php

namespace DiaX\Controllers;

use DiaX\Models\MedicalProfile;
use DiaX\Models\User;
use Psr\Container\ContainerInterface;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Respect\Validation\Validator as v;

class UserController
{
    private $container;
    
    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
    }
    
    public function getProfile(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $user = User::find($userId);
        
        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'User not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone_number' => $user->phone_number,
            'date_of_birth' => $user->date_of_birth ? $user->date_of_birth->format('Y-m-d') : null,
            'gender' => $user->gender,
            'created_at' => $user->created_at->format('Y-m-d H:i:s'),
            'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->format('Y-m-d H:i:s') : null,
            'has_medical_profile' => $user->medicalProfile()->exists()
        ];
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $userData
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function updateProfile(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $user = User::find($userId);
        
        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'User not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        
        $data = $request->getParsedBody();
        $errors = [];
        
        // Validate inputs
        if (isset($data['name']) && empty($data['name'])) {
            $errors['name'] = 'Name cannot be empty';
        }
        
        if (isset($data['email'])) {
            if (!v::email()->validate($data['email'])) {
                $errors['email'] = 'Valid email is required';
            } elseif ($data['email'] !== $user->email) {
                // Check if email already exists for another user
                $existingUser = User::where('email', $data['email'])->where('id', '!=', $userId)->first();
                if ($existingUser) {
                    $errors['email'] = 'Email is already taken';
                }
            }
        }
        
        if (isset($data['password']) && !empty($data['password']) && strlen($data['password']) < 8) {
            $errors['password'] = 'Password must be at least 8 characters';
        }
        
        if (!empty($errors)) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'Validation failed',
                'errors' => $errors
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }
        
        // Update user data
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }
        
        if (isset($data['email'])) {
            $user->email = $data['email'];
        }
        
        if (isset($data['password']) && !empty($data['password'])) {
            $user->password = $data['password'];
        }
        
        if (isset($data['phone_number'])) {
            $user->phone_number = $data['phone_number'];
        }
        
        if (isset($data['date_of_birth'])) {
            $user->date_of_birth = $data['date_of_birth'];
        }
        
        if (isset($data['gender'])) {
            $user->gender = $data['gender'];
        }
        
        $user->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Profile updated successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function updateMedicalInfo(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $user = User::find($userId);
        
        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'User not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        
        $data = $request->getParsedBody();
        
        // Get or create medical profile
        $medicalProfile = $user->medicalProfile;
        if (!$medicalProfile) {
            $medicalProfile = new MedicalProfile();
            $medicalProfile->user_id = $userId;
        }
        
        // Update fields if provided
        if (isset($data['diabetes_type'])) {
            $medicalProfile->diabetes_type = $data['diabetes_type'];
        }
        
        if (isset($data['diagnosis_year'])) {
            $medicalProfile->diagnosis_year = $data['diagnosis_year'];
        }
        
        if (isset($data['height_cm'])) {
            $medicalProfile->height_cm = $data['height_cm'];
        }
        
        if (isset($data['weight_kg'])) {
            $medicalProfile->weight_kg = $data['weight_kg'];
        }
        
        if (isset($data['target_glucose_min'])) {
            $medicalProfile->target_glucose_min = $data['target_glucose_min'];
        }
        
        if (isset($data['target_glucose_max'])) {
            $medicalProfile->target_glucose_max = $data['target_glucose_max'];
        }
        
        if (isset($data['medications'])) {
            $medicalProfile->medications = $data['medications'];
        }
        
        if (isset($data['allergies'])) {
            $medicalProfile->allergies = $data['allergies'];
        }
        
        if (isset($data['comorbidities'])) {
            $medicalProfile->comorbidities = $data['comorbidities'];
        }
        
        if (isset($data['notes'])) {
            $medicalProfile->notes = $data['notes'];
        }
        
        $medicalProfile->save();
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'message' => 'Medical information updated successfully'
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
    
    public function getMedicalInfo(Request $request, Response $response): Response
    {
        $userId = $request->getAttribute('user_id');
        $user = User::find($userId);
        
        if (!$user) {
            $response->getBody()->write(json_encode([
                'error' => true,
                'message' => 'User not found'
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
        }
        
        $medicalProfile = $user->medicalProfile;
        
        if (!$medicalProfile) {
            $response->getBody()->write(json_encode([
                'error' => false,
                'data' => null,
                'message' => 'No medical profile found'
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        }
        
        $medicalData = [
            'id' => $medicalProfile->id,
            'diabetes_type' => $medicalProfile->diabetes_type,
            'diagnosis_year' => $medicalProfile->diagnosis_year,
            'height_cm' => $medicalProfile->height_cm,
            'weight_kg' => $medicalProfile->weight_kg,
            'bmi' => $medicalProfile->bmi,
            'target_glucose_min' => $medicalProfile->target_glucose_min,
            'target_glucose_max' => $medicalProfile->target_glucose_max,
            'medications' => $medicalProfile->medications,
            'allergies' => $medicalProfile->allergies,
            'comorbidities' => $medicalProfile->comorbidities,
            'notes' => $medicalProfile->notes,
            'created_at' => $medicalProfile->created_at->format('Y-m-d H:i:s'),
            'updated_at' => $medicalProfile->updated_at->format('Y-m-d H:i:s')
        ];
        
        $response->getBody()->write(json_encode([
            'error' => false,
            'data' => $medicalData
        ]));
        
        return $response->withHeader('Content-Type', 'application/json');
    }
} 