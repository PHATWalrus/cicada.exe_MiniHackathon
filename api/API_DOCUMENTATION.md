# DiaX API Documentation

This document provides detailed information about the DiaX API endpoints, request parameters, and response formats.

## Base URL

```
https://diax.fileish.com/api
```

## Authentication

Most endpoints require authentication using JWT (JSON Web Token). Include the token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

### Token Security

The API implements several security measures for tokens:

- **Token Fingerprinting**: Tokens are bound to the client IP and user agent to prevent token theft
- **Token Expiration**: Tokens automatically expire after a configured time (default: 1 hour)
- **Token Revocation**: Tokens are invalidated on logout to prevent reuse
- **Unique Token IDs**: Each token contains a unique identifier to prevent replay attacks

## Rate Limiting

The API implements rate limiting to protect against abuse:

- **Authentication Endpoints**: 10 requests per 5 minutes
- **Standard API Endpoints**: 60 requests per minute

When rate limits are exceeded, endpoints return:

```
Status: 429 Too Many Requests
```

```json
{
  "error": true,
  "message": "Too many requests. Please try again later.",
  "retry_after": 300
}
```

The `retry_after` value indicates the number of seconds to wait before making another request.

## CORS Support

This API supports Cross-Origin Resource Sharing (CORS) for cross-domain requests with the following configuration:

- **Allowed Origins:** Specific domains (diax.vercel.app, diax.fileish.com)
- **Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Accept, Authorization, X-Requested-With, Origin
- **Credentials:** Allowed (supports cookies in cross-domain requests)
- **Pre-flight Caching:** 24 hours

Preflight OPTIONS requests are automatically handled by the API's CORS middleware.

### Error Responses

All API endpoints return JSON responses with the following structure:

- Success responses:
  ```json
  {
    "error": false,
    "data": {},
    "message": "Optional success message"
  }
  ```

- Error responses:
  ```json
  {
    "error": true,
    "message": "Error description",
    "errors": {} // Optional detailed validation errors
  }
  ```

## Public Endpoints

### Health Check

- **Endpoint:** `GET /health`
- **Description:** Check API status
- **Auth Required:** No
- **Response:**
  ```json
  {
    "error": false,
    "status": "ok",
    "message": "DiaX API is running",
    "timestamp": 1682864827
  }
  ```

### User Registration

- **Endpoint:** `POST /auth/register`
- **Description:** Register a new user and send an email verification link
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Email:** Sends a verification email to the provided email address with a verification token
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | name | string | Yes | User's full name |
  | email | string | Yes | User's email address |
  | password | string | Yes | Password (min 8 characters) |
  | phone_number | string | No | User's phone number |
  | date_of_birth | string | No | Date of birth (YYYY-MM-DD) |
  | gender | string | No | Gender (male, female, other) |

