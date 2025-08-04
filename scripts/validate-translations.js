#!/usr/bin/env node

/**
 * Translation Validation Script
 * 
 * This script validates translation files by:
 * 1. Checking for missing translation keys
 * 2. Validating JSON syntax
 * 3. Ensuring all languages have the same structure
 * 4. Reporting translation coverage
 * 
 * Usage: node scripts/validate-translations.js
 */

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, '..', 'src', 'lib', 'translations');
const configPath = path.join(__dirname, '..', 'src', 'lib', 'translations', 'config.ts');

// Load language configuration
function loadLanguageConfig() {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    // Extract LANGUAGES object using regex (simplified approach)
    const languagesMatch = configContent.match(/LANGUAGES:\s*Record<string,\s*LanguageConfig>\s*=\s*{([^}]+)}/s);
    if (languagesMatch) {
      const languages = {};
      const lines = languagesMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/(\w+):\s*{/);
        if (match) {
          languages[match[1]] = true;
        }
      }
      return languages;
    }
  } catch (error) {
    console.warn('Could not load language config, using file system detection');
  }
  return null;
}

// Get all translation files
function getTranslationFiles() {
  const files = fs.readdirSync(translationsDir);
  return files.filter(file => file.endsWith('.json'));
}

// Load and parse JSON file
function loadTranslationFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { error: error.message };
  }
}

// Get all keys from a nested object
function getAllKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// Validate translations
function validateTranslations() {
  console.log('🔍 Validating translation files...\n');
  
  const translationFiles = getTranslationFiles();
  const languageConfig = loadLanguageConfig();
  
  if (translationFiles.length === 0) {
    console.error('❌ No translation files found');
    return false;
  }
  
  // Load English as reference
  const englishFile = path.join(translationsDir, 'en.json');
  const englishTranslations = loadTranslationFile(englishFile);
  
  if (englishTranslations.error) {
    console.error(`❌ Error loading English translations: ${englishTranslations.error}`);
    return false;
  }
  
  const referenceKeys = getAllKeys(englishTranslations);
  console.log(`📋 Reference keys (from en.json): ${referenceKeys.length} keys`);
  
  const results = {
    total: translationFiles.length,
    valid: 0,
    invalid: 0,
    missingKeys: {},
    coverage: {},
  };
  
  // Validate each translation file
  for (const file of translationFiles) {
    const language = file.replace('.json', '');
    const filePath = path.join(translationsDir, file);
    const translations = loadTranslationFile(filePath);
    
    console.log(`\n🌐 Checking ${language} (${file})...`);
    
    if (translations.error) {
      console.error(`  ❌ JSON Error: ${translations.error}`);
      results.invalid++;
      continue;
    }
    
    const currentKeys = getAllKeys(translations);
    const missingKeys = referenceKeys.filter(key => !currentKeys.includes(key));
    const extraKeys = currentKeys.filter(key => !referenceKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.log(`  ⚠️  Missing keys: ${missingKeys.length}`);
      results.missingKeys[language] = missingKeys;
    }
    
    if (extraKeys.length > 0) {
      console.log(`  ⚠️  Extra keys: ${extraKeys.length}`);
    }
    
    const coverage = ((referenceKeys.length - missingKeys.length) / referenceKeys.length * 100).toFixed(1);
    results.coverage[language] = coverage;
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`  ✅ Valid (${coverage}% coverage)`);
      results.valid++;
    } else {
      console.log(`  ⚠️  Issues found (${coverage}% coverage)`);
      results.invalid++;
    }
  }
  
  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`Total files: ${results.total}`);
  console.log(`Valid: ${results.valid}`);
  console.log(`Invalid: ${results.invalid}`);
  
  console.log('\n📈 Coverage Report:');
  Object.entries(results.coverage)
    .sort(([,a], [,b]) => parseFloat(b) - parseFloat(a))
    .forEach(([lang, coverage]) => {
      const status = parseFloat(coverage) === 100 ? '✅' : '⚠️';
      console.log(`${status} ${lang}: ${coverage}%`);
    });
  
  // Missing keys report
  if (Object.keys(results.missingKeys).length > 0) {
    console.log('\n🔍 Missing Keys Report:');
    Object.entries(results.missingKeys).forEach(([lang, keys]) => {
      console.log(`\n${lang}:`);
      keys.forEach(key => console.log(`  - ${key}`));
    });
  }
  
  // Check against language config
  if (languageConfig) {
    console.log('\n🔧 Language Configuration Check:');
    const configLanguages = Object.keys(languageConfig);
    const fileLanguages = translationFiles.map(f => f.replace('.json', ''));
    
    const missingInConfig = fileLanguages.filter(lang => !configLanguages.includes(lang));
    const missingInFiles = configLanguages.filter(lang => !fileLanguages.includes(lang));
    
    if (missingInConfig.length > 0) {
      console.log(`⚠️  Languages in files but not in config: ${missingInConfig.join(', ')}`);
    }
    
    if (missingInFiles.length > 0) {
      console.log(`⚠️  Languages in config but no files: ${missingInFiles.join(', ')}`);
    }
    
    if (missingInConfig.length === 0 && missingInFiles.length === 0) {
      console.log('✅ Language configuration matches translation files');
    }
  }
  
  return results.invalid === 0;
}

// Run validation
if (require.main === module) {
  const success = validateTranslations();
  process.exit(success ? 0 : 1);
}

module.exports = { validateTranslations }; 