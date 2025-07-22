// Debug script to check MyApplications data and styling
console.log('🔍 Debugging MyApplications component...');

// Check localStorage data
const applicationData = JSON.parse(localStorage.getItem('myApplicationData') || '[]');
const applicationIds = JSON.parse(localStorage.getItem('myApplicationIds') || '[]');
const user = JSON.parse(localStorage.getItem('user') || '{}');

console.log('📊 Current localStorage data:', {
  applicationData: applicationData.length,
  applicationIds: applicationIds.length,
  user: user.id || 'No user'
});

// Check if the component is using the new styling
const checkStyling = () => {
  const cards = document.querySelectorAll('[class*="bg-white rounded-xl shadow-lg"]');
  console.log('🎨 Cards with new styling:', cards.length);
  
  const oldCards = document.querySelectorAll('[class*="bg-white/80 backdrop-blur-md"]');
  console.log('🎨 Cards with old styling:', oldCards.length);
  
  return {
    newStyle: cards.length,
    oldStyle: oldCards.length
  };
};

// Check for invalid data displays
const checkInvalidData = () => {
  const salaryElements = document.querySelectorAll('text:contains("₹0")');
  const dateElements = document.querySelectorAll('text:contains("Invalid Date")');
  const timelineElements = document.querySelectorAll('text:contains("Status Timeline")');
  
  console.log('❌ Invalid data found:', {
    salaryZero: salaryElements.length,
    invalidDates: dateElements.length,
    statusTimeline: timelineElements.length
  });
};

// Run checks after a delay to ensure component is loaded
setTimeout(() => {
  console.log('🔍 Running MyApplications debug checks...');
  const styling = checkStyling();
  checkInvalidData();
  
  console.log('📋 Summary:', {
    localStorageApplications: applicationData.length,
    localStorageIds: applicationIds.length,
    newStyleCards: styling.newStyle,
    oldStyleCards: styling.oldStyle
  });
}, 2000);

// Export for manual testing
window.debugMyApplications = {
  checkStyling,
  checkInvalidData,
  applicationData,
  applicationIds,
  user
};

console.log('🧪 Debug functions ready. Use window.debugMyApplications to access debug tools.'); 