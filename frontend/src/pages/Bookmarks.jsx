import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import Toast, { useToast } from '../components/Toast';
import { Bookmark, Sparkles, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const Bookmarks = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast, showToast } = useToast();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get('search') || '';
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
        let url = `${API_BASE}/prompts/bookmarks?page=${page}&limit=10`;
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const response = await fetch(url, {
          credentials: 'include'
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
          source: prompt.source,
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
        setInitialLoading(false);
      }
    };

    fetchBookmarks();
  }, [page, token, refreshKey, searchQuery]);

  // Reset page and items when search query changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  const handleToggleLike = async (id) => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/prompts/${id}/like`, {
        method: 'POST',
        credentials: 'include'
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
        credentials: 'include'
      });
      const result = await res.json();
      
      if (!result.bookmarked) {
        // If un-bookmarked, remove from the list in Library page
        setItems(prev => prev.filter(item => item.id !== id));
        showToast('✅ ' + t('bookmarks.removedSuccess'));
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
      <div className="profile-page">
        <div className="profile-login-prompt">
          <div className="profile-login-icon">
            <Bookmark size={48} />
          </div>
          <h2>{t('bookmarks.title')}</h2>
          <p>{t('bookmarks.loginToView')}</p>
          <button 
            className="btn-primary" 
            onClick={() => setShowLoginModal(true)}
            style={{ padding: '12px 32px', fontSize: '15px' }}
          >
            {t('bookmarks.loginToContinue')}
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  if (error) return <div className="profile-page"><div className="profile-error">{t('bookmarks.error')} {error}</div></div>;

  return (
    <div className="profile-page">
      {/* Hero Header */}
      <div className="profile-hero bookmark-hero">
        <div className="profile-hero-inner">
          <div className="profile-hero-left">
            <div className="bookmark-header-content">
              <div className="bookmark-icon-wrapper">
                <Bookmark size={28} />
              </div>
              <div>
                <h1 className="profile-display-name">{t('bookmarks.title')}</h1>
                <p className="profile-username">{t('bookmarks.subtitle')}</p>
              </div>
            </div>
          </div>
          <div className="profile-hero-right">
            <div className="bookmark-count-badge">
              <span className="bookmark-count-number">{items.length}</span>
              <span className="bookmark-count-text">{t('bookmarks.savedStat')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {initialLoading ? (
          <div className="profile-loading">
            <div className="profile-loading-spinner" />
            <p>{t('bookmarks.loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">
              <Bookmark size={56} strokeWidth={1.2} />
            </div>
            <h3>{t('bookmarks.noBookmarks')}</h3>
            <p>{t('bookmarks.noBookmarksDesc')}</p>
          </div>
        ) : (
          <MasonryGrid 
            items={items} 
            onToggleLike={handleToggleLike} 
            onToggleBookmark={handleToggleBookmark} 
          />
        )}
        
        <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
        {loading && !initialLoading && (
          <div className="profile-load-more">
            <div className="profile-loading-spinner small" />
            <span>{t('bookmarks.loadingMore')}</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="profile-end-marker">
            <span>{t('bookmarks.endReached')}</span>
          </div>
        )}
        
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <Toast message={toast} />
      </div>
    </div>
  );
};

export default Bookmarks;
