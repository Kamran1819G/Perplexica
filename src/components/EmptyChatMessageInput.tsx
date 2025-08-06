import { ArrowRight } from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import TextareaAutosize from 'react-textarea-autosize';


import Optimization from './MessageInputActions/Optimization';
import Attach from './MessageInputActions/Attach';
import Microphone from './MessageInputActions/Microphone';
import { File } from './ChatWindow';
import axios from 'axios';
import { useTranslation } from '@/hooks/useTranslation';

const EmptyChatMessageInput = ({
  sendMessage,
  optimizationMode,
  setOptimizationMode,
  fileIds,
  setFileIds,
  files,
  setFiles,
}: {
  sendMessage: (message: string) => void;
  optimizationMode: string;
  setOptimizationMode: (mode: string) => void;
  fileIds: string[];
  setFileIds: (fileIds: string[]) => void;
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const { t } = useTranslation();

  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionTimeout = useRef<NodeJS.Timeout | null>(null);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;

      const isInputFocused =
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.hasAttribute('contenteditable');

      if (e.key === '/' && !isInputFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    inputRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `/api/searxng?format=json&q=${encodeURIComponent(q)}`;
      const res = await axios.get(url);
      setSuggestions(res.data.suggestions || []);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    const value = e.target.value;
    suggestionTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
      setShowSuggestions(!!value);
    }, 250);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage(message);
        setMessage('');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage(message);
          setMessage('');
        }
      }}
      className="w-full"
    >
      <div className="relative flex flex-col bg-light-secondary dark:bg-dark-secondary px-5 pt-5 pb-2 rounded-lg w-full border border-light-200 dark:border-dark-200">
        <TextareaAutosize
          ref={inputRef}
          value={message}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(!!message)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          minRows={2}
          className="bg-transparent placeholder:text-black/50 dark:placeholder:text-white/50 text-sm text-black dark:text-white resize-none focus:outline-none w-full max-h-24 lg:max-h-36 xl:max-h-48"
          placeholder={t('emptyChat.askAnything')}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-dark-secondary border border-dark-200 rounded-lg shadow-xl overflow-hidden">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center px-4 py-3 text-white hover:bg-[#24A0ED]/10 cursor-pointer text-sm border-b border-dark-200 last:border-b-0 transition-colors duration-150"
                onMouseDown={() => {
                  setMessage(s);
                  setShowSuggestions(false);
                }}
              >
                <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {s}
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-row items-center justify-between mt-4">
          <div className="flex flex-row items-center space-x-2 lg:space-x-4">
            <Attach
              fileIds={fileIds}
              setFileIds={setFileIds}
              files={files}
              setFiles={setFiles}
              showText
            />
          </div>
          <div className="flex flex-row items-center space-x-1 sm:space-x-4">
            <Optimization
              optimizationMode={optimizationMode}
              setOptimizationMode={setOptimizationMode}
            />
            <Microphone
              onDictate={(text) => setMessage((prev) => prev + (prev ? ' ' : '') + text)}
            />
            <button
              disabled={message.trim().length === 0}
              className="bg-[#24A0ED] text-white disabled:text-black/50 dark:disabled:text-white/50 disabled:bg-[#e0e0dc] dark:disabled:bg-[#ececec21] hover:bg-opacity-85 transition duration-100 rounded-full p-2"
            >
              <ArrowRight className="bg-background" size={17} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default EmptyChatMessageInput;
