import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const Home = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
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
        const response = await fetch(`${API_BASE}/prompts?page=${page}&limit=5`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }
        const result = await response.json();
        
        // Map backend data to MasonryGrid expected format
        const formattedItems = result.data.map(prompt => ({
          id: prompt.id,
          imageUrl: prompt.images && prompt.images.length > 0 ? resolveImageUrl(prompt.images[0].imageUrl) : '',
          prompt: prompt.content,
          model: prompt.aiModel,
          isLiked: prompt.isLiked,
          isBookmarked: prompt.isBookmarked,
          likesCount: prompt.likesCount,
          bookmarksCount: prompt.bookmarksCount,
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
  }, [page, token]);

  const handleToggleLike = async (id) => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/prompts/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isLiked: result.liked,
            likesCount: result.liked ? item.likesCount + 1 : item.likesCount - 1
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleBookmark = async (id) => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/prompts/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      setItems(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            isBookmarked: result.bookmarked,
            bookmarksCount: result.bookmarked ? item.bookmarksCount + 1 : item.bookmarksCount - 1
          };
        }
        return item;
      }));
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const syncInteraction = (id, interactionType, status) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        if (interactionType === 'like') {
          return {
            ...item,
            isLiked: status,
            likesCount: status ? item.likesCount + 1 : item.likesCount - 1
          };
        } else if (interactionType === 'bookmark') {
          return {
            ...item,
            isBookmarked: status,
            bookmarksCount: status ? item.bookmarksCount + 1 : item.bookmarksCount - 1
          };
        }
      }
      return item;
    }));
  };

  if (error) return <div className="page-container" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <MasonryGrid 
        items={items} 
        onToggleLike={handleToggleLike} 
        onToggleBookmark={handleToggleBookmark} 
        onInteractionSync={syncInteraction}
      />
      <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading more...</div>}
      {!hasMore && items.length > 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No more prompts to load.</div>}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Home;
