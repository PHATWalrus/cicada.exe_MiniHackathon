# DiaX API - Diabetes Support Chatbot

This is the backend API for the DiaX.fileish.com chatbot site designed to help people with diabetes.

## Features

- User authentication and management
- Chat session management
- Diabetes-specific information and resources
- Integration with Google's Gemini AI for intelligent responses
- Storage of conversation history
- Personalized recommendations based on user profiles
- Google Authentication integration

## Requirements

- PHP 8.0 or higher
- MySQL 5.7 or higher
- Composer
- Google Gemini API key
- Google OAuth Client ID and Secret

## Installation

1. Clone the repository
2. Install dependencies:
   ```
   composer install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables:
   ```
   cp .env.example .env
   ```
   
   Make sure to update the following in your `.env` file:
   - Database credentials (DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD)
   - JWT_SECRET (for secure token generation)
   - GEMINI_API_KEY (get your API key from [Google AI Studio](https://ai.google.dev/))
   - GEMINI_MODEL (e.g., gemini-1.5-flash, gemini-1.5-pro)
   - Google Authentication credentials (see Google Authentication section below)

4. Set up the database:
   ```
   php setup.php
   ```
   
5. Seed the database with initial resources:
   ```
   php database/seed.php
   ```

6. Start the development server:
   ```
   composer start
   ```

## API Endpoints

For detailed API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get access token
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate token
- `GET /api/auth/google/url` - Get Google OAuth URL for authentication
- `GET /api/auth/google/callback` - Handle Google OAuth callback
- `POST /api/auth/google/signin` - Sign in with Google ID token

### User Management
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/medical-info` - Add or update medical information

### Chatbot
- `POST /api/chat/message` - Send a message to the chatbot
- `GET /api/chat/sessions` - Get user's chat sessions
- `GET /api/chat/sessions/{id}` - Get specific chat session
- `DELETE /api/chat/sessions/{id}` - Delete a chat session

### Resources
- `GET /api/resources` - Get diabetes resources and information
- `GET /api/resources/{category}` - Get resources by category

## Google Authentication Setup

DiaX supports Google Authentication to allow users to sign in with their Google accounts. Here's how to set it up:

1. Create a new project in the [Google Developers Console](https://console.developers.google.com/)
2. Enable the Google OAuth2 API
3. Configure the OAuth consent screen with necessary information
4. Create OAuth 2.0 credentials (Client ID and Client Secret)
5. Set authorized redirect URIs to include your callback URL (e.g., `http://localhost:8000/api/auth/google/callback` for development)
6. Add the following to your `.env` file:
   ```
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
   ```

The Google Authentication feature allows for:
- User sign-up/login using their Google account
- Linking existing accounts with Google
- Direct sign-in from client applications with ID tokens

## Gemini AI Integration

DiaX uses the Google Gemini API to power its intelligent chat responses. Here's how to set it up:

1. Get an API key from [Google AI Studio](https://ai.google.dev/)
2. Add the following to your `.env` file:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
3. The ChatbotService class will automatically use this key to generate responses

The system enhances responses by:
- Providing user medical context to the AI
- Including relevant diabetes resources from the database
- Maintaining conversation history for context

## Architecture

The API follows a layered architecture:

- Controllers: Handle HTTP requests and responses
- Services: Contain business logic
- Models: Data access layer
- Config: Application configuration
- Utils: Helper functions and utilities

## Deployment

### Production Environment Setup

1. Set up a web server (Apache or Nginx) with PHP support
2. Configure the web server to point to the `/public` directory
3. Ensure the `.env` file is properly configured with production settings:
   ```
   APP_ENV=production
   APP_DEBUG=false
   ```
4. Make sure the database is properly configured and migrated
5. Set proper file permissions for security
6. For Google Authentication in production, update your Google OAuth credentials with the production redirect URI

## Troubleshooting

- If you encounter database connection issues, verify your database credentials in the `.env` file
- For JWT token issues, ensure your JWT_SECRET is properly set
- If the Gemini AI integration is not working:
  - Check that your GEMINI_API_KEY is valid and not expired
  - Verify the GEMINI_MODEL parameter is set to a valid model name
  - Look in the application logs for specific API errors
- For Google Authentication issues:
  - Verify your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
  - Ensure the redirect URI in your Google Console matches the one in your .env file
  - Check that the required scopes (email and profile) are enabled

## License

Proprietary - All Rights Reserved 