- **Example Request:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePassword123",
    "phone_number": "+1234567890",
    "date_of_birth": "1985-06-15",
    "gender": "male"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "User registered successfully. Please check your email to verify your account.",
    "data": {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "email_verified": false
      },
      "token": "JWT_TOKEN_HERE"
    }
  }
  ```

### Email Verification

- **Endpoint:** `POST /auth/verify-email`
- **Description:** Verify a user's email address using the token sent via email
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Email:** Sends a welcome email upon successful verification
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | token | string | Yes | Verification token received via email |

- **Example Request:**
  ```json
  {
    "token": "verification-token-from-email"
  }
  ```

- **Success Response:**
  ```json
  {
    "error": false,
    "message": "Email verified successfully",
    "data": {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "email_verified": true
      },
      "token": "JWT_TOKEN_HERE"
    }
  }
  ```

- **Error Response (invalid or expired token):**
  ```json
  {
    "error": true,
    "message": "Invalid or expired verification token"
  }
  ```

### Resend Verification Email

- **Endpoint:** `POST /auth/resend-verification`
- **Description:** Request a new verification email be sent to the user
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Email:** Sends a new verification email if the account exists and is not verified
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | email | string | Yes | User's email address |

- **Example Request:**
  ```json
  {
    "email": "john@example.com"
  }
  ```

- **Response (always returned regardless of whether the email exists or is verified):**
  ```json
  {
    "error": false,
    "message": "If your email exists in our system and is not yet verified, a new verification email has been sent."
  }
  ```

### User Login

- **Endpoint:** `POST /auth/login`
- **Description:** Authenticate a user and receive an access token
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Security:** Account is temporarily locked after multiple failed login attempts
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | email | string | Yes | User's email address |
  | password | string | Yes | User's password |

- **Example Request:**
  ```json
  {
    "email": "john@example.com",
    "password": "SecurePassword123"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Login successful",
    "data": {
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "email_verified": true
      },
      "token": "JWT_TOKEN_HERE"
    }
  }
  ```

- **Account Locking Response (after multiple failed attempts):**
  ```json
  {
    "error": true,
    "message": "Account is temporarily locked. Please try again in 15 minute(s)."
  }
  ```

### Forgot Password

- **Endpoint:** `POST /auth/forgot-password`
- **Description:** Request a password reset link be sent to the user's email
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Email:** Sends a password reset email with a secure token
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | email | string | Yes | User's email address |

- **Example Request:**
  ```json
  {
    "email": "john@example.com"
  }
  ```

- **Response (always returned regardless of whether the email exists):**
  ```json
  {
    "error": false,
    "message": "If the email address exists in our system, a password reset link has been sent."
  }
  ```

### Reset Password

- **Endpoint:** `POST /auth/reset-password`
- **Description:** Reset a user's password using a valid reset token
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Email:** Sends a confirmation email after successful password reset
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | token | string | Yes | Password reset token received via email |
  | password | string | Yes | New password (min 8 characters) |
  | password_confirmation | string | Yes | Confirm new password |

- **Example Request:**
  ```json
  {
    "token": "valid-reset-token-from-email",
    "password": "NewSecurePassword123",
    "password_confirmation": "NewSecurePassword123"
  }
  ```

- **Success Response:**
  ```json
  {
    "error": false,
    "message": "Password has been reset successfully."
  }
  ```

- **Error Response (invalid or expired token):**
  ```json
  {
    "error": true,
    "message": "Invalid or expired password reset token."
  }
  ```

- **Error Response (validation errors):**
  ```json
  {
    "error": true,
    "message": "Validation failed",
    "errors": {
      "password": ["Password must be at least 8 characters."],
      "password_confirmation": ["Password confirmation does not match."]
    }
  }
  ```

### Token Refresh

- **Endpoint:** `POST /auth/refresh`
- **Description:** Get a new token using existing token
- **Auth Required:** No
- **Rate Limit:** 10 requests per 5 minutes
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | token | string | Yes | Existing JWT token |

- **Example Request:**
  ```json
  {
    "token": "EXISTING_JWT_TOKEN"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Token refreshed successfully",
    "data": {
      "token": "NEW_JWT_TOKEN"
    }
  }
  ```

### Get Public Resources

- **Endpoint:** `GET /resources`
- **Description:** Get list of diabetes resources
- **Auth Required:** No
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | category | string | No | Filter by category (nutrition, treatment, management, exercise, complications) |
  | type | string | No | Filter by type (article, guide, etc.) |
  | tag | string | No | Filter by tag |

- **Response:**
  ```json
  {
    "error": false,
    "data": [
      {
        "id": 1,
        "title": "Diabetes Meal Planning",
        "description": "Guidelines for creating healthy meal plans...",
        "url": "https://www.diabetes.org/nutrition",
        "category": "nutrition",
        "type": "article",
        "tags": ["meal planning", "diet", "carbohydrates"],
        "created_at": "2023-04-01 10:30:15",
        "updated_at": "2023-04-01 10:30:15"
      }
    ]
  }
  ```

## Protected Endpoints

All these endpoints require a valid JWT token in the Authorization header.

### User Logout

- **Endpoint:** `POST /auth/logout`
- **Description:** Logout the current user and revoke the token
- **Auth Required:** Yes
- **Rate Limit:** 10 requests per 5 minutes
- **Security:** Invalidates the token to prevent reuse after logout
- **Response:**
  ```json
  {
    "error": false,
    "message": "Logged out successfully"
  }
  ```

### Get User Profile

- **Endpoint:** `GET /users/profile`
- **Description:** Get the current user's profile information
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "date_of_birth": "1985-06-15",
      "gender": "male",
      "created_at": "2023-04-01 10:30:15",
      "has_medical_profile": true
    }
  }
  ```

### Update User Profile

- **Endpoint:** `PUT /users/profile`
- **Description:** Update the current user's profile
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | name | string | No | User's name |
  | email | string | No | User's email address |
  | password | string | No | New password (min 8 chars) |
  | phone_number | string | No | User's phone number |
  | date_of_birth | string | No | Date of birth (YYYY-MM-DD) |
  | gender | string | No | Gender (male, female, other) |

- **Example Request:**
  ```json
  {
    "name": "John A. Doe",
    "phone_number": "+9876543210"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Profile updated successfully"
  }
  ```

### Get Medical Information

- **Endpoint:** `GET /users/medical-info`
- **Description:** Get the user's medical profile
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "id": 1,
      "diabetes_type": "type2",
      "diagnosis_year": 2015,
      "height_cm": 175.0,
      "weight_kg": 80.5,
      "bmi": 26.3,
      "target_glucose_min": 70.0,
      "target_glucose_max": 120.0,
      "medications": "Metformin 500mg twice daily",
      "allergies": "Penicillin",
      "comorbidities": "Hypertension",
      "notes": "Additional notes here",
      "created_at": "2023-04-01 10:30:15",
      "updated_at": "2023-04-01 10:30:15"
    }
  }
  ```

### Update Medical Information

- **Endpoint:** `POST /users/medical-info`
- **Description:** Update or create medical information
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | diabetes_type | string | No | Type of diabetes (type1, type2, gestational, prediabetes, other) |
  | diagnosis_year | integer | No | Year of diagnosis |
  | height_cm | float | No | Height in centimeters |
  | weight_kg | float | No | Weight in kilograms |
  | target_glucose_min | float | No | Target minimum glucose level |
  | target_glucose_max | float | No | Target maximum glucose level |
  | medications | string | No | Current medications |
  | allergies | string | No | Known allergies |
  | comorbidities | string | No | Other health conditions |
  | notes | string | No | Additional notes |

- **Example Request:**
  ```json
  {
    "diabetes_type": "type2",
    "diagnosis_year": 2015,
    "height_cm": 175.0,
    "weight_kg": 80.5,
    "target_glucose_min": 70.0,
    "target_glucose_max": 120.0,
    "medications": "Metformin 500mg twice daily"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Medical information updated successfully"
  }
  ```

### Delete Medical Record

- **Endpoint:** `DELETE /users/medical-record`
- **Description:** Delete the user's entire medical record (profile and health metrics)
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "error": false,
    "message": "Medical record deleted successfully"
  }
  ```

