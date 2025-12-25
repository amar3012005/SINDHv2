// Test script to clear localStorage and test greeting page
console.log('Clearing localStorage...');
localStorage.removeItem('hasSeenGreeting');
console.log('localStorage cleared. hasSeenGreeting =', localStorage.getItem('hasSeenGreeting'));

// You can run this in the browser console to test the greeting page
// Or navigate to http://localhost:3000 to see the greeting page 