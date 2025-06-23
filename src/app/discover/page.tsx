'use client';

import { Search } from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Select } from '@/components/ui/Select';

interface Discover {
  title: string;
  content: string;
  url: string;
  thumbnail: string;
}

const TOPICS = [
  { value: 'AI', label: 'AI' },
  { value: 'tech', label: 'Tech' },
  { value: 'custom', label: 'Custom...' },
];
const WEBSITES = [
  { value: '', label: 'All Websites' },
  { value: 'yahoo.com', label: 'Yahoo' },
  { value: 'www.exchangewire.com', label: 'ExchangeWire' },
  { value: 'businessinsider.com', label: 'Business Insider' },
  // Add more as needed
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'website', label: 'Website A-Z' },
];

const PAGE_SIZE = 12;

const Page = () => {
  const [discover, setDiscover] = useState<Discover[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState('AI');
  const [website, setWebsite] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [query, setQuery] = useState('');
  const customTopicInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [infiniteArticles, setInfiniteArticles] = useState<Discover[]>([]);
  const [infiniteLoading, setInfiniteLoading] = useState(false);
  const [infiniteMode, setInfiniteMode] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState('relevance');

  useEffect(() => {
    if (infiniteMode) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (topic && topic !== 'custom') params.append('topic', topic);
        if (topic === 'custom' && customTopic) params.append('topic', customTopic);
        if (website) params.append('website', website);
        if (query) params.append('q', query);
        params.append('page', String(page));
        params.append('pageSize', String(PAGE_SIZE));
        if (sort) params.append('sort', sort);
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
        toast.error('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic, website, customTopic, query, page, infiniteMode, sort]);

  const fetchInfinite = useCallback(async (nextPage: number) => {
    setInfiniteLoading(true);
    try {
      const params = new URLSearchParams();
      if (topic && topic !== 'custom') params.append('topic', topic);
      if (topic === 'custom' && customTopic) params.append('topic', customTopic);
      if (website) params.append('website', website);
      if (query) params.append('q', query);
      params.append('page', String(nextPage));
      params.append('pageSize', String(PAGE_SIZE));
      if (sort) params.append('sort', sort);
      const res = await fetch(`/api/discover?${params.toString()}`);
      const data = await res.json();
      const newArticles = data.blogs.filter((blog: Discover) => blog.thumbnail);
      setInfiniteArticles((prev) => [...prev, ...newArticles]);
      setTotalPages(data.totalPages || 1);
      setTotalResults(data.totalResults || 0);
    } catch (err) {
      toast.error('Error fetching more articles');
    } finally {
      setInfiniteLoading(false);
    }
  }, [topic, website, customTopic, query, sort]);

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
  }, [topic, website, customTopic, query, infiniteMode]);

  return (
    <div className="flex flex-col pt-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 px-2">
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Topic</label>
          <Select
            options={TOPICS}
            value={topic}
            onChange={e => setTopic(e.target.value)}
            className="min-w-[120px]"
          />
          {topic === 'custom' && (
            <input
              ref={customTopicInputRef}
              type="text"
              className="mt-2 px-3 py-2 border rounded-lg bg-light-secondary dark:bg-dark-secondary border-light-200 dark:border-dark-200 text-sm dark:text-white"
              placeholder="Enter custom topic..."
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
            />
          )}
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Website</label>
          <Select
            options={WEBSITES}
            value={website}
            onChange={e => setWebsite(e.target.value)}
            className="min-w-[140px]"
          />
        </div>
        <div className="flex flex-col flex-1">
          <label className="text-xs font-medium mb-1">Search</label>
          <input
            type="text"
            className="px-3 py-2 border rounded-lg bg-light-secondary dark:bg-dark-secondary border-light-200 dark:border-dark-200 text-sm dark:text-white w-full"
            placeholder="Search articles..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">Sort By</label>
          <Select
            options={SORT_OPTIONS}
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="min-w-[120px]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium mb-1">View Mode</label>
          <select
            className="min-w-[120px] px-3 py-2 border rounded-lg bg-light-secondary dark:bg-dark-secondary border-light-200 dark:border-dark-200 text-sm dark:text-white"
            value={infiniteMode ? 'infinite' : 'pagination'}
            onChange={e => setInfiniteMode(e.target.value === 'infinite')}
          >
            <option value="pagination">Pagination</option>
            <option value="infinite">Infinite Scroll</option>
          </select>
        </div>
      </div>
      <hr className="border-t border-[#2B2C2C] my-2 w-full" />
      <div className="mb-2 text-xs text-black/60 dark:text-white/60 px-2">
        Showing {infiniteMode ? infiniteArticles.length : (discover?.length || 0)} of {totalResults} articles
      </div>
      <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 pb-28 lg:pb-8 w-full justify-items-center lg:justify-items-start">
        {loading && !infiniteMode
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="max-w-sm w-full h-64 rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary animate-pulse border border-light-200 dark:border-dark-200 flex flex-col"
            >
              <div className="bg-light-200 dark:bg-dark-200 h-36 w-full" />
              <div className="flex-1 p-4 flex flex-col gap-2">
                <div className="h-5 bg-light-200 dark:bg-dark-200 rounded w-3/4" />
                <div className="h-3 bg-light-200 dark:bg-dark-200 rounded w-1/2" />
              </div>
            </div>
          ))
          : infiniteMode
            ? infiniteArticles.map((item, i) => {
              const urlObj = new URL(item.url);
              const website = urlObj.hostname.replace('www.', '');
              return (
                <Link
                  href={`/?q=Summary: ${item.url}`}
                  key={i}
                  className="max-w-sm w-full rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary hover:-translate-y-[1px] transition duration-200 border border-light-200 dark:border-dark-200 flex flex-col shadow-sm"
                  target="_blank"
                >
                  <img
                    className="object-cover w-full aspect-video bg-light-200 dark:bg-dark-200"
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
                  <div className="px-6 py-4 flex-1 flex flex-col justify-between">
                    <div className="font-bold text-lg mb-2 truncate" title={item.title}>
                      {item.title}
                    </div>
                    <p className="text-black-70 dark:text-white/70 text-sm mb-2 line-clamp-3">
                      {item.content}
                    </p>
                    <div className="flex flex-row items-center gap-2 mt-auto">
                      <span className="text-xs text-black/50 dark:text-white/50 bg-light-200 dark:bg-dark-200 rounded px-2 py-1">
                        {website}
                      </span>
                      <span className="text-xs text-black/40 dark:text-white/40">
                        {item.url}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
            : discover && discover.length > 0
              ? discover.map((item, i) => {
                const urlObj = new URL(item.url);
                const website = urlObj.hostname.replace('www.', '');
                return (
                  <Link
                    href={`/?q=Summary: ${item.url}`}
                    key={i}
                    className="max-w-sm w-full rounded-lg overflow-hidden bg-light-secondary dark:bg-dark-secondary hover:-translate-y-[1px] transition duration-200 border border-light-200 dark:border-dark-200 flex flex-col shadow-sm"
                    target="_blank"
                  >
                    <img
                      className="object-cover w-full aspect-video bg-light-200 dark:bg-dark-200"
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
                    <div className="px-6 py-4 flex-1 flex flex-col justify-between">
                      <div className="font-bold text-lg mb-2 truncate" title={item.title}>
                        {item.title}
                      </div>
                      <p className="text-black-70 dark:text-white/70 text-sm mb-2 line-clamp-3">
                        {item.content}
                      </p>
                      <div className="flex flex-row items-center gap-2 mt-auto">
                        <span className="text-xs text-black/50 dark:text-white/50 bg-light-200 dark:bg-dark-200 rounded px-2 py-1">
                          {website}
                        </span>
                        <span className="text-xs text-black/40 dark:text-white/40">
                          {item.url}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
              : (
                <div className="col-span-full text-center text-black/60 dark:text-white/60 py-12">
                  No articles found for the selected filters.
                </div>
              )}
      </div>
      {!infiniteMode && totalPages > 1 && (
        <div className="flex flex-row items-center justify-center gap-2 my-6">
          <button
            className="px-3 py-1 rounded bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`px-3 py-1 rounded border text-sm ${page === i + 1 ? 'bg-[#24A0ED] text-white' : 'bg-light-secondary dark:bg-dark-secondary border-light-200 dark:border-dark-200'}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded bg-light-secondary dark:bg-dark-secondary border border-light-200 dark:border-dark-200 text-sm disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
      {infiniteMode && (
        <div ref={loadMoreRef} className="flex justify-center py-6">
          {infiniteLoading && <span className="text-xs text-black/60 dark:text-white/60">Loading more...</span>}
          {!infiniteLoading && infiniteArticles.length >= totalResults && (
            <span className="text-xs text-black/60 dark:text-white/60">No more articles.</span>
          )}
        </div>
      )}
    </div>
  );
};

export default Page;
