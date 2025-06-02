// This script will help debug the user context issue in the AvailableJobs component
// Add this to AvailableJobs.jsx for debugging:

console.log('User in AvailableJobs:', JSON.stringify(user, null, 2));
console.log('isLoadingUser:', isLoadingUser);
console.log('localStorage user:', JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2));