### Get Health Metrics

- **Endpoint:** `GET /health/metrics`
- **Description:** Get user's health metrics with optional filtering
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | type | string | No | Filter by metric type (blood_glucose, blood_pressure, heart_rate, weight, a1c, exercise) |
  | days | integer | No | Get metrics from the last X days |
  | from | string | No | Start date (YYYY-MM-DD) |
  | to | string | No | End date (YYYY-MM-DD) |
  | limit | integer | No | Results per page (default: 50) |
  | page | integer | No | Page number (default: 1) |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "metrics": [
        {
          "id": 1,
          "user_id": 1,
          "blood_glucose_level": 120.0,
          "measurement_context": "before_meal",
          "recorded_at": "2023-06-15 08:30:00",
          "created_at": "2023-06-15 08:35:22",
          "updated_at": "2023-06-15 08:35:22"
        }
      ],
      "pagination": {
        "total": 25,
        "page": 1,
        "limit": 50,
        "total_pages": 1
      }
    }
  }
  ```

### Add Health Metric

- **Endpoint:** `POST /health/metrics`
- **Description:** Add a new health metric record
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | blood_glucose_level | float | No* | Blood glucose level in mg/dL |
  | measurement_context | string | No | Context of measurement (fasting, before_meal, after_meal, etc.) |
  | systolic_pressure | integer | No* | Systolic blood pressure in mmHg |
  | diastolic_pressure | integer | No* | Diastolic blood pressure in mmHg |
  | heart_rate | integer | No* | Heart rate in beats per minute |
  | weight_kg | float | No* | Weight in kilograms |
  | a1c_percentage | float | No* | A1C test result percentage |
  | medication_notes | string | No | Notes about medication taken |
  | exercise_duration | integer | No* | Exercise duration in minutes |
  | exercise_type | string | No | Type of exercise performed |
  | exercise_intensity | integer | No | Exercise intensity (1-10 scale) |
  | food_notes | string | No | Notes about food consumed |
  | carbs_grams | integer | No | Carbohydrates consumed in grams |
  | notes | string | No | General notes for this entry |
  | recorded_at | string | No | When the measurement was taken (default: current time) |

  *At least one of these metric values must be provided

- **Example Request:**
  ```json
  {
    "blood_glucose_level": 135.5,
    "measurement_context": "after_meal",
    "recorded_at": "2023-06-15 13:45:00",
    "notes": "Lunch: sandwich and salad"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Health metric added successfully",
    "data": {
      "id": 35
    }
  }
  ```

### Update Health Metric

- **Endpoint:** `PUT /health/metrics/{id}`
- **Description:** Update an existing health metric
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Health metric ID |

- **Request Parameters:** Same as Add Health Metric
- **Response:**
  ```json
  {
    "error": false,
    "message": "Health metric updated successfully"
  }
  ```

### Delete Health Metric

- **Endpoint:** `DELETE /health/metrics/{id}`
- **Description:** Delete a health metric record
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Health metric ID |

- **Response:**
  ```json
  {
    "error": false,
    "message": "Health metric deleted successfully"
  }
  ```

### Get Health Statistics

- **Endpoint:** `GET /health/stats`
- **Description:** Get statistical data about user's health metrics
- **Auth Required:** Yes
- **Rate Limit:** 60 requests per minute
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | days | integer | No | Number of days to analyze (default: 30) |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "stats": {
        "blood_glucose": {
          "count": 45,
          "avg": 128.5,
          "min": 95.0,
          "max": 195.0,
          "last": 118.0,
          "in_range_percentage": 78
        },
        "blood_pressure": {
          "count": 12,
          "avg_systolic": 124,
          "avg_diastolic": 82,
          "last": "120/80 mmHg"
        },
        "heart_rate": {
          "count": 15,
          "avg": 72,
          "min": 65,
          "max": 90,
          "last": 70
        },
        "weight": {
          "count": 8,
          "last": 80.5,
          "change": -1.2
        },
        "days_with_entries": 25
      },
      "timeframe_days": 30
    }
  }
  ```

### Get Health Chart Data

