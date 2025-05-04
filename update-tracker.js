// File: update-tracker.js for BingoCore
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the path to the tracker
const trackerPath = path.join(__dirname, 'bingobetfun-tracker.js');

// Function to update component data
function updateComponentData() {
  // Get current git info
  const lastCommitMessage = execSync('git log -1 --pretty=%B').toString().trim();
  const lastCommitAuthor = execSync('git log -1 --pretty=%an').toString().trim();
  const lastCommitDate = execSync('git log -1 --pretty=%ad').toString().trim();
  
  // Find files changed in last commit
  const filesChanged = execSync('git show --name-only').toString().trim().split('\n');
  
  // Estimate progress (example logic - customize as needed)
  const totalFiles = parseInt(execSync('git ls-files | wc -l').toString());
  const implementedFiles = parseInt(execSync('git ls-files | grep -v "test\\|mock\\|README" | wc -l').toString());
  const progress = Math.round((implementedFiles / totalFiles) * 100);
  
  // Create summary
  const details = `Last commit: "${lastCommitMessage}" by ${lastCommitAuthor} on ${lastCommitDate}. 
  Files changed: ${filesChanged.length}`;
  
  // Execute tracker commands through child process
  execSync(`node ${trackerPath} log BingoCore`, {
    input: `3\n${progress}\n${details}\n`,
    stdio: 'inherit'
  });
  
  console.log(`Updated BingoCore progress to ${progress}%`);
}

// Run the update
updateComponentData();