#!/usr/bin/env node

/**
 * Translation Generator Script
 * 
 * This script helps generate new translation files by:
 * 1. Creating a new language file based on English template
 * 2. Adding the language to the language names mapping
 * 3. Updating the language contribution guide
 * 
 * Usage: node scripts/generate-translation.js <language-code> <language-name>
 * Example: node scripts/generate-translation.js nl "Nederlands"
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const languageCode = args[0];
const languageName = args[1];

if (!languageCode || !languageName) {
  console.error('Usage: node scripts/generate-translation.js <language-code> <language-name>');
  console.error('Example: node scripts/generate-translation.js nl "Nederlands"');
  process.exit(1);
}

// Validate language code format (ISO 639-1)
if (!/^[a-z]{2}$/.test(languageCode)) {
  console.error('Error: Language code must be a 2-letter ISO 639-1 code (e.g., "en", "es", "fr")');
  process.exit(1);
}

const translationsDir = path.join(__dirname, '..', 'src', 'lib', 'translations');
const englishFile = path.join(translationsDir, 'en.json');
const newLanguageFile = path.join(translationsDir, `${languageCode}.json`);

// Check if language file already exists
if (fs.existsSync(newLanguageFile)) {
  console.error(`Error: Translation file for ${languageCode} already exists: ${newLanguageFile}`);
  process.exit(1);
}

// Read English template
if (!fs.existsSync(englishFile)) {
  console.error(`Error: English template file not found: ${englishFile}`);
  process.exit(1);
}

try {
  const englishTemplate = JSON.parse(fs.readFileSync(englishFile, 'utf8'));
  
  // Create new language file with English template
  fs.writeFileSync(newLanguageFile, JSON.stringify(englishTemplate, null, 2));
  
  console.log(`✅ Created translation file: ${newLanguageFile}`);
  console.log(`📝 Please edit the file and translate the English text to ${languageName}`);
  
  // Update language contribution guide
  updateLanguageGuide(languageCode, languageName);
  
  console.log(`\n🎉 Translation setup complete for ${languageName} (${languageCode})!`);
  console.log(`\nNext steps:`);
  console.log(`1. Edit ${newLanguageFile} and translate all text to ${languageName}`);
  console.log(`2. Test the translation by switching languages in the app`);
  console.log(`3. Submit a pull request with your translation`);
  
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}

function updateLanguageGuide(langCode, langName) {
  const guidePath = path.join(__dirname, '..', 'docs', 'LANGUAGE_CONTRIBUTION.md');
  
  if (!fs.existsSync(guidePath)) {
    console.warn('Warning: Language contribution guide not found, skipping update');
    return;
  }
  
  try {
    let guideContent = fs.readFileSync(guidePath, 'utf8');
    
    // Add to language codes section
    const languageCodesSection = `- \`${langCode}\` - ${langName}`;
    const insertPoint = guideContent.indexOf('- `hi` - हिन्दी');
    
    if (insertPoint !== -1) {
      const beforeInsert = guideContent.substring(0, insertPoint);
      const afterInsert = guideContent.substring(insertPoint);
      guideContent = beforeInsert + languageCodesSection + '\n' + afterInsert;
    }
    
    // Add to supported languages table
    const tableRow = `| \`${langCode}\` | ${langName} | ${langName} | ✅ Complete |`;
    const tableInsertPoint = guideContent.indexOf('| `hi` | Hindi | हिन्दी | ✅ Complete |');
    
    if (tableInsertPoint !== -1) {
      const beforeTable = guideContent.substring(0, tableInsertPoint);
      const afterTable = guideContent.substring(tableInsertPoint);
      guideContent = beforeTable + tableRow + '\n' + afterTable;
    }
    
    // Add to file structure
    const fileStructureRow = `├── ${langCode}.json          # ${langName}`;
    const structureInsertPoint = guideContent.indexOf('└── hi.json          # Hindi');
    
    if (structureInsertPoint !== -1) {
      const beforeStructure = guideContent.substring(0, structureInsertPoint);
      const afterStructure = guideContent.substring(structureInsertPoint);
      guideContent = beforeStructure + fileStructureRow + '\n' + afterStructure;
    }
    
    fs.writeFileSync(guidePath, guideContent);
    console.log(`📚 Updated language contribution guide`);
    
  } catch (error) {
    console.warn('Warning: Could not update language contribution guide:', error.message);
  }
} 