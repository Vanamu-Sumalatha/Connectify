const fs = require('fs');
const path = require('path');

// Path to the node_modules/.vite directory
const viteCachePath = path.join(__dirname, 'node_modules', '.vite');

// Check if the directory exists
if (fs.existsSync(viteCachePath)) {
  console.log('Clearing Vite cache...');
  
  // Delete the directory
  fs.rmSync(viteCachePath, { recursive: true, force: true });
  
  console.log('Vite cache cleared successfully!');
} else {
  console.log('No Vite cache found.');
}

// Optional: Remove any browserlist cache
const browserlistCachePath = path.join(__dirname, 'node_modules', '.cache');
if (fs.existsSync(browserlistCachePath)) {
  console.log('Clearing browserlist cache...');
  fs.rmSync(browserlistCachePath, { recursive: true, force: true });
  console.log('Browserlist cache cleared successfully!');
} 