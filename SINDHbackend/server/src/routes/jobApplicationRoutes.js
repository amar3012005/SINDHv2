const express = require('express');
const router = express.Router();
const { admin, db } = require('../config/firebase');
const logger = require('../config/logger');
const {
  asyncHandler,
  ValidationError,
  NotFoundError
} = require('../middleware/errorHandler');

const mapApplication = (doc) => ({ ...doc.data(), id: doc.id, _id: doc.id });
const chunkArray = (arr, size = 10) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
};

// Apply for a job (Firestore)
router.post('/apply', asyncHandler(async (req, res) => {
  logger.info('🎯 Job application request received for Firestore');
  const { jobId, workerId, workerDetails } = req.body;

  if (!jobId || !workerId) {
    throw new ValidationError('Job ID and Worker ID are required');
  }

  const jobDoc = await db.collection('jobs').doc(jobId).get();
  if (!jobDoc.exists) {
    throw new NotFoundError('Job not found');
  }
  const job = jobDoc.data();

  const existingAppSnapshot = await db.collection('applications')
    .where('job', '==', jobId)
    .where('worker', '==', workerId)
    .limit(1)
    .get();

  if (!existingAppSnapshot.empty) {
    throw new ValidationError('You have already applied for this job');
  }

  const workerDoc = await db.collection('workers').doc(workerId).get();
  if (!workerDoc.exists) {
    throw new NotFoundError('Worker not found');
  }
  const worker = workerDoc.data();

  const targetId = db.collection('applications').doc().id;
  const applicationData = {
    job: jobId,
    worker: workerId,
    employer: job.employer,
    status: 'applied',
    workerDetails: workerDetails || {},
    workerSnippet: {
      name: worker.name,
      rating: worker.rating?.average || 0,
      phone: worker.phone,
      profilePicture: worker.profilePicture || '',
      preferredCategory: worker.preferredCategory || ''
    },
    jobSnippet: {
      title: job.title,
      salary: job.salary || job.baseAmount || 0,
      location: job.location,
      companyName: job.companyName || ''
    },
    appliedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('applications').doc(targetId).set(applicationData);
  await db.collection('applications').doc(targetId).collection('statusHistory').add({
    status: 'applied',
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    note: 'Application submitted via Firestore'
  });

  db.collection('jobs').doc(jobId).update({
    applicantCount: admin.firestore.FieldValue.increment(1),
    status: 'APPLIED'
  }).catch(err => logger.warn(`⚠️ Failed to update job applicant count in Firestore: ${err.message}`));

  logger.info(`Application saved successfully in Firestore: ${targetId}`);

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    data: { ...applicationData, id: targetId, _id: targetId }
  });
}));

// Get applications by employer ID
router.get('/employer/:employerId', asyncHandler(async (req, res) => {
  const { employerId } = req.params;
  const { status } = req.query;

  logger.info(`Fetching applications from Firestore for employer: ${employerId}`);

  let query = db.collection('applications').where('employer', '==', employerId);
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  const applications = snapshot.docs.map(mapApplication).sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Get applications by job ID
router.get('/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { status } = req.query;

  logger.info(`Fetching applications from Firestore for job: ${jobId}`);

  let query = db.collection('applications').where('job', '==', jobId);
  if (status) {
    query = query.where('status', '==', status);
  }

  const snapshot = await query.get();
  const applications = snapshot.docs.map(mapApplication).sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  res.status(200).json({
    success: true,
    count: applications.length,
    data: applications
  });
}));

// Get a specific application by ID
router.get('/:applicationId', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  logger.info(`Fetching application by ID from Firestore: ${applicationId}`);

  const applicationDoc = await db.collection('applications').doc(applicationId).get();

  if (!applicationDoc.exists) {
    logger.warn(`Application not found: ${applicationId}`);
    throw new NotFoundError('Application not found');
  }

  const application = applicationDoc.data();

  res.json({
    success: true,
    data: {
      ...application,
      id: applicationDoc.id,
      _id: applicationDoc.id
    }
  });
}));

