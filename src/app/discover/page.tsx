'use client';

import React from 'react';
import { User, ArrowUp, Download, List, X, Settings, Palette, DollarSign, Zap, Film, Heart, MoreHorizontal, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import WeatherWidget from '@/components/WeatherWidget';
import MarketOutlookWidget from '@/components/MarketOutlookWidget';
import TrendingCompaniesWidget from '@/components/TrendingCompaniesWidget';
import MarketNewsWidget from '@/components/MarketNewsWidget';

interface Discover {
  title: string;
  content: string;
  url: string;
  thumbnail: string;
  published?: string;
}

interface Interest {
  name: string;
  icon: any;
}

// Utility function to extract source name from URL
const getSourceName = (url: string): string => {
  try {
    const domain = url.replace(/.+\/\/|www.|\..+/g, '');
    
    // Map common domains to more readable names
    const domainMap: { [key: string]: string } = {
      'yahoo': 'Yahoo News',
      'businessinsider': 'Business Insider',
      'exchangewire': 'ExchangeWire',
      'techcrunch': 'TechCrunch',
      'wired': 'Wired',
      'theverge': 'The Verge',
      'mashable': 'Mashable',
      'gizmodo': 'Gizmodo',
      'cnet': 'CNET',
      'venturebeat': 'VentureBeat',
      'reuters': 'Reuters',
      'bloomberg': 'Bloomberg',
      'cnn': 'CNN',
      'bbc': 'BBC',
      'nytimes': 'The New York Times',
      'washingtonpost': 'The Washington Post',
      'guardian': 'The Guardian',
      'forbes': 'Forbes',
      'wsj': 'The Wall Street Journal',
      'ft': 'Financial Times'
    };
    
    // Check if we have a mapped name for this domain
    if (domainMap[domain.toLowerCase()]) {
      return domainMap[domain.toLowerCase()];
    }
    
    // For unknown domains, capitalize and format nicely
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Source';
  }
};

const Page = () => {
  const { t } = useTranslation();
  
  const PAGE_SIZE = 17;

  const [discover, setDiscover] = useState<Discover[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [infiniteArticles, setInfiniteArticles] = useState<Discover[]>([]);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [infiniteMode, setInfiniteMode] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showInterests, setShowInterests] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>('all');

  // Available interests with icons
  const availableInterests: Interest[] = [
    { name: "Tech & Science", icon: Settings },
    { name: "Finance", icon: DollarSign },
    { name: "Arts & Culture", icon: Palette },
    { name: "Sports", icon: Zap },
    { name: "Entertainment", icon: Film }
  ];

  // Load user interests from localStorage on component mount
  useEffect(() => {
    const savedInterests = localStorage.getItem('userInterests');
    if (savedInterests) {
      const parsedInterests = JSON.parse(savedInterests);
      setSelectedInterests(parsedInterests);
      // Only show interests panel if no interests are selected
      setShowInterests(parsedInterests.length === 0);
    } else {
      // If no saved interests, show the panel
      setShowInterests(true);
    }
  }, []);

  // Save interests to localStorage whenever they change
  const saveInterests = () => {
    localStorage.setItem('userInterests', JSON.stringify(selectedInterests));
    toast.success('Interests saved successfully!');
    setShowInterests(false);
  };

  // Handle interest selection
  const handleInterestSelect = (interestName: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestName) 
        ? prev.filter(name => name !== interestName)
        : [...prev, interestName]
    );
  };

  // Get user chosen interests with their icons
  const getUserChosenInterests = () => {
    return availableInterests.filter(interest => 
      selectedInterests.includes(interest.name)
    );
  };

  // Handle interest filter selection
  const handleInterestFilterSelect = (interestName: string) => {
    setSelectedInterestFilter(interestName);
    setPage(1); // Reset to first page when changing filter
  };







  useEffect(() => {
    if (infiniteMode) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (selectedInterestFilter !== 'all') {
          params.append('topic', selectedInterestFilter);
        }
        params.append('page', String(page));
        params.append('pageSize', String(PAGE_SIZE));
        const res = await fetch(`/api/discover?${params.toString()}`);
        const data = await res.json();
        data.blogs = data.blogs.filter((blog: Discover) => blog.thumbnail);
        setDiscover(data.blogs);
        setTotalPages(data.totalPages || 1);
        setTotalResults(data.totalResults || 0);
      } catch (err: any) {
        setDiscover([]);
        setTotalPages(1);
        setTotalResults(0);
        toast.error(t('discover.errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, infiniteMode, selectedInterestFilter]);

  const fetchInfinite = useCallback(async (nextPage: number) => {
    setInfiniteLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedInterestFilter !== 'all') {
        params.append('topic', selectedInterestFilter);
      }
      params.append('page', String(nextPage));
      params.append('pageSize', String(PAGE_SIZE));
      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      const newArticles = data.blogs.filter((blog: Discover) => blog.thumbnail);
      setInfiniteArticles((prev) => [...prev, ...newArticles]);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      toast.error(t('discover.errorFetchingMore'));
    } finally {
      setInfiniteLoading(false);
    }
  }, [selectedInterestFilter, t]);

  useEffect(() => {
    if (!infiniteMode) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new window.IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !infiniteLoading && infiniteArticles.length < totalResults) {
        fetchInfinite(Math.floor(infiniteArticles.length / PAGE_SIZE) + 1);
      }
    });
    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);
    return () => observer.current?.disconnect();
  }, [infiniteMode, infiniteArticles, infiniteLoading, totalResults, fetchInfinite]);

  useEffect(() => {
    if (infiniteMode) return;
    setPage(1);
  }, [infiniteMode, selectedInterestFilter]);

  const renderArticleCard = (item: Discover, index: number, isGrid = false) => {
    const urlObj = new URL(item.url);
    const website = urlObj.hostname.replace('www.', '');
    
    if (isGrid) {
      return (
        <Link
          href={`/?q=Summary: ${item.url}`}
          key={index}
          className="bg-light-secondary dark:bg-dark-secondary rounded-lg overflow-hidden hover:bg-light-200 dark:hover:bg-dark-200 transition-colors duration-200 cursor-pointer border border-light-200 dark:border-dark-200"
          target="_blank"
        >
          <div className="h-32 sm:h-40 bg-light-200 dark:bg-dark-200">
            <img
              className="object-cover w-full h-full"
              src={
                item.thumbnail
                  ? new URL(item.thumbnail).origin +
                  new URL(item.thumbnail).pathname +
                  `?id=${new URL(item.thumbnail).searchParams.get('id')}`
                  : '/default-article.png'
              }
              alt={item.title}
              onError={e => (e.currentTarget.src = '/default-article.png')}
            />
          </div>
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold mb-2 line-clamp-2 hover:text-[#24A0ED] transition-colors duration-200 text-black dark:text-white text-sm sm:text-base">{item.title}</h3>
            <div className="flex items-center justify-start">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-black/70 dark:text-white/70">{getSourceName(item.url)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      );
    }

    return (
      <Link
        href={`/?q=Summary: ${item.url}`}
        key={index}
        className="bg-light-secondary dark:bg-dark-secondary rounded-lg overflow-hidden hover:bg-light-200 dark:hover:bg-dark-200 transition-colors duration-200 cursor-pointer border border-light-200 dark:border-dark-200"
        target="_blank"
      >
        <div className="flex flex-col lg:flex-row">
          <div className="flex-1 p-4 sm:p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-xs sm:text-sm text-black/60 dark:text-white/60">Published {item.published || '16 hours ago'}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold mb-3 hover:text-[#24A0ED] transition-colors duration-200 text-black dark:text-white">{item.title}</h2>
            <p className="text-black/70 dark:text-white/70 mb-4 leading-relaxed text-sm sm:text-base line-clamp-3">{item.content}</p>
            <div className="flex items-center justify-start">
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1.5 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-full">
                  <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 rounded-full"></div>
                  <span className="text-xs sm:text-sm font-medium text-black/70 dark:text-white/70">{getSourceName(item.url)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-80 h-48 sm:h-64 lg:h-auto bg-light-200 dark:bg-dark-200 flex-shrink-0">
            <img
              className="object-cover w-full h-full"
              src={
                item.thumbnail
                  ? new URL(item.thumbnail).origin +
                  new URL(item.thumbnail).pathname +
                  `?id=${new URL(item.thumbnail).searchParams.get('id')}`
                  : '/default-article.png'
              }
              alt={item.title}
              onError={e => (e.currentTarget.src = '/default-article.png')}
            />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex flex-col pt-4 w-full">
      {/* Simple Header */}
      <div className="border-b border-light-200 dark:border-dark-200 px-4 sm:px-6 py-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#24A0ED] rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-black dark:text-white">Discover</h1>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex gap-6 px-4 sm:px-6">
        {/* Left Navigation */}
        <div className="hidden lg:flex flex-col w-16 bg-dark-secondary rounded-lg p-4 space-y-6 h-fit">
          {/* All Interests Logo */}
          <button
            onClick={() => handleInterestFilterSelect('all')}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group relative ${
              selectedInterestFilter === 'all' 
                ? 'bg-[#24A0ED]' 
                : 'bg-dark-200 hover:bg-dark-100'
            }`}
          >
            <Sparkles className="w-5 h-5 text-white" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-dark-200 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              All Interests
            </div>
          </button>
          

          
          {/* View Mode Selector */}
          <div className="flex flex-col space-y-1">
            <button
              onClick={() => setInfiniteMode(false)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group relative ${
                !infiniteMode 
                  ? 'bg-[#24A0ED]' 
                  : 'bg-dark-200 hover:bg-dark-100'
              }`}
            >
              <List className="w-4 h-4 text-white" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-dark-200 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Pagination Mode
              </div>
            </button>
            <button
              onClick={() => setInfiniteMode(true)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group relative ${
                infiniteMode 
                  ? 'bg-[#24A0ED]' 
                  : 'bg-dark-200 hover:bg-dark-100'
              }`}
            >
              <ArrowUp className="w-4 h-4 text-white" />
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-dark-200 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Infinite Scroll Mode
              </div>
            </button>
          </div>
          
          {/* User Chosen Interests Icons */}
          {getUserChosenInterests().length > 0 && (
            <div className="flex flex-col space-y-2">
              <div className="w-full h-px bg-dark-200"></div>
              {getUserChosenInterests().map((interest, index) => (
                <button
                  key={index}
                  onClick={() => handleInterestFilterSelect(interest.name)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors group relative ${
                    selectedInterestFilter === interest.name 
                      ? 'bg-[#24A0ED]' 
                      : 'bg-dark-200 hover:bg-dark-100'
                  }`}
                >
                  <interest.icon className="w-4 h-4 text-white" />
                  {/* Tooltip */}
                  <div className="absolute left-full ml-2 px-2 py-1 bg-dark-200 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {interest.name}
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Edit Interests Button */}
          <button 
            onClick={() => setShowInterests(true)}
            className="w-8 h-8 bg-dark-200 rounded-lg flex items-center justify-center hover:bg-dark-100 transition-colors group relative"
          >
            <Settings className="w-4 h-4 text-white" />
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-dark-200 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Edit Interests
            </div>
          </button>
        </div>

        {/* Articles Feed */}
        <div className="flex-1">
          {/* Hero Article */}
          {discover && discover.length > 0 && (
            <div className="mb-6">
              {renderArticleCard(discover[0], 0, false)}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {loading && !infiniteMode
              ? Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full h-64 rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary animate-pulse border border-light-200 dark:border-dark-200 flex flex-col"
                >
                  <div className="bg-light-200 dark:bg-dark-200 h-36 w-full" />
                  <div className="flex-1 p-4 flex flex-col gap-2">
                    <div className="h-5 bg-light-200 dark:bg-dark-200 rounded w-3/4" />
                    <div className="h-3 bg-light-200 dark:bg-dark-200 rounded w-1/2" />
                  </div>
                </div>
              ))
              : infiniteMode
                ? infiniteArticles.slice(1).map((item, i) => renderArticleCard(item, i + 1, true))
                : discover && discover.length > 1
                  ? discover.slice(1).map((item, i) => renderArticleCard(item, i + 1, true))
                  : null}
          </div>

          {!infiniteMode && totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-2 my-6">
              <button
                className="px-3 py-1 rounded bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('discover.prev')}
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded border text-sm ${page === i + 1 ? 'bg-[#24A0ED] text-white' : 'bg-light-secondary dark:bg-dark-secondary border-light-200 dark:border-dark-200'}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && (
                <span className="px-2 text-sm text-black/60 dark:text-white/60">...</span>
              )}
              <button
                className="px-3 py-1 rounded bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 text-sm disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t('discover.next')}
              </button>
            </div>
          )}
          {infiniteMode && (
            <div ref={loadMoreRef} className="flex justify-center py-6">
              {infiniteLoading && <span className="text-xs text-black/60 dark:text-white/60">{t('discover.loadingMore')}</span>}
              {!infiniteLoading && infiniteArticles.length >= totalResults && (
                <span className="text-xs text-black/60 dark:text-white/60">{t('discover.noMoreArticles')}</span>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar Widgets */}
        <div className="hidden lg:block w-80 space-y-6">
          {/* Make it yours Widget */}
          {showInterests && (
            <div className="bg-[#24A0ED] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Make it yours</h3>
                <button
                  onClick={() => setShowInterests(false)}
                  className="text-white hover:text-white/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm mb-4 text-white/90">
                Select topics and interests to customize your Discover experience
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {availableInterests.map((interest, index) => (
                  <button
                    key={index}
                    className={`text-white text-xs p-2 rounded flex items-center space-x-1 ${
                      selectedInterests.includes(interest.name)
                        ? 'bg-white/30 hover:bg-white/40'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                    onClick={() => handleInterestSelect(interest.name)}
                  >
                    <interest.icon className="w-3 h-3" />
                    <span>{interest.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={saveInterests}
                className="w-full bg-white text-[#24A0ED] py-2 rounded text-sm font-medium hover:bg-gray-100"
              >
                Save Interests
              </button>
            </div>
          )}

          {/* Current Filter Display */}
          <div className="bg-light-secondary dark:bg-dark-secondary rounded-lg p-4 border border-light-200 dark:border-dark-200">
            <h3 className="font-semibold mb-3 text-black dark:text-white">Current Filter</h3>
            <div className="flex items-center space-x-2">
              {selectedInterestFilter === 'all' ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#24A0ED]" />
                  <span className="text-sm text-black dark:text-white">All Interests</span>
                </>
              ) : (
                <>
                  {availableInterests.find(i => i.name === selectedInterestFilter)?.icon && 
                    React.createElement(availableInterests.find(i => i.name === selectedInterestFilter)!.icon, { className: "w-4 h-4 text-[#24A0ED]" })
                  }
                  <span className="text-sm text-black dark:text-white">{selectedInterestFilter}</span>
                </>
              )}
            </div>
          </div>

          {/* Weather Widget */}
          <WeatherWidget />

          {/* Market Outlook Widget */}
          <MarketOutlookWidget />

          {/* Trending Companies Widget */}
          <TrendingCompaniesWidget />

          {/* Market News Widget */}
          <MarketNewsWidget />
        </div>
      </div>
    </div>
  );
};

export default Page;
