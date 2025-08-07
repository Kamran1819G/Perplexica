'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { 
  BookOpenText, 
  Search, 
  Clock, 
  MessageCircle, 
  Trash2,
  Plus,
  Grid3X3,
  List,
  ChevronDown,
  X
} from 'lucide-react';
import { cn, formatTimeDifference } from '@/lib/utils';
import DeleteChat from '@/components/DeleteChat';
import BatchDeleteChats from '@/components/BatchDeleteChats';

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
}

interface ChatCardProps {
  chat: Chat;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

const ChatCard: React.FC<ChatCardProps> = ({ chat, isSelected, onSelect, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={cn(
        "group relative p-4 cursor-pointer transition-all duration-200",
        isSelected && "bg-light-100 dark:bg-dark-100"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Link
            href={`/c/${chat.id}`}
            className="block"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-medium text-black dark:text-white mb-2 line-clamp-2">
              {chat.title}
            </h3>
          </Link>
          
          <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2 mb-3">
            {chat.title.length > 100 ? chat.title.substring(0, 100) + "..." : "Narendra Modi is an Indian politician who has been serving as the Prime Minister of India since May 2014. He is the 14th and current Prime Minister, having won three consecutive terms, including the mos..."}
          </p>
          
          <div className="flex items-center text-xs text-black/50 dark:text-white/50">
            <Clock className="w-3 h-3 mr-1" />
            <span>{formatTimeDifference(new Date(), chat.createdAt)} ago</span>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-all duration-200"
            title="More options"
          >
            •••
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 top-8 bg-white dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg shadow-lg z-20 min-w-[120px]">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChatAnimatedListProps {
  chats: Chat[];
  selectedChatIds: string[];
  onChatSelect: (chatId: string) => void;
  onChatDelete: (chatId: string) => void;
}



// Custom AnimatedList component for chat items
const AnimatedChatList: React.FC<ChatAnimatedListProps> = ({
  chats,
  selectedChatIds,
  onChatSelect,
  onChatDelete
}) => {
  const listRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [keyboardNav, setKeyboardNav] = useState<boolean>(false);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.min(prev + 1, chats.length - 1));
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setKeyboardNav(true);
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        if (selectedIndex >= 0 && selectedIndex < chats.length) {
          e.preventDefault();
          onChatSelect(chats[selectedIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [chats, selectedIndex, onChatSelect]);

  // Scroll selected item into view
  useEffect(() => {
    if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
    const container = listRef.current;
    const selectedItem = container.querySelector(
      `[data-index="${selectedIndex}"]`
    ) as HTMLElement | null;
    if (selectedItem) {
      const extraMargin = 50;
      const containerScrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      const itemTop = selectedItem.offsetTop;
      const itemBottom = itemTop + selectedItem.offsetHeight;
      if (itemTop < containerScrollTop + extraMargin) {
        container.scrollTo({ top: itemTop - extraMargin, behavior: "smooth" });
      } else if (
        itemBottom >
        containerScrollTop + containerHeight - extraMargin
      ) {
        container.scrollTo({
          top: itemBottom - containerHeight + extraMargin,
          behavior: "smooth",
        });
      }
    }
    setKeyboardNav(false);
  }, [selectedIndex, keyboardNav]);

  return (
    <div className="w-full" ref={listRef}>
      <div className="divide-y divide-light-200 dark:divide-dark-200">
        {chats.map((chat, index) => (
          <AnimatedChatItem
            key={chat.id}
            chat={chat}
            index={index}
            isSelected={selectedChatIds.includes(chat.id)}
            isKeyboardSelected={selectedIndex === index}
            onSelect={() => {
              setSelectedIndex(index);
              onChatSelect(chat.id);
            }}
            onDelete={() => onChatDelete(chat.id)}
            onMouseEnter={() => setSelectedIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

// Animated wrapper for individual chat items
interface AnimatedChatItemProps {
  chat: Chat;
  index: number;
  isSelected: boolean;
  isKeyboardSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onMouseEnter: () => void;
}

const AnimatedChatItem: React.FC<AnimatedChatItemProps> = ({
  chat,
  index,
  isSelected,
  isKeyboardSelected,
  onSelect,
  onDelete,
  onMouseEnter
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.5, once: false });
  
  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={onMouseEnter}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className={cn(
        "transition-all duration-200",
        isKeyboardSelected && "bg-light-100 dark:bg-dark-100"
      )}
    >
      <ChatCard
        chat={chat}
        isSelected={isSelected}
        onSelect={onSelect}
        onDelete={onDelete}
      />
    </motion.div>
  );
};

const Page = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [filteredChats, setFilteredChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedChatIds, setSelectedChatIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'alphabetical'>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/chats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await res.json();
        setChats(data.chats || []);
        setFilteredChats(data.chats || []);
      } catch (error) {
        console.error('Error fetching chats:', error);
        toast.error('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, []);

  useEffect(() => {
    let filtered = chats;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      filtered = chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    switch (selectedCategory) {
      case 'recent':
        filtered = filtered.filter((chat) => {
          const daysDiff = Math.floor(
            (new Date().getTime() - new Date(chat.createdAt).getTime()) / (1000 * 3600 * 24)
          );
          return daysDiff <= 7;
        });
        break;
      case 'favorites':
        // TODO: Implement favorites functionality
        filtered = [];
        break;
      case 'archived':
        // TODO: Implement archived functionality
        filtered = [];
        break;
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredChats(sorted);
  }, [searchQuery, chats, sortBy, selectedCategory]);

  const handleChatSelect = (chatId: string) => {
    if (selectedChatIds.includes(chatId)) {
      setSelectedChatIds(selectedChatIds.filter(id => id !== chatId));
    } else {
      setSelectedChatIds([...selectedChatIds, chatId]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedChatIds.length === 0) return;
    setIsDeleteDialogOpen(true);
  };

  const updateChatsAfterDelete = (newChats: Chat[]) => {
    setChats(newChats);
    setSelectedChatIds([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-primary dark:bg-dark-primary">
        <div className="bg-light-secondary dark:bg-dark-secondary rounded-2xl p-8 shadow-sm border border-light-200 dark:border-dark-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <BookOpenText className="w-8 h-8 text-black/70 dark:text-white/70" />
              <div className="absolute -top-1 -right-1">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <p className="text-black/70 dark:text-white/70 text-sm">Loading your library...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-primary dark:bg-dark-primary">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-light-primary dark:bg-dark-primary border-b border-light-200 dark:border-dark-200">
          {/* Top Section with Library title and New Thread button */}
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center space-x-3">
              <BookOpenText className="w-6 h-6 text-black dark:text-white" />
              <h1 className="text-xl font-semibold text-black dark:text-white">Library</h1>
            </div>
            
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-light-secondary dark:bg-dark-secondary text-black dark:text-white rounded-lg text-sm font-medium hover:bg-light-100 dark:hover:bg-dark-100 transition-colors border border-light-200 dark:border-dark-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Thread
            </Link>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6">
            <div className="flex justify-between items-center border-b border-light-200 dark:border-dark-200">
              <button className="pb-3 px-1 border-b-2 border-black dark:border-white text-black dark:text-white font-medium text-sm">
                Threads
              </button>
              <div className="pb-3">
                <button className="p-1 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors">
                  •••
                </button>
              </div>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50" />
              <input
                type="text"
                placeholder="Search your Threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg text-black dark:text-white placeholder-black/50 dark:placeholder-white/50 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button className="text-sm text-black dark:text-white font-medium">
                  Select
                </button>
                <div className="relative">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="appearance-none bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg px-3 py-2 pr-8 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-light-100 dark:hover:bg-dark-100 transition-all duration-200 cursor-pointer"
                  >
                    <option value="all">Type</option>
                    <option value="recent">Recent</option>
                    <option value="favorites">Favorites</option>
                    <option value="archived">Archived</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50 pointer-events-none" />
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="appearance-none bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 rounded-lg px-3 py-2 pr-8 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-light-100 dark:hover:bg-dark-100 transition-all duration-200 cursor-pointer"
                >
                  <option value="recent">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                  <option value="alphabetical">Sort: A-Z</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-black/50 dark:text-white/50 pointer-events-none" />
              </div>
            </div>

            {/* Selection Actions */}
            {selectedChatIds.length > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-blue-900 dark:text-blue-100 text-sm font-medium">
                    {selectedChatIds.length} selected
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedChatIds([])}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="px-3 py-1.5 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      {/* Content Area */}
      <div className="px-6 py-6">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="p-4 bg-light-secondary dark:bg-dark-secondary rounded-xl inline-block mb-4">
                {searchQuery ? (
                  <Search className="w-8 h-8 text-black/40 dark:text-white/40" />
                ) : (
                  <MessageCircle className="w-8 h-8 text-black/40 dark:text-white/40" />
                )}
              </div>
              
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">
                {searchQuery ? 'No threads found' : 'No threads yet'}
              </h3>
              <p className="text-black/60 dark:text-white/60 text-sm mb-6">
                {searchQuery 
                  ? `No threads match "${searchQuery}". Try adjusting your search terms.`
                  : 'Start chatting to see your threads here'
                }
              </p>
              
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Clear search
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Start new thread
                </Link>
              )}
            </div>
          </div>
        ) : (
          <AnimatedChatList
            chats={filteredChats}
            selectedChatIds={selectedChatIds}
            onChatSelect={handleChatSelect}
            onChatDelete={(chatId) => {
              setSelectedChatIds([chatId]);
              setIsDeleteDialogOpen(true);
            }}
          />
        )}
      </div>

      {/* Batch Delete Dialog */}
      <BatchDeleteChats
        chatIds={selectedChatIds}
        chats={chats}
        setChats={updateChatsAfterDelete}
        onComplete={() => setSelectedChatIds([])}
        isOpen={isDeleteDialogOpen}
        setIsOpen={setIsDeleteDialogOpen}
      />
    </div>
  );
};

export default Page;