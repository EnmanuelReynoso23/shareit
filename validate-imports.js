#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function findJSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !['node_modules', '.git', '.expo', 'dist', 'build'].includes(file)) {
      findJSFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function extractImports(content) {
  const importRegex = /import\s+.*?\s+from\s+['"](\.\.?\/[^'"]*)['"]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

function validateImports() {
  log('blue', '🔍 Validating all imports...\n');
  
  const jsFiles = findJSFiles('./src');
  let totalErrors = 0;
  let totalImports = 0;
  
  jsFiles.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = extractImports(content);
    
    if (imports.length === 0) return;
    
    const fileDir = path.dirname(filePath);
    let fileHasErrors = false;
    
    imports.forEach(importPath => {
      totalImports++;
      
      // Resolve the import path
      let resolvedPath = path.resolve(fileDir, importPath);
      
      // Check if it's a file (with extension) or directory
      let exists = false;
      
      // Try as is
      if (fs.existsSync(resolvedPath)) {
        exists = true;
      }
      // Try with .js extension
      else if (fs.existsSync(resolvedPath + '.js')) {
        exists = true;
      }
      // Try with .jsx extension
      else if (fs.existsSync(resolvedPath + '.jsx')) {
        exists = true;
      }
      // Try as directory with index.js
      else if (fs.existsSync(path.join(resolvedPath, 'index.js'))) {
        exists = true;
      }
      
      if (!exists) {
        if (!fileHasErrors) {
          log('red', `❌ ${filePath}:`);
          fileHasErrors = true;
        }
        log('red', `   Missing: ${importPath}`);
        totalErrors++;
      }
    });
  });
  
  log('blue', '\n📊 Validation Summary:');
  log('blue', `   Total imports checked: ${totalImports}`);
  
  if (totalErrors === 0) {
    log('green', `   ✅ All imports are valid!`);
    return true;
  } else {
    log('red', `   ❌ Found ${totalErrors} broken imports`);
    return false;
  }
}

function checkPackageJson() {
  log('blue', '\n📦 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    
    const requiredDeps = [
      '@react-navigation/native',
      '@react-navigation/bottom-tabs',
      '@react-navigation/stack',
      '@reduxjs/toolkit',
      'react-redux',
      'expo',
      'react',
      'react-native'
    ];
    
    const missing = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missing.length === 0) {
      log('green', '   ✅ All required dependencies are present');
      return true;
    } else {
      log('red', `   ❌ Missing dependencies: ${missing.join(', ')}`);
      return false;
    }
  } catch (error) {
    log('red', `   ❌ Error reading package.json: ${error.message}`);
    return false;
  }
}

function checkCriticalFiles() {
  log('blue', '\n📁 Checking critical files...');
  
  const criticalFiles = [
    './App.js',
    './index.js',
    './src/navigation/MainNavigator.js',
    './src/store/index.js',
    './src/screens/main/HomeScreen.js',
    './src/screens/main/GalleryScreen.js',
    './src/screens/main/CameraScreen.js',
    './src/screens/main/ProfileScreen.js'
  ];
  
  let allExist = true;
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      log('green', `   ✅ ${file}`);
    } else {
      log('red', `   ❌ ${file} - Missing!`);
      allExist = false;
    }
  });
  
  return allExist;
}

function main() {
  log('blue', '🚀 ShareIt Import Validator\n');
  log('blue', '='.repeat(50));
  
  const importsValid = validateImports();
  const packageValid = checkPackageJson();
  const filesValid = checkCriticalFiles();
  
  log('blue', '\n' + '='.repeat(50));
  
  if (importsValid && packageValid && filesValid) {
    log('green', '🎉 All validations passed! The app should start without bundling errors.');
    process.exit(0);
  } else {
    log('red', '💥 Validation failed! Please fix the errors above before starting the app.');
    process.exit(1);
  }
}

// Run the validation
main();
