import { ChevronDown, Search, Sparkles, Globe, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const SearchModes = [
  {
    key: 'webSearch',
    title: 'Quick Search',
    description: 'Fast web search with immediate results',
    icon: <Zap size={20} className="text-[#4CAF50]" />,
    badge: null,
  },
  {
    key: 'proSearch',
    title: 'Pro Search',
    description: 'Deep research with comprehensive analysis',
    icon: <Sparkles size={20} className="text-[#2196F3]" />,
    badge: 'PRO',
  },
];

interface SearchModeProps {
  searchMode: string;
  setSearchMode: (mode: string) => void;
  disabled?: boolean;
}

const SearchMode = ({
  searchMode,
  setSearchMode,
  disabled = false,
}: SearchModeProps) => {
  const { t } = useTranslation();

  const currentMode = SearchModes.find((mode) => mode.key === searchMode) || SearchModes[0];

  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm",
          "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200",
          "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {currentMode.icon}
        <span className="font-medium">{currentMode.title}</span>
        {currentMode.badge && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
            {currentMode.badge}
          </span>
        )}
        <ChevronDown className="h-4 w-4" />
      </PopoverButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <PopoverPanel className="absolute z-10 mt-2 w-80 right-0">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2">
            <div className="space-y-1">
              {SearchModes.map((mode) => (
                <PopoverButton
                  key={mode.key}
                  onClick={() => setSearchMode(mode.key)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition-colors duration-200",
                    "hover:bg-gray-50 dark:hover:bg-gray-800",
                    searchMode === mode.key
                      ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "border border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {mode.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {mode.title}
                          </h3>
                          {mode.badge && (
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {mode.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                    {searchMode === mode.key && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                      </div>
                    )}
                  </div>
                </PopoverButton>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Globe className="h-3 w-3" />
                <span>{t('searchMode.powered') || 'Powered by multiple search engines'}</span>
              </div>
            </div>
          </div>
        </PopoverPanel>
      </Transition>
    </Popover>
  );
};

export default SearchMode;