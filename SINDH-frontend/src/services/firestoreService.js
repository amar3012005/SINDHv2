
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';

/**
 * Fetch all active jobs with real-time updates
 * @param {function} callback - Function to handle the jobs data
 */
export const listenToJobs = (callback) => {
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'open'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const jobs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(jobs);
  }, (error) => {
    console.error("Error listening to jobs:", error);
  });
};

/**
 * Apply for a job
 * @param {string} workerId 
 * @param {string} jobId 
 * @param {object} applicationData 
 */
export const applyToJob = async (workerId, jobId, applicationData) => {
  try {
    const docRef = await addDoc(collection(db, 'applications'), {
      workerId,
      jobId,
      ...applicationData,
      status: 'pending',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error applying to job:", error);
    throw error;
  }
};

/**
 * Get all applications for a specific worker
 * @param {string} workerId 
 */
export const getWorkerApplications = async (workerId) => {
  try {
    const q = query(
      collection(db, 'applications'),
      where('workerId', '==', workerId),
      orderBy('appliedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching worker applications:", error);
    throw error;
  }
};

/**
 * Get all jobs posted by an employer
 * @param {string} employerId 
 */
export const getEmployerJobs = async (employerId) => {
  try {
    const q = query(
      collection(db, 'jobs'),
      where('employerId', '==', employerId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    throw error;
  }
};

/**
 * Update user profile (worker or employer)
 * @param {string} userId 
 * @param {object} profileData 
 */
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};



