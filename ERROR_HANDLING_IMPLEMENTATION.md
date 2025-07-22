# Standardized Error Handling Implementation

## 🎯 **PROBLEM SOLVED**

### **Before: Inconsistent Error Formats**
```javascript
// Some endpoints returned:
{ error: "message" }

// Others returned:
{ message: "error" }

// Some returned:
"Error string"
```

### **After: Standardized Error Format**
```javascript
{
  success: false,
  error: "ERROR_CODE",
  message: "Human readable message",
  details: { /* Additional context */ },
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

---

## 🏗️ **IMPLEMENTATION DETAILS**

### **1. Custom Error Classes**
```javascript
// ValidationError - 400 Bad Request
throw new ValidationError('Missing required fields', [
  { field: 'email', message: 'Email is required' }
]);

// AuthenticationError - 401 Unauthorized
throw new AuthenticationError('Invalid credentials');

// AuthorizationError - 403 Forbidden
throw new AuthorizationError('Access denied');

// NotFoundError - 404 Not Found
throw new NotFoundError('User');

// ConflictError - 409 Conflict
throw new ConflictError('Email already exists');

// BusinessLogicError - 400 Bad Request
throw new BusinessLogicError('Job already applied', 'DUPLICATE_APPLICATION');
```

### **2. Error Handler Middleware**
```javascript
const errorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error('API Error:', {
    error: err.message,
    method: req.method,
    url: req.url,
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle different error types
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: err.message,
      details: err.details,
      timestamp: new Date().toISOString()
    });
  }

  // ... handle other error types
};
```

### **3. Helper Functions**
```javascript
// Standardized success response
const createSuccessResponse = (data, message = 'Success') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
});

