# 🌍 Language Contribution Guide

Thank you for your interest in contributing to Perplexica's internationalization! This guide will help you add new languages or improve existing translations.

## 📋 Table of Contents

- [Overview](#overview)
- [How to Add a New Language](#how-to-add-a-new-language)
- [Translation Structure](#translation-structure)
- [Language Codes](#language-codes)
- [Contributing Process](#contributing-process)
- [Quality Guidelines](#quality-guidelines)
- [Testing Your Translations](#testing-your-translations)
- [Current Languages](#current-languages)

## Overview

Perplexica uses a modular translation system based on JSON files. All translations are stored in `src/lib/translations/` with separate files for each language. The system supports:

- **12 languages** currently
- **RTL support** (Arabic)
- **Dynamic language switching**
- **Localized UI elements**
- **Modular file structure** for easy maintenance

## How to Add a New Language

### 🚀 Automated Setup (Recommended)

We provide automated tools to make adding new languages easy:

#### Step 1: Generate Translation File

Use our translation generator script:

```bash
node scripts/generate-translation.js <language-code> "<language-name>"
```

**Examples:**
```bash
# Add Dutch
node scripts/generate-translation.js nl "Nederlands"

# Add Swedish
node scripts/generate-translation.js sv "Svenska"

# Add Turkish
node scripts/generate-translation.js tr "Türkçe"
```

This script will:
- ✅ Create a new translation file based on English template
- ✅ Add the language to the configuration
- ✅ Update the language contribution guide
- ✅ Provide next steps

#### Step 2: Translate the Content

Edit the generated file `src/lib/translations/<language-code>.json` and translate all English text to your language.

#### Step 3: Validate Your Translation

Run the validation script to check for any issues:

```bash
node scripts/validate-translations.js
```

This will show:
- ✅ Missing translation keys
- ✅ Translation coverage percentage
- ✅ JSON syntax errors
- ✅ Configuration consistency

### 🔧 Manual Setup (Advanced)

If you prefer manual setup or need to customize the process:

#### Step 1: Choose Your Language Code

Use the standard [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) two-letter language codes:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- `hi` - Hindi

### Step 2: Add Language to Floating Selector

First, add your language to the floating language selector in `src/components/FloatingLanguageSelector.tsx`:

```typescript
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  ja: '日本語',
  ko: '한국어',
  zh: '中文',
  ar: 'العربية',
  hi: 'हिन्दी',
  // Add your language here
  your_lang_code: 'Your Language Name',
};
```

### Step 3: Create Translation File

Create a new JSON file for your language in `src/lib/translations/your_lang_code.json`:

```json
{
  "navigation": {
    "home": "Home",
    "discover": "Discover",
    "library": "Library",
    "settings": "Settings"
  },
  "chat": {
    "typeMessage": "Type your message...",
    "sendMessage": "Send a message",
    "newChat": "New Chat",
    "thinking": "Thinking..."
  },
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "previous": "Previous",
    "search": "Search",
    "clear": "Clear",
    "refresh": "Refresh",
    "copy": "Copy",
    "copied": "Copied!",
    "settings": "Settings",
    "home": "Home",
    "discover": "Discover",
    "library": "Library"
  },
  "settings": {
    "title": "Settings",
    "appearance": "Appearance",
    "language": "Language",
    "theme": "Theme",
    "autoImageSearch": "Auto Image Search",
    "autoVideoSearch": "Auto Video Search",
    "chatModel": "Chat Model",
    "embeddingModel": "Embedding Model",
    "model": "Model"
  }
}
```

### Step 4: Import Your Language

Add your language import to `src/hooks/useTranslation.ts`:

```typescript
// Import all translation files
import en from '@/lib/translations/en.json';
import es from '@/lib/translations/es.json';
// ... other languages
import your_lang_code from '@/lib/translations/your_lang_code.json';

// Available languages
const messages: Record<string, TranslationMessages> = {
  en,
  es,
  // ... other languages
  your_lang_code,
};
```

## Translation Structure

The translation system is organized into logical sections:

### Navigation
```typescript
navigation: {
  home: 'Home',
  discover: 'Discover',
  library: 'Library',
  settings: 'Settings',
}
```

### Chat Interface
```typescript
chat: {
  typeMessage: 'Type your message...',
  sendMessage: 'Send a message',
  newChat: 'New Chat',
  thinking: 'Thinking...',
}
```

### Common Actions
```typescript
common: {
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  previous: 'Previous',
  search: 'Search',
  clear: 'Clear',
  refresh: 'Refresh',
  copy: 'Copy',
  copied: 'Copied!',
  settings: 'Settings',
  home: 'Home',
  discover: 'Discover',
  library: 'Library',
}
```

### Settings
```typescript
settings: {
  title: 'Settings',
  appearance: 'Appearance',
  language: 'Language',
  theme: 'Theme',
  autoImageSearch: 'Auto Image Search',
  autoVideoSearch: 'Auto Video Search',
  chatModel: 'Chat Model',
  embeddingModel: 'Embedding Model',
  model: 'Model',
}
```

## Language Codes

### Supported Languages

| Code | Language | Native Name | Status |
|------|----------|-------------|--------|
| `en` | English | English | ✅ Complete |
| `es` | Spanish | Español | ✅ Complete |
| `fr` | French | Français | ✅ Complete |
| `de` | German | Deutsch | ✅ Complete |
| `it` | Italian | Italiano | ✅ Complete |
| `pt` | Portuguese | Português | ✅ Complete |
| `ru` | Russian | Русский | ✅ Complete |
| `ja` | Japanese | 日本語 | ✅ Complete |
| `ko` | Korean | 한국어 | ✅ Complete |
| `zh` | Chinese | 中文 | ✅ Complete |
| `ar` | Arabic | العربية | ✅ Complete |
| `nl` | Nederlands | Nederlands | ✅ Complete |
| `hi` | Hindi | हिन्दी | ✅ Complete |

### RTL Languages

For right-to-left languages like Arabic, the system automatically handles text direction:

```typescript
// In FloatingLanguageSelector.tsx
if (newLocale === 'ar') {
  document.documentElement.dir = 'rtl';
} else {
  document.documentElement.dir = 'ltr';
}
```

## Contributing Process

### 1. Fork the Repository
```bash
git clone https://github.com/Kamran1819G/Perplexica.git
cd Perplexica
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/add-[language]-translations
```

### 3. Add Your Translations
- Add language to `FloatingLanguageSelector.tsx`
- Create translation file in `src/lib/translations/`
- Import your language in `useTranslation.ts`
- Test your changes locally

### 4. Test Your Changes
```bash
npm run dev
# or
docker-compose up --build
```

### 5. Submit a Pull Request
- Create a PR with a descriptive title
- Include the language code in the title: `Add [Language] translations`
- Provide a brief description of your changes

## Quality Guidelines

### Translation Best Practices

1. **Accuracy**: Ensure translations are accurate and contextually appropriate
2. **Consistency**: Use consistent terminology throughout
3. **Naturalness**: Translations should sound natural to native speakers
4. **Length**: Consider UI space constraints
5. **Cultural Sensitivity**: Be aware of cultural differences

### Technical Requirements

1. **Character Encoding**: Use UTF-8 encoding
2. **Special Characters**: Properly escape special characters if needed
3. **Length Limits**: Keep translations concise for UI elements
4. **Fallbacks**: The system falls back to English if a translation is missing

### Example Good Translation

```typescript
// Good - Natural and concise
settings: {
  title: 'Configuración', // Spanish
  appearance: 'Apariencia',
  language: 'Idioma',
}

// Avoid - Too literal or awkward
settings: {
  title: 'Configuración de Ajustes', // Too long
  appearance: 'Como se ve', // Too informal
  language: 'Lenguaje', // Less common term
}
```

## Testing Your Translations

### Local Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test language switching**:
   - Use the floating language selector
   - Navigate through different pages
   - Check all UI elements

3. **Test RTL languages** (if applicable):
   - Verify text direction changes
   - Check layout adjustments

### Testing Checklist

- [ ] All navigation items translate correctly
- [ ] Chat interface elements are translated
- [ ] Settings page translations work
- [ ] Common actions (save, delete, etc.) are translated
- [ ] Error messages and loading states are translated
- [ ] RTL layout works correctly (for RTL languages)
- [ ] No missing translations (fallback to English)

## Current Languages

### Complete Translations

All current languages have complete translations for:
- Navigation menu
- Chat interface
- Settings page
- Common actions
- Error messages
- Loading states

### Translation Coverage

| Section | Keys | Description |
|---------|------|-------------|
| `navigation` | 4 | Main navigation menu items |
| `chat` | 4 | Chat interface elements |
| `common` | 18 | Common actions and states |
| `settings` | 8 | Settings page elements |

### File Structure

```
src/lib/translations/
├── en.json          # English (base language)
├── es.json          # Spanish
├── fr.json          # French
├── de.json          # German
├── it.json          # Italian
├── pt.json          # Portuguese
├── ru.json          # Russian
├── ja.json          # Japanese
├── ko.json          # Korean
├── zh.json          # Chinese
├── ar.json          # Arabic (RTL)
├── nl.json          # Nederlands
└── hi.json          # Hindi
```

## 🛠️ Translation Tools

### Available Scripts

#### Translation Generator
```bash
node scripts/generate-translation.js <language-code> "<language-name>"
```
Automatically creates new translation files and updates configuration.

#### Translation Validator
```bash
node scripts/validate-translations.js
```
Validates all translation files for completeness and consistency.

### Configuration Files

- **`src/lib/translations/config.ts`** - Central language configuration
- **`src/hooks/useTranslation.ts`** - Dynamic translation loading system
- **`src/lib/translations/*.json`** - Individual language files

### Benefits of the New System

- **🔄 Dynamic Loading**: Only loads needed translations
- **⚡ Performance**: Cached translations for faster switching
- **🔧 Centralized Config**: Easy to manage language metadata
- **✅ Validation**: Automated checks for translation quality
- **🚀 Scalable**: Easy to add new languages without code changes

## Getting Help

If you need help with translations or have questions:

1. **Check existing translations** for reference
2. **Join our Discord** for community support
3. **Create an issue** for specific questions
4. **Review other language contributions** for examples
5. **Use the validation script** to check your work

## Recognition

Contributors who add new languages will be:
- Listed in the contributors section
- Mentioned in release notes
- Given credit in the project documentation

Thank you for helping make Perplexica accessible to users worldwide! 🌍

---

**Note**: This guide is maintained by the community. If you find any issues or have suggestions for improvement, please create an issue or submit a pull request. 