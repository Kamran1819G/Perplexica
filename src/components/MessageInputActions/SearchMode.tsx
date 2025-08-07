import { ChevronDown, Search, Sparkles, Globe, Zap, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import { Fragment } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

const SearchModes = (t: any) => [
  {
    key: 'quickSearch',
    title: t('searchMode.quickSearch'),
    description: t('searchMode.quickSearchDescription'),
    icon: <Zap size={18} className="text-[#4CAF50]" />,
    badge: null,
  },
  {
    key: 'proSearch',
    title: t('searchMode.proSearch'),
    description: t('searchMode.proSearchDescription'),
    icon: <Sparkles size={18} className="text-[#2196F3]" />,
    badge: t('searchMode.proBadge'),
  },
  {
    key: 'ultraSearch',
    title: t('searchMode.ultraSearch'),
    description: t('searchMode.ultraSearchDescription'),
    icon: <Brain size={18} className="text-[#9C27B0]" />,
    badge: t('searchMode.ultraBadge'),
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

  const searchModes = SearchModes(t);
  const currentMode = searchModes.find((mode) => mode.key === searchMode) || searchModes[0];

  return (
    <Popover className="relative">
      <PopoverButton
        type="button"
        disabled={disabled}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-xs",
          "text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white",
          "hover:bg-light-secondary dark:hover:bg-dark-secondary rounded-xl transition duration-200",
          "focus:outline-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {currentMode.icon}
        <span className="font-medium">{currentMode.title}</span>
        {currentMode.badge && (
          <span className="px-1.5 py-0.5 text-xs font-bold bg-[#24A0ED]/20 dark:bg-[#24A0ED]/30 text-[#24A0ED] dark:text-[#24A0ED] rounded">
            {currentMode.badge}
          </span>
        )}
        <ChevronDown size={18} />
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
          <div className="bg-light-primary dark:bg-dark-primary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg p-2">
            <div className="space-y-1">
              {searchModes.map((mode) => (
                <PopoverButton
                  key={mode.key}
                  onClick={() => setSearchMode(mode.key)}
                  className={cn(
                    "w-full p-3 rounded-lg text-left transition duration-200",
                    "hover:bg-light-secondary dark:hover:bg-dark-secondary",
                    searchMode === mode.key
                      ? "bg-[#24A0ED]/10 dark:bg-[#24A0ED]/20 border border-[#24A0ED]/30 dark:border-[#24A0ED]/40"
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
                          <h3 className="text-sm font-medium text-black dark:text-white">
                            {mode.title}
                          </h3>
                          {mode.badge && (
                            <span className="px-1.5 py-0.5 text-xs font-bold bg-[#24A0ED]/20 dark:bg-[#24A0ED]/30 text-[#24A0ED] dark:text-[#24A0ED] rounded">
                              {mode.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                    {searchMode === mode.key && (
                      <div className="flex-shrink-0 ml-2">
                        <div className="w-2 h-2 bg-[#24A0ED] dark:bg-[#24A0ED] rounded-full"></div>
                      </div>
                    )}
                  </div>
                </PopoverButton>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-light-200 dark:border-dark-200">
              <div className="flex items-center gap-2 text-xs text-black/50 dark:text-white/50">
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