- **Endpoint:** `GET /health/charts`
- **Description:** Get health metrics data formatted for time-series charts
- **Auth Required:** Yes
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | type | string | No | Filter by metric type (blood_glucose, blood_pressure, heart_rate, weight, a1c, exercise, all). Default: all |
  | days | integer | No | Number of days to analyze (default: 30) |
  | start_date | string | No | Start date (YYYY-MM-DD) |
  | end_date | string | No | End date (YYYY-MM-DD) |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "chart_data": [
        {
          "date": "2023-06-01",
          "blood_glucose": 120.5,
          "blood_glucose_before_meal": 115.2,
          "blood_glucose_after_meal": 138.7,
          "systolic_pressure": 125,
          "diastolic_pressure": 78,
          "heart_rate": 72,
          "weight_kg": 80.2
        },
        {
          "date": "2023-06-02",
          "blood_glucose": 118.6,
          "blood_glucose_before_meal": 110.8,
          "blood_glucose_after_meal": 142.3,
          "systolic_pressure": 124,
          "diastolic_pressure": 76,
          "heart_rate": 70,
          "weight_kg": 80.2
        }
      ],
      "timeframe": {
        "start_date": "2023-06-01",
        "end_date": "2023-06-30",
        "days": 30
      },
      "metric_type": "all"
    }
  }
  ```

### Get Health Metrics Distribution

- **Endpoint:** `GET /health/distribution`
- **Description:** Get distribution statistics for health metrics
- **Auth Required:** Yes
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | days | integer | No | Number of days to analyze (default: 90) |
  | start_date | string | No | Start date (YYYY-MM-DD) |
  | end_date | string | No | End date (YYYY-MM-DD) |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "blood_glucose": {
        "ranges": {
          "<70": 2,
          "70-90": 15,
          "90-120": 80,
          "120-150": 45,
          "150-180": 20,
          "180-250": 5,
          ">250": 1
        },
        "ranges_percent": {
          "<70": 1.2,
          "70-90": 8.9,
          "90-120": 47.6,
          "120-150": 26.8,
          "150-180": 11.9,
          "180-250": 3.0,
          ">250": 0.6
        },
        "by_context": {
          "fasting": {
            "<70": 1,
            "70-90": 8,
            "90-120": 21,
            "120-150": 5,
            "150-180": 0,
            "180-250": 0,
            ">250": 0
          },
          "before_meal": {
            "<70": 1,
            "70-90": 6,
            "90-120": 35,
            "120-150": 10,
            "150-180": 3,
            "180-250": 0,
            ">250": 0
          },
          "after_meal": {
            "<70": 0,
            "70-90": 1,
            "90-120": 24,
            "120-150": 30,
            "150-180": 17,
            "180-250": 5,
            ">250": 1
          }
        },
        "by_context_percent": {
          "fasting": {
            "<70": 2.9,
            "70-90": 22.9,
            "90-120": 60.0,
            "120-150": 14.2,
            "150-180": 0,
            "180-250": 0,
            ">250": 0
          }
        },
        "total_readings": 168
      },
      "blood_pressure": {
        "systolic_ranges": {
          "<120": 25,
          "120-129": 35,
          "130-139": 15,
          "140-159": 8,
          "160-180": 2,
          ">180": 0
        },
        "systolic_ranges_percent": {
          "<120": 29.4,
          "120-129": 41.2,
          "130-139": 17.6,
          "140-159": 9.4,
          "160-180": 2.4,
          ">180": 0
        },
        "diastolic_ranges": {
          "<80": 45,
          "80-89": 30,
          "90-99": 8,
          "100-110": 2,
          ">110": 0
        },
        "diastolic_ranges_percent": {
          "<80": 52.9,
          "80-89": 35.3,
          "90-99": 9.4,
          "100-110": 2.4,
          ">110": 0
        },
        "categories": {
          "normal": 25,
          "elevated": 20,
          "hypertension_stage1": 25,
          "hypertension_stage2": 15,
          "hypertensive_crisis": 0
        },
        "categories_percent": {
          "normal": 29.4,
          "elevated": 23.5,
          "hypertension_stage1": 29.4,
          "hypertension_stage2": 17.7,
          "hypertensive_crisis": 0
        },
        "total_readings": 85
      },
      "heart_rate": {
        "ranges": {
          "<60": 5,
          "60-70": 25,
          "70-80": 40,
          "80-90": 20,
          "90-100": 8,
          ">100": 2
        },
        "ranges_percent": {
          "<60": 5,
          "60-70": 25,
          "70-80": 40,
          "80-90": 20,
          "90-100": 8,
          ">100": 2
        },
        "total_readings": 100
      },
      "weight": {
        "changes": {
          "loss": 12,
          "gain": 8,
          "no_change": 5
        },
        "changes_percent": {
          "loss": 48,
          "gain": 32,
          "no_change": 20
        },
        "total_readings": 25
      },
      "timeframe": {
        "start_date": "2023-04-01",
        "end_date": "2023-06-30",
        "days": 90
      }
    }
  }
  ```

### Send Message to Chatbot

- **Endpoint:** `POST /chat/message`
- **Description:** Send a message to the chatbot and get a response powered by Perplexity AI
- **Auth Required:** Yes
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | message | string | Yes | User's message to the chatbot |
  | session_id | integer | No | Existing chat session ID (will create new session if missing) |

