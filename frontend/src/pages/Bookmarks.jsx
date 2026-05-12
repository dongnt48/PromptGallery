import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import Toast, { useToast } from '../components/Toast';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const Bookmarks = () => {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast, showToast } = useToast();
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
    const fetchBookmarks = async () => {
      if (!token) return;
      
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/prompts/bookmarks?page=${page}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch bookmarked prompts');
        }
        const result = await response.json();
        
        const formattedItems = result.data.map(prompt => ({
          id: prompt.id,
          imageUrl: prompt.images && prompt.images.length > 0 ? resolveImageUrl(prompt.images[0].imageUrl) : '',
          images: prompt.images ? prompt.images.map(img => ({ ...img, url: resolveImageUrl(img.imageUrl) })) : [],
          prompt: prompt.content,
          model: prompt.aiModel,
          isPublic: prompt.isPublic,
          tags: prompt.tags,
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

    fetchBookmarks();
  }, [page, token, refreshKey]);

  const handleToggleLike = async (id) => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/prompts/${id}/like`, {
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
      const res = await fetch(`${API_BASE}/prompts/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      
      if (!result.bookmarked) {
        // If un-bookmarked, remove from the list in Library page
        setItems(prev => prev.filter(item => item.id !== id));
        showToast('✅ Removed from Bookmarks');
      } else {
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
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (!token) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bookmarks</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>Please log in to view your saved prompts.</p>
        <button 
          className="btn-primary" 
          onClick={() => setShowLoginModal(true)}
          style={{ padding: '12px 24px' }}
        >
          Log In
        </button>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  if (error) return <div className="page-container" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <header style={{ padding: '40px 2rem 20px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--on-background)' }}>Bookmarks</h1>
        <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>Your collection of saved prompts.</p>
      </header>

      {items.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#888', fontSize: '1.2rem' }}>You haven't bookmarked any prompts yet.</p>
        </div>
      ) : (
        <MasonryGrid 
          items={items} 
          onToggleLike={handleToggleLike} 
          onToggleBookmark={handleToggleBookmark} 
        />
      )}
      
      <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}
      {!hasMore && items.length > 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>End of your bookmarks.</div>}
      
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <Toast message={toast} />
    </div>
  );
};

export default Bookmarks;

