# Email Verification System

The DiaX API includes a complete email verification system to ensure that user email addresses are valid and accessible by the account owners. This document explains how the verification system works and how to implement it in your frontend.

## How It Works

1. **User Registration**: When a user registers, they receive an email with a verification link.
2. **Email Verification**: The user clicks the verification link, which sends the token to the API.
3. **Account Activation**: The API verifies the token and marks the user's email as verified.

## API Endpoints

### 1. Registration Endpoint

```
POST /api/auth/register
```

**Request Body:**
```json
{
  "name": "User's Name",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "error": false,
  "message": "User registered successfully. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": 123,
      "name": "User's Name",
      "email": "user@example.com",
      "email_verified": false
    },
    "token": "jwt_token_with_limited_permissions"
  }
}
```

**Note**: The JWT token returned after registration has limited permissions until the email is verified.

### 2. Email Verification Endpoint

```
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification_token_from_email_link"
}
```

**Response (Success):**
```json
{
  "error": false,
  "message": "Email verified successfully",
  "data": {
    "user": {
      "id": 123,
      "name": "User's Name",
      "email": "user@example.com",
      "email_verified": true
    },
    "token": "jwt_token_with_full_permissions"
  }
}
```

**Response (Failure):**
```json
{
  "error": true,
  "message": "Invalid or expired verification token"
}
```

### 3. Resend Verification Email Endpoint

```
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "error": false,
  "message": "If your email exists in our system and is not yet verified, a new verification email has been sent."
}
```

## Frontend Implementation

### Verification Page

Create a verification page at `/verify-email` in your frontend application:

```javascript
// Example React component
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EmailVerification() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      return;
    }
    
    // Verify the token
    axios.post('/api/auth/verify-email', { token })
      .then(response => {
        setStatus('success');
        // Store the new token with full permissions
        localStorage.setItem('token', response.data.data.token);
        // Redirect after 3 seconds
        setTimeout(() => navigate('/dashboard'), 3000);
      })
      .catch(error => {
        setStatus('error');
        console.error('Verification failed:', error);
      });
  }, [searchParams, navigate]);
  
  return (
    <div className="verification-container">
      {status === 'verifying' && <p>Verifying your email...</p>}
      {status === 'success' && (
        <div>
          <h1>Email Verified Successfully!</h1>
          <p>Your account is now active. You will be redirected to the dashboard...</p>
        </div>
      )}
      {status === 'error' && (
        <div>
          <h1>Verification Failed</h1>
          <p>The verification link is invalid or has expired.</p>
          <button onClick={() => navigate('/resend-verification')}>
            Request New Verification Link
          </button>
        </div>
      )}
    </div>
  );
}
```

### Resend Verification Form

Create a form to allow users to request a new verification email:

```javascript
import { useState } from 'react';
import axios from 'axios';

function ResendVerification() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    
    try {
      await axios.post('/api/auth/resend-verification', { email });
      setStatus('success');
    } catch (error) {
      setStatus('error');
      console.error('Failed to resend verification:', error);
    }
  };
  
  return (
    <div className="resend-verification">
      <h1>Resend Verification Email</h1>
      
      {status === 'success' && (
        <div className="alert alert-success">
          A new verification email has been sent if your email exists in our system.
          Please check your inbox and spam folder.
        </div>
      )}
      
      {status === 'error' && (
        <div className="alert alert-danger">
          An error occurred. Please try again later.
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={status === 'sending'}
        >
          {status === 'sending' ? 'Sending...' : 'Send Verification Email'}
        </button>
      </form>
    </div>
  );
}
```

## Security Considerations

1. **Token Expiration**: Verification tokens expire after 24 hours.
2. **Token Storage**: Tokens are stored as hashed values in the database.
3. **Rate Limiting**: The verification endpoints have rate limiting to prevent abuse.
4. **User Enumeration Prevention**: The resend endpoint always returns a success message even if the email doesn't exist. 