# Testing the Greeting Page

## To test the greeting page for new users:

1. **Clear localStorage** (to simulate a new user):
   - Open browser console (F12)
   - Run: `localStorage.removeItem('hasSeenGreeting')`
   - Or run the test script: `node test-greeting.js`

2. **Navigate to the app**:
   - Go to `http://localhost:3000`
   - You should see the greeting page with "Namaste!" and the logo

3. **Test the flow**:
   - The greeting should appear with fade-in animations
   - The logo should appear after 1.5 seconds
   - The "I N D U S" text should appear after 2.5 seconds
   - Language selection should appear after 3.5 seconds
   - Click on a language to proceed to the homepage

4. **Debug features**:
   - There's a red "Reset" button in the top-right corner for testing
   - Check browser console for debug logs

## To test the greeting page directly:

1. Open `test-greeting.html` in your browser to see the static version
2. This shows how the greeting page should look

## Expected behavior:

- **New users**: See greeting page → select language → go to homepage
- **Returning users**: Go directly to homepage
- **After language selection**: localStorage is set and user goes to homepage

## Troubleshooting:

If the greeting page doesn't show:
1. Check browser console for errors
2. Verify localStorage is cleared: `localStorage.getItem('hasSeenGreeting')` should return `null`
3. Check that the logo file exists at `src/assets/logo.svg`
4. Ensure all routes are properly configured in `App.jsx` 