- **Example Request:**
  ```json
  {
    "message": "What is the glycemic index?",
    "session_id": 5
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "session_id": 5,
      "message": "The glycemic index (GI) is a measurement system that ranks foods containing carbohydrates according to their effect on blood glucose levels...",
      "sources": [
        {
          "id": 2,
          "title": "Glycemic Index and Diabetes",
          "url": "https://www.diabetes.org/glycemic-index-and-diabetes",
          "category": "nutrition"
        }
      ],
      "context_data": {
        "model": "sonar",
        "tokens": {
          "prompt": 420,
          "completion": 156,
          "total": 576
        }
      }
    }
  }
  ```

### Get Chat Sessions

- **Endpoint:** `GET /chat/sessions`
- **Description:** Get list of user's chat sessions
- **Auth Required:** Yes
- **Response:**
  ```json
  {
    "error": false,
    "data": [
      {
        "id": 5,
        "title": "What is the glycemic index?",
        "summary": null,
        "created_at": "2023-04-01 10:30:15",
        "updated_at": "2023-04-01 10:35:22",
        "last_message": {
          "message": "The glycemic index (GI) is a measurement system...",
          "sender_type": "bot",
          "created_at": "2023-04-01 10:35:22"
        }
      }
    ]
  }
  ```

### Create Chat Session

- **Endpoint:** `POST /chat/sessions`
- **Description:** Create a new chat session
- **Auth Required:** Yes
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | title | string | No | Custom title for the session (defaults to "New Conversation") |
  | summary | string | No | Optional summary for the session |

- **Example Request:**
  ```json
  {
    "title": "My Health Questions",
    "summary": "Session about general diabetes management"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Chat session created successfully",
    "data": {
      "id": 6,
      "title": "My Health Questions",
      "summary": "Session about general diabetes management",
      "created_at": "2023-04-02 14:25:10",
      "updated_at": "2023-04-02 14:25:10"
    }
  }
  ```

### Get Chat Session Details

- **Endpoint:** `GET /chat/sessions/{id}`
- **Description:** Get detailed information about a specific chat session
- **Auth Required:** Yes
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Chat session ID |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "id": 5,
      "title": "What is the glycemic index?",
      "summary": null,
      "created_at": "2023-04-01 10:30:15",
      "updated_at": "2023-04-01 10:35:22",
      "messages": [
        {
          "id": 10,
          "sender_type": "user",
          "message": "What is the glycemic index?",
          "created_at": "2023-04-01 10:30:15"
        },
        {
          "id": 11,
          "sender_type": "bot",
          "message": "The glycemic index (GI) is a measurement system...",
          "created_at": "2023-04-01 10:30:20"
        }
      ]
    }
  }
  ```

### Update Chat Session

- **Endpoint:** `PUT /chat/sessions/{id}`
- **Description:** Update an existing chat session's title or summary
- **Auth Required:** Yes
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Chat session ID |

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | title | string | No | New title for the session |
  | summary | string | No | New summary for the session |

- **Example Request:**
  ```json
  {
    "title": "Discussion about Glycemic Index",
    "summary": "Learning about GI and its impact on blood sugar"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Chat session updated successfully",
    "data": {
      "id": 5,
      "title": "Discussion about Glycemic Index",
      "summary": "Learning about GI and its impact on blood sugar",
      "updated_at": "2023-04-01 11:42:30"
    }
  }
  ```

### Delete Chat Session

- **Endpoint:** `DELETE /chat/sessions/{id}`
- **Description:** Delete a chat session and its messages
- **Auth Required:** Yes
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Chat session ID |

- **Response:**
  ```json
  {
    "error": false,
    "message": "Chat session deleted successfully"
  }
  ```

### Get Resources by Category

- **Endpoint:** `GET /resources/{category}`
- **Description:** Get resources for a specific category
- **Auth Required:** Yes
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | category | string | Yes | Resource category (nutrition, treatment, management, exercise, complications) |

- **Response:**
  ```json
  {
    "error": false,
    "data": [
      {
        "id": 1,
        "title": "Diabetes Meal Planning",
        "description": "Guidelines for creating healthy meal plans...",
        "url": "https://www.diabetes.org/nutrition",
        "category": "nutrition",
        "type": "article",
        "tags": ["meal planning", "diet", "carbohydrates"],
        "created_at": "2023-04-01 10:30:15",
        "updated_at": "2023-04-01 10:30:15"
      }
    ]
  }
  ```

### Save Resource

- **Endpoint:** `POST /resources/save`
- **Description:** Submit a new resource (will require approval)
- **Auth Required:** Yes
- **Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | title | string | Yes | Resource title |
  | description | string | Yes | Resource description |
  | url | string | No | URL to the resource |
  | category | string | Yes | Resource category |
  | type | string | No | Resource type (article, guide, etc.) |
  | tags | array | No | Array of tags |

- **Example Request:**
  ```json
  {
    "title": "Understanding Insulin Resistance",
    "description": "Detailed guide on insulin resistance, its causes, and management.",
    "url": "https://example.com/insulin-resistance",
    "category": "treatment",
    "type": "guide",
    "tags": ["insulin", "resistance", "type2"]
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Resource submitted successfully and is pending approval",
    "data": {
      "id": 15
    }
  }
  ```

## Admin Panel Endpoints

These endpoints require both JWT authentication and admin access privileges.

### Get Admin Dashboard

- **Endpoint:** `GET /api/admin/dashboard`
- **Description:** Get an overview of system statistics for the admin dashboard
- **Auth Required:** Yes (Admin only)
- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "total_users": 150,
      "recent_registrations": 23,
      "total_resources": 45,
      "pending_resources": 5,
      "total_chat_sessions": 320,
      "total_metrics": 12500
    }
  }
  ```

