import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';

const Home = () => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  const lastItemRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/prompts?page=${page}&limit=5`); // Limit to 5 per page to test lazy load
        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }
        const result = await response.json();
        
        // Map backend data to MasonryGrid expected format
        const formattedItems = result.data.map(prompt => ({
          id: prompt.id,
          imageUrl: prompt.images && prompt.images.length > 0 ? prompt.images[0].imageUrl : '',
          prompt: prompt.content,
          model: prompt.aiModel,
          author: {
            name: prompt.user.username,
            avatar: prompt.user.avatarUrl
          }
        }));
        
        setItems(prevItems => {
          // Prevent duplicates by checking ids
          const existingIds = new Set(prevItems.map(item => item.id));
          const newItems = formattedItems.filter(item => !existingIds.has(item.id));
          return [...prevItems, ...newItems];
        });
        setHasMore(result.meta.hasMore);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (hasMore) {
      fetchPrompts();
    }
  }, [page]);

  if (error) return <div className="page-container" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <MasonryGrid items={items} />
      <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading more...</div>}
      {!hasMore && items.length > 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No more prompts to load.</div>}
    </div>
  );
};

export default Home;
