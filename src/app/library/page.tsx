'use client';

import DeleteChat from '@/components/DeleteChat';
import BatchDeleteChats from '@/components/BatchDeleteChats';
import { cn, formatTimeDifference } from '@/lib/utils';
import { BookOpenText, Check, ClockIcon, Delete, ScanEye, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  focusMode: string;
}

const Page = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);

      const res = await fetch(`/api/chats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();

      setChats(data.chats);
      setFilteredChats(data.chats);
      setLoading(false);
    };

    fetchChats();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats);
    } else {
      const filtered = chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedChats([]);
  };

  const toggleChatSelection = (chatId: string) => {
    if (selectedChats.includes(chatId)) {
      setSelectedChats(selectedChats.filter(id => id !== chatId));
    } else {
      setSelectedChats([...selectedChats, chatId]);
    }
  };

  const selectAllChats = () => {
    if (selectedChats.length === filteredChats.length) {
      setSelectedChats([]);
    } else {
      setSelectedChats(filteredChats.map(chat => chat.id));
    }
  };

  const deleteSelectedChats = () => {
    if (selectedChats.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const handleBatchDeleteComplete = () => {
    setSelectedChats([]);
    setSelectionMode(false);
  };

  const updateChatsAfterDelete = (newChats: Chat[]) => {
    setChats(newChats);
    setFilteredChats(newChats.filter(chat => 
      searchQuery.trim() === '' || 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ));
  };

  return loading ? (
    <div className="flex flex-row items-center justify-center min-h-screen">
      <svg
        aria-hidden="true"
        className="w-8 h-8 text-light-200 fill-light-secondary dark:text-[#202020] animate-spin dark:fill-[#ffffff3b]"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100.003 78.2051 78.1951 100.003 50.5908 100C22.9765 99.9972 0.997224 78.018 1 50.4037C1.00281 22.7993 22.8108 0.997224 50.4251 1C78.0395 1.00281 100.018 22.8108 100 50.4251ZM9.08164 50.594C9.06312 73.3997 27.7909 92.1272 50.5966 92.1457C73.4023 92.1642 92.1298 73.4365 92.1483 50.6308C92.1669 27.8251 73.4392 9.0973 50.6335 9.07878C27.8278 9.06026 9.10003 27.787 9.08164 50.594Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4037 97.8624 35.9116 96.9801 33.5533C95.1945 28.8227 92.871 24.3692 90.0681 20.348C85.6237 14.1775 79.4473 9.36872 72.0454 6.45794C64.6435 3.54717 56.3134 2.65431 48.3133 3.89319C45.869 4.27179 44.3768 6.77534 45.014 9.20079C45.6512 11.6262 48.1343 13.0956 50.5786 12.717C56.5073 11.8281 62.5542 12.5399 68.0406 14.7911C73.527 17.0422 78.2187 20.7487 81.5841 25.4923C83.7976 28.5886 85.4467 32.059 86.4416 35.7474C87.1273 38.1189 89.5423 39.6781 91.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  ) : (
    <div className="flex h-screen bg-light-primary dark:bg-dark-primary">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-light-primary dark:bg-dark-primary border-b border-light-200 dark:border-dark-200 px-4 sm:px-6 py-4">
          <div className="flex items-center">
            <BookOpenText className="w-5 h-5 sm:w-6 sm:h-6" />
            <h1 className="text-2xl sm:text-3xl font-medium p-2">Library</h1>
          </div>
        </div>

        {/* Content Area with Scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:px-6 lg:px-8">
            {/* Search Box */}
            <div className="relative mt-6 mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-black/50 dark:text-white/50" />
              </div>
              <input
                type="text"
                className="block w-full p-2 sm:p-3 pl-10 pr-10 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-md text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm sm:text-base"
                placeholder="Search your threads..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white" />
                </button>
              )}
            </div>
            
            {/* Thread Count and Selection Controls */}
            <div className="mb-4">
              {!selectionMode ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-black/70 dark:text-white/70 text-sm sm:text-base">
                    You have {chats.length} threads in Perplexica
                  </div>
                  <button
                    onClick={toggleSelectionMode}
                    className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white text-sm transition duration-200 self-start sm:self-auto"
                  >
                    Select
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-black/70 dark:text-white/70 text-sm sm:text-base">
                    {selectedChats.length} selected thread{selectedChats.length !== 1 ? 's' : ''}
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4">
                    <button
                      onClick={selectAllChats}
                      className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white text-sm transition duration-200"
                    >
                      {selectedChats.length === filteredChats.length ? 'Deselect all' : 'Select all'}
                    </button>
                    
                    <button
                      onClick={toggleSelectionMode}
                      className="text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white text-sm transition duration-200"
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={deleteSelectedChats}
                      disabled={selectedChats.length === 0}
                      className={cn(
                        "text-sm transition duration-200",
                        selectedChats.length === 0 
                          ? "text-red-400/50 hover:text-red-500/50 cursor-not-allowed" 
                          : "text-red-400 hover:text-red-500 cursor-pointer"
                      )}
                    >
                      Delete Selected
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {filteredChats.length === 0 && (
              <div className="flex flex-row items-center justify-center min-h-[50vh]">
                <p className="text-black/70 dark:text-white/70 text-sm sm:text-base text-center">
                  {searchQuery ? 'No threads found matching your search.' : 'No threads found.'}
                </p>
              </div>
            )}
            
            {filteredChats.length > 0 && (
              <div className="flex flex-col pb-20 lg:pb-2">
                {filteredChats.map((chat, i) => (
                  <div
                    className={cn(
                      'flex flex-col space-y-3 sm:space-y-4 py-4 sm:py-6',
                      i !== filteredChats.length - 1
                        ? 'border-b border-white-200 dark:border-dark-200'
                        : '',
                    )}
                    key={i}
                    onMouseEnter={() => setHoveredChatId(chat.id)}
                    onMouseLeave={() => setHoveredChatId(null)}
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      {/* Checkbox - visible when in selection mode or when hovering */}
                      {(selectionMode || hoveredChatId === chat.id) && (
                        <div 
                          className="cursor-pointer flex-shrink-0 mt-1 sm:mt-0"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!selectionMode) setSelectionMode(true);
                            toggleChatSelection(chat.id);
                          }}
                        >
                          <div className={cn(
                            "w-4 h-4 sm:w-5 sm:h-5 border rounded flex items-center justify-center transition-colors",
                            selectedChats.includes(chat.id) 
                              ? "bg-blue-500 border-blue-500" 
                              : "border-gray-400 dark:border-gray-600"
                          )}>
                            {selectedChats.includes(chat.id) && (
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Chat Title */}
                      <Link
                        href={`/c/${chat.id}`}
                        className={cn(
                          "text-black dark:text-white text-base sm:text-lg lg:text-xl font-medium transition duration-200 hover:text-[#24A0ED] dark:hover:text-[#24A0ED] cursor-pointer flex-1 min-w-0",
                          selectionMode && "pointer-events-none text-black dark:text-white hover:text-black dark:hover:text-white"
                        )}
                        onClick={(e) => {
                          if (selectionMode) {
                            e.preventDefault();
                            toggleChatSelection(chat.id);
                          }
                        }}
                      >
                        <span className="block truncate">{chat.title}</span>
                      </Link>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-2 sm:gap-0">
                      <div className="flex flex-row items-center space-x-1 lg:space-x-1.5 text-black/70 dark:text-white/70">
                        <ClockIcon size={14} className="sm:w-[15px] sm:h-[15px]" />
                        <p className="text-xs sm:text-sm">
                          {formatTimeDifference(new Date(), chat.createdAt)} Ago
                        </p>
                      </div>
                      
                      {/* Delete button - only visible when not in selection mode */}
                      {!selectionMode && (
                        <div className="self-start sm:self-auto">
                          <DeleteChat
                            chatId={chat.id}
                            chats={chats}
                            setChats={updateChatsAfterDelete}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Batch Delete Confirmation Dialog */}
      <BatchDeleteChats
        chatIds={selectedChats}
        chats={chats}
        setChats={updateChatsAfterDelete}
        onComplete={handleBatchDeleteComplete}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default Page;