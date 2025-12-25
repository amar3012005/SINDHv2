# Distance & Payment Implementation Plan

## Overview
Implement real distance tracking and payment flow when accepting applicants.

## Features to Implement

### 1. ✅ Distance Field (Already Exists)
- `JobApplication.distanceFromWork` field already exists in schema
- Need to calculate and save it when applying

### 2. 🔨 Calculate Distance on Apply
**Location:** `jobApplicationRoutes.js` - POST `/apply`

**Logic:**
```javascript
// Get worker location from Worker document
const worker = await Worker.findById(workerId);
const workerLoc = worker.location; // { lat, lng }

// Get job location 
const jobLoc = job.location; // { lat, lng }

// Calculate distance using Haversine formula
const distance = calculateDistance(workerLoc, jobLoc);

// Save in application
application.distanceFromWork = distance;
```

### 3. 🔨 Show Real Distance in PostedJobs
**Location:** `PostedJobs.jsx`

**Current:** Uses `Math.floor(Math.random() * 10 + 1)`  
**Update to:** `app.distanceFromWork`

### 4. 🔨 Payment Flow on Accept
**When employer clicks Accept:**

1. Show payment modal with base amount
2. Simulate payment (for now)
3. On success:
   - Update application status to 'accepted'
   - Set `baseAmountPaid = true`
   - Set `baseAmountPaidAt = Date.now()`
   - Save transaction details
4. Show success message
5. Update UI to show "✓ Accepted"

### 5. 🔨 Replace Applicants List with Status
**After accepting (and payment):**

Instead of showing applicants list, show:
- Application status progress (like MyApplications)
- Applied → Accepted → Working → Completed
- Payment status
- Action buttons based on status

---

## Implementation Steps

### Step 1: Add Distance Calculation Utility
Create `utils/distance.js`:
```javascript
function calculateDistance(loc1, loc2) {
  const R = 6371; // Earth radius in km
  const dLat = toRad(loc2.lat - loc1.lat);
  const dLon = toRad(loc2.lng - loc1.lng);
  // Haversine formula
  // Return distance in km
}
```

### Step 2: Update Apply Endpoint
In `jobApplicationRoutes.js`:
```javascript
// Get worker to access location
const worker = await Worker.findById(workerId);

// Calculate distance
const distance = calculateDistance(
  worker.location,
  job.location
);

// Save in application
newApplication.distanceFromWork = distance;
```

### Step 3: Update PostedJobs Frontend
```javascript
// Instead of:
~{Math.floor(Math.random() * 10 + 1)}km

// Use:
~{app.distanceFromWork || 0}km
```

### Step 4: Add Payment Modal
Create payment component:
```javascript
<PaymentModal
  amount={job.baseAmount}
  onSuccess={() => {
    handleAcceptApplicant(appId);
  }}
  onCancel={() => {
    setShowPayment(false);
  }}
/>
```

### Step 5: Update Accept Handler
```javascript
const handleAcceptApplicant = async (applicationId) => {
  // Show payment modal first
  setSelectedApp(applicationId);
  setShowPaymentModal(true);
};

const handlePaymentSuccess = async (applicationId) => {
  // Call PATCH with payment info
  await fetch(`/job-applications/${applicationId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'accepted',
      baseAmountPaid: true,
      baseAmountPaidAt: new Date(),
      basePaymentDetails: {
        transactionId: 'DUMMY_' + Date.now(),
        paymentMethod: 'card',
        paidBy: user.id
      }
    })
  });
};
```

### Step 6: Show Application Status
After payment, replace applicants list with status view:
```javascript
{hasAcceptedApplication ? (
  <ApplicationStatus application={acceptedApp} />
) : (
  <ApplicantsList applications={applications} />
)}
```

---

## Files to Modify

### Backend:
1. `/server/src/utils/distance.js` - NEW (distance calculation)
2. `/server/src/routes/jobApplicationRoutes.js` - POST `/apply`
3. `/server/src/routes/jobApplicationRoutes.js` - PATCH `/:id/status`

### Frontend:
1. `/components/employer/PostedJobs.jsx` - Main component
2. `/components/employer/PaymentModal.jsx` - NEW (payment UI)
3. `/components/employer/ApplicationStatus.jsx` - NEW (status display)

---

## Testing Checklist

- [ ] Distance calculated correctly when applying
- [ ] Distance shows in PostedJobs modal
- [ ] Payment modal appears on Accept click
- [ ] Payment simulation works
- [ ] Application marked as accepted after payment
- [ ] Status view replaces applicants list
- [ ] Status progress bar works
- [ ] Revoke still works

---

**Status:** 📋 Planning Complete - Ready for Implementation