// Get worker's current applications
router.get('/worker/:workerId/current', asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  logger.info(`Fetching current applications from Firestore for worker: ${workerId}`);

  const snapshot = await db.collection('applications')
    .where('worker', '==', workerId)
    .where('status', 'in', ['applied', 'accepted', 'working', 'in-progress', 'APPLIED', 'ACCEPTED', 'WORKING', 'pending'])
    .get();

  const applications = snapshot.docs.map(mapApplication).sort((a, b) => {
    const dateA = a.appliedAt?.toDate ? a.appliedAt.toDate() : new Date(a.appliedAt || 0);
    const dateB = b.appliedAt?.toDate ? b.appliedAt.toDate() : new Date(b.appliedAt || 0);
    return dateB - dateA;
  });

  res.json({
    success: true,
    data: applications,
    count: applications.length
  });
}));

// Get worker's completed applications (Past Jobs)
router.get('/worker/:workerId/completed', asyncHandler(async (req, res) => {
  const { workerId } = req.params;

  logger.info(`Fetching completed applications from Firestore for worker: ${workerId}`);

  const snapshot = await db.collection('applications')
    .where('worker', '==', workerId)
    .where('status', 'in', ['completed', 'paid', 'COMPLETED', 'PAID', 'FINISHED'])
    .get();

  const applications = snapshot.docs.map(mapApplication).sort((a, b) => {
    const dateA = a.updatedAt?.toDate ? a.updatedAt.toDate() : new Date(a.updatedAt || 0);
    const dateB = b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(b.updatedAt || 0);
    return dateB - dateA;
  });

  res.json({
    success: true,
    data: applications,
    count: applications.length
  });
}));

// Enhanced application status update with comprehensive validation and flow management (Firestore)
router.patch('/:applicationId/status', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, transitionReason, updatedBy } = req.body;

  logger.info(`ROBUSTNESS_CHECK: H2 - Entering status update for application ${applicationId}`, { status });

  const validStatuses = ['applied', 'accepted', 'working', 'completed', 'paid', 'finished', 'rejected', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new ValidationError('Invalid status. Must be one of: ' + validStatuses.join(', '));
  }

  const applicationRef = db.collection('applications').doc(applicationId);
  const applicationSnap = await applicationRef.get();
  if (!applicationSnap.exists) {
    throw new NotFoundError('Application not found');
  }
  const currentApplication = applicationSnap.data();
  const currentStatus = currentApplication.status;

  const validTransitions = {
    'applied': ['accepted', 'rejected'],
    'accepted': ['working', 'cancelled'],
    'working': ['completed', 'cancelled'],
    'completed': ['paid'],
    'paid': ['finished'],
    'finished': [],
    'rejected': [],
    'cancelled': []
  };

  if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(status)) {
    throw new ValidationError(`Invalid status transition from ${currentStatus} to ${status}`);
  }

  const updateData = {
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    [`${status}At`]: admin.firestore.FieldValue.serverTimestamp()
  };

  await applicationRef.update(updateData);
  await applicationRef.collection('statusHistory').add({
    status,
    changedAt: admin.firestore.FieldValue.serverTimestamp(),
    previousStatus: currentStatus,
    note: transitionReason || `Status changed from ${currentStatus} to ${status}`,
    updatedBy: updatedBy || 'system'
  });

  const updatedDoc = await applicationRef.get();
  const application = mapApplication(updatedDoc);

  res.json({
    success: true,
    message: `Application ${status} successfully`,
    data: application,
    statusTransition: {
      from: currentStatus,
      to: status,
      timestamp: new Date().toISOString(),
      reason: transitionReason
    }
  });
}));

// Cancel/Delete application
router.delete('/:applicationId', asyncHandler(async (req, res) => {
  const { applicationId } = req.params;

  logger.info(`🗑️ Withdrawing application: ${applicationId}`);

  const applicationSnap = await db.collection('applications').doc(applicationId).get();
  if (!applicationSnap.exists) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }
  const application = applicationSnap.data();

  // Only allow withdrawal for applied/accepted status
  if (!['applied', 'accepted', 'APPLIED', 'ACCEPTED'].includes(application.status)) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel application in current status'
    });
  }

  await db.collection('applications').doc(applicationId).delete();
  logger.info(`✅ Application deleted: ${applicationId}`);

  // Decrement job's applicantCount
  if (application.job) {
    db.collection('jobs').doc(application.job).update({
      applicantCount: admin.firestore.FieldValue.increment(-1)
    }).catch(err => logger.warn(`⚠️ Could not decrement job applicantCount: ${err.message}`));
  }

  res.json({
    success: true,
    message: 'Application withdrawn successfully',
    data: {
      applicationId,
      jobId: application.job,
      workerId: application.worker
    }
  });
}));

module.exports = router;
 