### Get All Users

- **Endpoint:** `GET /api/admin/users`
- **Description:** Get a list of all users with pagination
- **Auth Required:** Yes (Admin only)
- **Query Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | limit | integer | No | Results per page (default: 50) |
  | page | integer | No | Page number (default: 1) |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "users": [
        {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "created_at": "2023-06-15 10:30:15"
        }
      ],
      "pagination": {
        "total": 150,
        "page": 1,
        "limit": 50,
        "total_pages": 3
      }
    }
  }
  ```

### Get User Details

- **Endpoint:** `GET /api/admin/users/{id}`
- **Description:** Get detailed information about a specific user
- **Auth Required:** Yes (Admin only)
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | User ID |

- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone_number": "+1234567890",
      "date_of_birth": "1985-06-15",
      "gender": "male",
      "created_at": "2023-06-15 10:30:15",
      "is_admin": false,
      "medical_profile": {
        "diabetes_type": "type2",
        "diagnosis_year": 2015
      },
      "metrics_count": 250,
      "chat_sessions_count": 12
    }
  }
  ```

### Update User Role

- **Endpoint:** `PUT /api/admin/users/{id}/role`
- **Description:** Update a user's admin status
- **Auth Required:** Yes (Admin only)
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | User ID |

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | is_admin | boolean | Yes | Whether user should have admin privileges |

- **Example Request:**
  ```json
  {
    "is_admin": true
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "User role updated successfully",
    "data": {
      "id": 1,
      "is_admin": true
    }
  }
  ```

### Get Pending Resources

- **Endpoint:** `GET /api/admin/resources/pending`
- **Description:** Get list of resources pending approval
- **Auth Required:** Yes (Admin only)
- **Response:**
  ```json
  {
    "error": false,
    "data": [
      {
        "id": 15,
        "title": "Understanding Insulin Resistance",
        "description": "Detailed guide on insulin resistance...",
        "url": "https://example.com/insulin-resistance",
        "category": "treatment",
        "type": "guide",
        "tags": ["insulin", "resistance", "type2"],
        "is_approved": false,
        "created_at": "2023-06-20 14:25:10"
      }
    ]
  }
  ```

### Update Resource Status

- **Endpoint:** `PUT /api/admin/resources/{id}/status`
- **Description:** Approve or reject a pending resource
- **Auth Required:** Yes (Admin only)
- **URL Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | id | integer | Yes | Resource ID |

- **Request Parameters:**
  | Parameter | Type | Required | Description |
  |---|---|---|---|
  | action | string | Yes | Action to take: "approve" or "reject" |

- **Example Request:**
  ```json
  {
    "action": "approve"
  }
  ```

- **Response:**
  ```json
  {
    "error": false,
    "message": "Resource approved successfully"
  }
  ```

### Get System Statistics

- **Endpoint:** `GET /api/admin/stats`
- **Description:** Get detailed system statistics for administrative purposes
- **Auth Required:** Yes (Admin only)
- **Response:**
  ```json
  {
    "error": false,
    "data": {
      "total_users": 150,
      "new_users_30d": 25,
      "total_metrics": 12500,
      "new_metrics_30d": 1500,
      "active_users_30d": 85,
      "chat_sessions_30d": 120
    }
  }
  ```

## Gemini AI Integration

DiaX uses Google's Gemini AI to power its chatbot responses. The implementation provides AI-generated responses to user queries while incorporating user-specific medical context and relevant resources from the database.

### How Gemini Integration Works

1. When a user sends a message, the system:
   - Searches for relevant diabetes resources in the database
   - Retrieves the user's medical context (if available)
   - Builds a context-aware prompt for Gemini
   - Sends the prompt along with conversation history to the Gemini API
   - Processes and formats the response for the user

2. The system automatically falls back to friendly default messages if the Gemini API is unavailable.

3. Each response includes:
   - The AI-generated textual response
   - References to relevant resources used to inform the response
   - Session context for conversation continuity

### Gemini Configuration

To use the Gemini integration, configure the following environment variables in your `.env` file:

```
GEMINI_API_KEY=your_api_key_from_google_ai_studio
GEMINI_MODEL=gemini-1.5-flash  # or another Gemini model
```

