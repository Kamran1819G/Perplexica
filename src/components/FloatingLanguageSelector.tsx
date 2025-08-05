'use client';

import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronUp, ChevronDown } from 'lucide-react';

import { languageNames, isRTL, getAvailableLanguages } from '@/lib/translations/config';

const locales = getAvailableLanguages();

export default function FloatingLanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState('en');
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('top');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Load saved language preference
    const savedLocale = localStorage.getItem('selectedLanguage') || 'en';
    setCurrentLocale(savedLocale);
    
    // Apply language to document
    document.documentElement.lang = savedLocale;
    if (isRTL(savedLocale)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Calculate dropdown position based on available space
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 200; // Approximate dropdown height
      
      // Check if there's enough space above the button
      const spaceAbove = buttonRect.top;
      const spaceBelow = viewportHeight - buttonRect.bottom;
      
      setDropdownPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
    }
  }, [isOpen]);

  const handleLanguageChange = (newLocale: string) => {
    console.log('Language changing from', currentLocale, 'to', newLocale);
    setCurrentLocale(newLocale);
    localStorage.setItem('selectedLanguage', newLocale);
    
    // Apply language to document
    document.documentElement.lang = newLocale;
    if (isRTL(newLocale)) {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    setIsOpen(false);
    
    // Dispatch a custom event to notify other components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: newLocale } 
    }));
    
    console.log('Language changed successfully to', newLocale);
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle dropdown clicked, current state:', isOpen);
    setIsOpen(!isOpen);
    console.log('Dropdown state changed to:', !isOpen);
  };

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[9999]">
      <div className="relative">
        {/* Main floating button */}
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          className="bg-[#24A0ED] hover:bg-[#1e8bd8] text-white rounded-full p-2.5 sm:p-3 shadow-lg transition-all duration-200 hover:scale-105 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-300 min-w-[44px] min-h-[44px]"
          aria-label="Select language"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          <Globe className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Language dropdown */}
        {isOpen && (
          <div 
            ref={dropdownRef}
            className={`absolute ${
              dropdownPosition === 'top' 
                ? 'bottom-full right-0 mb-2' 
                : 'top-full right-0 mt-2'
            } w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[10000] max-h-[60vh] overflow-y-auto`}
          >
            <div className="py-1">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLanguageChange(loc)}
                  className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700 min-h-[44px] sm:min-h-auto ${
                    currentLocale === loc
                      ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {languageNames[loc] || loc}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 