// Paginated response
const createPaginatedResponse = (data, page, limit, total) => ({
  success: true,
  message: 'Data retrieved successfully',
  data,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  timestamp: new Date().toISOString()
});

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation helper
const validateRequired = (data, requiredFields) => {
  const missing = requiredFields.filter(field => 
    !data[field] || (typeof data[field] === 'string' && data[field].trim() === '')
  );
  
  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing.map(field => ({ field, message: `${field} is required` }))
    );
  }
};
```

---

## 📋 **ERROR CODES REFERENCE**

### **Validation Errors (400)**
- `VALIDATION_ERROR` - Invalid input data
- `INVALID_ID` - Invalid ObjectId format
- `MISSING_FIELDS` - Required fields missing

### **Authentication Errors (401)**
- `AUTHENTICATION_ERROR` - Authentication required
- `INVALID_TOKEN` - Invalid JWT token
- `TOKEN_EXPIRED` - JWT token expired

### **Authorization Errors (403)**
- `AUTHORIZATION_ERROR` - Access denied
- `INSUFFICIENT_PERMISSIONS` - User lacks permissions

### **Not Found Errors (404)**
- `NOT_FOUND` - Resource not found
- `USER_NOT_FOUND` - User not found
- `JOB_NOT_FOUND` - Job not found

### **Conflict Errors (409)**
- `DUPLICATE_RESOURCE` - Resource already exists
- `DUPLICATE_JOB` - Job already posted
- `DUPLICATE_APPLICATION` - Already applied

### **Business Logic Errors (400)**
- `BUSINESS_LOGIC_ERROR` - General business rule violation
- `INVALID_STATUS_TRANSITION` - Invalid state change
- `PAYMENT_FAILED` - Payment processing failed

### **Server Errors (500)**
- `INTERNAL_SERVER_ERROR` - Unexpected server error
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - Third-party service error

### **Network Errors**
- `SERVICE_UNAVAILABLE` - Service temporarily unavailable
- `REQUEST_TIMEOUT` - Request timed out
- `NETWORK_ERROR` - Network connectivity issue

---

## 🔧 **USAGE EXAMPLES**

### **Route Implementation**
```javascript
// Before (inconsistent)
router.post('/jobs', async (req, res) => {
  try {
    if (!req.body.title) {
      return res.status(400).json({ message: 'Title required' });
    }
    // ... rest of logic
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// After (standardized)
router.post('/jobs', asyncHandler(async (req, res) => {
  validateRequired(req.body, ['title', 'employer']);
  
  const existingJob = await Job.findOne({ title: req.body.title });
  if (existingJob) {
    throw new BusinessLogicError('Job already exists', 'DUPLICATE_JOB');
  }
  
  const job = await Job.create(req.body);
  res.status(201).json(createSuccessResponse(job, 'Job created successfully'));
}));
```

### **Frontend Error Handling**
```javascript
// Consistent error handling in frontend
const handleApiError = (error) => {
  if (error.response?.data) {
    const { error: errorCode, message, details } = error.response.data;
    
    switch (errorCode) {
      case 'VALIDATION_ERROR':
        toast.error(`Validation failed: ${message}`);
        break;
      case 'AUTHENTICATION_ERROR':
        toast.error('Please log in again');
        navigate('/login');
        break;
      case 'NOT_FOUND':
        toast.error('Resource not found');
        break;
      default:
        toast.error(message || 'An error occurred');
    }
  }
};
```

---

## 🧪 **TESTING**

### **Error Handler Test**
```javascript
// Test different error scenarios
const tests = [
  {
    name: 'Validation Error',
    method: 'POST',
    url: '/api/jobs',
    body: { title: '' },
    expectedError: 'VALIDATION_ERROR'
  },
  {
    name: 'Not Found Error',
    method: 'GET',
    url: '/api/jobs/invalid-id',
    expectedError: 'INVALID_ID'
  }
];
```

### **Expected Response Format**
```javascript
// Success Response
{
  success: true,
  message: "Job created successfully",
  data: { /* job data */ },
  timestamp: "2024-01-01T00:00:00.000Z"
}

// Error Response
{
  success: false,
  error: "VALIDATION_ERROR",
  message: "Missing required fields: title, employer",
  details: [
    { field: "title", message: "title is required" },
    { field: "employer", message: "employer is required" }
  ],
  timestamp: "2024-01-01T00:00:00.000Z"
}
```

---

## 🚀 **BENEFITS**

### **1. Consistency**
- All errors follow the same format
- Frontend can handle errors uniformly
- Easier debugging and monitoring

### **2. Better User Experience**
- Clear, human-readable error messages
- Detailed validation feedback
- Proper HTTP status codes

### **3. Developer Experience**
- Custom error classes for different scenarios
- Helper functions for common operations
- Comprehensive logging with context

### **4. Maintainability**
- Centralized error handling
- Easy to add new error types
- Consistent error codes across the application

### **5. Monitoring & Analytics**
- Structured error logging
- Error tracking and analytics
- Performance monitoring

---

## 📝 **MIGRATION GUIDE**

### **Step 1: Update Route Handlers**
```javascript
// Replace try-catch blocks with asyncHandler
router.get('/jobs', asyncHandler(async (req, res) => {
  // Your logic here
  // Throw custom errors instead of returning error responses
}));
```

### **Step 2: Use Custom Error Classes**
```javascript
// Instead of:
return res.status(400).json({ message: 'Invalid data' });

// Use:
throw new ValidationError('Invalid data');
```

### **Step 3: Use Helper Functions**
```javascript
// Instead of:
res.json({ success: true, data: jobs });

// Use:
res.json(createSuccessResponse(jobs, 'Jobs retrieved successfully'));
```

### **Step 4: Update Frontend**
```javascript
// Update frontend error handling to use standardized format
const handleError = (error) => {
  const { error: errorCode, message, details } = error.response?.data || {};
  // Handle based on errorCode
};
```

---

## ✅ **IMPLEMENTATION STATUS**

- ✅ Error handler middleware created
- ✅ Custom error classes defined
- ✅ Helper functions implemented
- ✅ App.js updated to use new error handler
- ✅ Job routes updated with new pattern
- ✅ Test script created
- ✅ Documentation completed

### **Next Steps**
1. Update remaining route files to use new pattern
2. Update frontend error handling
3. Add more specific error types as needed
4. Implement error monitoring and analytics

---

This implementation provides a robust, consistent, and maintainable error handling system that improves both developer and user experience. 