You can obtain an API key from [Google AI Studio](https://ai.google.dev/).

## Perplexity AI Integration

DiaX uses Perplexity AI to power its chatbot responses. The implementation provides AI-generated responses to user queries while incorporating user-specific medical context and relevant resources from the database.

### How Perplexity Integration Works

1. When a user sends a message, the system:
   - Searches for relevant diabetes resources in the database
   - Retrieves the user's medical context (if available)
   - Builds a context-aware prompt for Perplexity
   - Formats the conversation history and user message for the Perplexity API
   - Sends the request to Perplexity's chat completions endpoint
   - Processes and formats the response for the user

2. The system features robust error handling:
   - Automatic fallback to friendly messages if the API is unavailable
   - Detailed logging for troubleshooting
   - Special debug modes for testing API connectivity
   - Clear error messages for different API failure scenarios

3. Each response includes:
   - The AI-generated textual response
   - References to relevant resources used to inform the response
   - Session context and token usage information

### Special Debug Keywords

The chatbot supports special diagnostic keywords:
- Send "test" to receive a fixed response confirming the API configuration
- Send "debug" to get detailed information about the API setup

### Perplexity Configuration

To use the Perplexity integration, configure the following environment variables in your `.env` file:

```
PERPLEXITY_API_KEY=your_api_key_from_perplexity
PERPLEXITY_MODEL=sonar  # or another available Perplexity model
```

You can obtain an API key from [Perplexity](https://www.perplexity.ai/).

### Troubleshooting

If you encounter issues with the Perplexity integration:
1. Check the API key format - it should be in the format "pplx-xxxxxxxx"
2. Verify the model name is correct (e.g., "sonar", "mistral-7b-instruct")
3. Visit the debug page at `/debug.php` to run a direct API test
4. Review application logs for detailed error information

4. **Chatbot Integration Issues**
   - If receiving generic responses from the chatbot, check the debug logs
   - Try sending "debug" as a chat message to get diagnostic information
   - Verify that your Perplexity API key is correctly configured in .env
   - Note that Perplexity requires strictly alternating user/assistant messages after the system message

### Perplexity API Message Format Requirements

When using the chatbot, be aware that the Perplexity API enforces specific message formatting rules:

1. **Strict Alternation**: After the system message, user and assistant messages must strictly alternate.
   - Valid sequence: `[system, user, assistant, user, assistant]`
   - Invalid sequence: `[system, user, user, assistant]`

2. **Role Mapping**: 
   - The API only accepts three role types: "system", "user", and "assistant"
   - Any message with role "bot" is automatically mapped to "assistant"
   - Other role types are mapped to "user" by default

3. **Message Processing**:
   - If consecutive messages from the same role are detected, they are automatically combined
   - Empty messages are filtered out
   - Multiple user messages are concatenated with line breaks to maintain the alternating pattern

The application handles these requirements automatically, but they may be relevant when troubleshooting or developing custom integrations.

### Debugging Tools

1. **Debug Endpoint**
   - Access `/debug.php` to test direct connectivity to the Perplexity API
   - This page provides detailed diagnostic information about your environment and API configuration

2. **Special Chat Commands**
   - Send "test" as a chat message to get a static response that verifies connectivity
   - Send "debug" to see configuration and API settings

3. **Server Logs**
   - Check application logs in the `logs/app.log` file for detailed error information
   - PHP errors will be logged to the server's error log if app-level logging fails 

## HTTP Status Codes

- **200 OK**: The request has succeeded
- **201 Created**: The request has succeeded and has led to the creation of a resource
- **400 Bad Request**: The server cannot process the request due to an apparent client error
- **401 Unauthorized**: Authentication is required and has failed or has not yet been provided
- **404 Not Found**: The requested resource could not be found
- **500 Internal Server Error**: The server encountered an unexpected condition 

## Troubleshooting

### Common Issues and Solutions

1. **404 Not Found Errors**
   - Check that you're using the correct API endpoint URL
   - Verify that you're including the `/api` prefix in all requests
   - Ensure that your URL doesn't have double slashes or trailing slashes

2. **401 Unauthorized Errors**
   - Verify that you're including a valid JWT token in the Authorization header
   - Check that your token hasn't expired (tokens expire after 1 hour by default)
   - Make sure you're using the correct format: `Authorization: Bearer YOUR_TOKEN`

3. **CORS Issues**
   - The API supports cross-origin requests from any domain
   - If experiencing CORS issues, ensure your frontend correctly sets the `Content-Type` and `Authorization` headers
   - For preflight requests, the API automatically handles OPTIONS requests

4. **Chatbot Integration Issues**
   - If receiving generic responses from the chatbot, check the debug logs
   - Try sending "debug" as a chat message to get diagnostic information
   - Verify that your Perplexity API key is correctly configured in .env
   - Note that Perplexity requires strictly alternating user/assistant messages after the system message

### Debugging Tools

1. **Debug Endpoint**
   - Access `/debug.php` to test direct connectivity to the Perplexity API
   - This page provides detailed diagnostic information about your environment and API configuration

2. **Special Chat Commands**
   - Send "test" as a chat message to get a static response that verifies connectivity
   - Send "debug" to see configuration and API settings

3. **Server Logs**
   - Check application logs in the `logs/app.log` file for detailed error information
   - PHP errors will be logged to the server's error log if app-level logging fails 

# Security Features

The DiaX API implements several security features to protect user data and prevent unauthorized access:

## Authentication Security

### JWT Token Security
- **Token Fingerprinting**: Each token is fingerprinted with the user's IP address and user agent to prevent token theft and session hijacking
- **Token Expiration**: Tokens automatically expire after a configurable time period (default: 1 hour)
- **JWT IDs**: Each token contains a unique identifier (jti claim) to prevent token replays
- **Issuer & Audience Validation**: Tokens are validated against the issuer and audience claims
- **Token Revocation**: When a user logs out, their token is added to a blocklist to prevent reuse

### Account Protection
- **Brute Force Protection**: After multiple failed login attempts, accounts are temporarily locked
- **Progressive Lockout**: The lockout duration increases exponentially with repeated failures
- **Consistent Error Messages**: Login errors use consistent messages to prevent user enumeration
- **Login Logging**: All login attempts (successful and failed) are logged with IP and user agent information

## API Security

### Request Rate Limiting
- **Tiered Rate Limiting**: Different rate limits for different endpoint types
- **Authentication Endpoints**: Stricter limits on authentication endpoints (10 requests per 5 minutes)
- **Standard Endpoints**: Standard limits for regular API use (60 requests per minute)
- **Retry Headers**: When limits are exceeded, responses include Retry-After headers

### CORS Protection
- **Origin Restriction**: API restricts allowed origins to specific domains
- **Credentials Support**: Properly handles credentials in cross-origin requests
- **Preflight Handling**: OPTIONS requests are handled with appropriate headers
- **Vary Header**: Includes Vary: Origin header for proper caching

### Other Security Measures
- **Security Headers**: All responses include security headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Referrer-Policy: strict-origin-when-cross-origin
  - Content-Security-Policy: default-src 'self'
  - Strict-Transport-Security: max-age=31536000

- **Input Validation**: All API inputs are validated and sanitized
- **Parameterized Queries**: Database queries use parameterized statements to prevent SQL injection
- **HTTPS Only**: All API communication should use HTTPS in production

## Email System

The DiaX API includes a comprehensive email system that sends automated transactional emails to users during various interactions with the API.

## Email Functionality

The API sends several types of automated emails:

- **Verification Emails**: Sent when a new user registers to verify their email address
- **Welcome Emails**: Sent after a user successfully verifies their email
- **Password Reset Emails**: Sent when a user requests a password reset
- **Reset Confirmation Emails**: Sent after a successful password reset

## Email Configuration

To configure the email system, add the following environment variables to your `.env` file:

```
# Email Settings
MAIL_PROVIDER=smtp
MAIL_FROM_NAME=DiaX
MAIL_FROM_EMAIL=noreply@diax.app

# SendGrid Mail Settings (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# Mailgun Mail Settings (if using Mailgun)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain.com

# SMTP Mail Settings (if using SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password

# Frontend URL (used for links in emails)
FRONTEND_URL=https://your-frontend-url.com
```

### Email Providers

The system supports multiple email providers:

1. **SMTP** - Uses a configured mail server
2. **PHP Mail** - Uses PHP's mail() function
3. **SendGrid** - Uses the SendGrid API
4. **Mailgun** - Uses the Mailgun API

If a configured provider fails, the system automatically falls back to PHP mail().

## Email Templates

Email templates are located in the `templates/emails` directory:

- `verify_email.html` - Sent after registration for email verification
- `welcome.html` - Sent after successful email verification
- `password_reset.html` - Sent when a user requests a password reset
- `password_reset_confirmation.html` - Sent after a password reset

### Email Verification Process

1. When a user registers, a secure verification token is generated and stored as a hash in the database
2. A verification email is sent containing a link with this token
3. The link directs the user to the frontend, which then calls the API's verification endpoint
4. When verified, the user's account is marked as verified and a welcome email is sent

### Template Variables

Each email template supports variables that are replaced at runtime:

- **Verification Email**: `{{name}}`, `{{verification_url}}`, `{{current_year}}`, `{{appName}}`
- **Welcome Email**: `{{name}}`, `{{appName}}`, `{{year}}`
- **Password Reset**: `{{resetUrl}}`, `{{token}}`, `{{expiryHours}}`, `{{appName}}`, `{{year}}`
- **Reset Confirmation**: `{{loginUrl}}`, `{{appName}}`, `{{year}}`

## Development Mode

When running in development mode (`APP_ENV=development`), emails aren't actually sent but are:

1. Logged to the console
2. Saved as HTML files in the `logs/emails` directory

This simplifies testing without sending actual emails during development.

## Security Features

The email system includes several security features:

- **Secure Tokens**: Both email verification and password reset use cryptographically secure tokens
- **Token Hashing**: Only hashed versions of tokens are stored in the database
- **Token Expiration**: Verification tokens expire after 24 hours, reset tokens after 1 hour
- **Anti-Enumeration**: Generic response messages prevent user email enumeration
- **Spam Prevention**: Email templates follow best practices for deliverability