import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import CreatePromptModal from '../components/CreatePromptModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast, { useToast } from '../components/Toast';
import { Plus, ImageIcon, Film, LayoutGrid, Lock, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const MyPrompts = () => {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('all');
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
    const fetchMyPrompts = async () => {
      if (!token) return;

      setLoading(true);
      try {
        let url = `${API_BASE}/prompts/my?page=${page}&limit=10`;
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const response = await fetch(url, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch your prompts');
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

    fetchMyPrompts();
  }, [page, token, refreshKey, searchQuery]);

  // Reset page and items when search query changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
  }, [searchQuery]);

  // Listen for new prompt creation and refresh the list
  useEffect(() => {
    const handlePromptCreated = () => {
      setItems([]);
      setPage(1);
      setHasMore(true);
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('promptCreated', handlePromptCreated);
    return () => window.removeEventListener('promptCreated', handlePromptCreated);
  }, []);

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

  const handleDelete = (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`${API_BASE}/prompts/${deleteId}/delete`, {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== deleteId));
        showToast('✅ ' + t('myPrompts.deleteSuccess'));
      } else {
        const err = await res.json();
        showToast('❌ ' + (err.message || t('myPrompts.deleteFailed')));
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      showToast('❌ ' + t('myPrompts.deleteError'));
    } finally {
      setDeleteId(null);
    }
  };

  const handleEdit = (item) => {
    setEditingPrompt(item);
  };

  const handleUpdate = (updatedPrompt) => {
    setItems(prev => prev.map(item => {
      if (item.id === updatedPrompt.id) {
        return {
          ...item,
          prompt: updatedPrompt.content,
          model: updatedPrompt.aiModel,
          isPublic: updatedPrompt.isPublic,
          tags: updatedPrompt.tags // Note: formatting might need adjustment if tags structure changed
        };
      }
      return item;
    }));
    showToast('✅ ' + t('myPrompts.updateSuccess'));
  };

  // Stats
  const totalPrompts = items.length;
  const publicCount = items.filter(i => i.isPublic).length;
  const privateCount = items.filter(i => !i.isPublic).length;
  const totalLikes = items.reduce((sum, i) => sum + (i.likesCount || 0), 0);

  const filteredItems = items.filter(item => {
    if (filter === 'public') return item.isPublic;
    if (filter === 'private') return !item.isPublic;
    if (filter === 'liked') return item.isLiked || item.likesCount > 0;
    return true; // 'all'
  });

  if (!token) {
    return (
      <div className="profile-page">
        <div className="profile-login-prompt">
          <div className="profile-login-icon">
            <Sparkles size={48} />
          </div>
          <h2>{t('myPrompts.title')}</h2>
          <p>{t('myPrompts.loginToView')}</p>
          <button
            className="btn-primary"
            onClick={() => setShowLoginModal(true)}
            style={{ padding: '12px 32px', fontSize: '15px' }}
          >
            {t('myPrompts.loginToContinue')}
          </button>
        </div>
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      </div>
    );
  }

  if (error) return <div className="profile-page"><div className="profile-error">{t('myPrompts.error')} {error}</div></div>;

  return (
    <div className="profile-page">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-hero-left">
            <div className="profile-avatar-section">
              <img
                src={user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.name || user?.username}&background=0ea5e9&color=fff&size=96`}
                alt={user?.name || user?.username}
                className="profile-avatar-lg"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${user?.name || user?.username}&background=0ea5e9&color=fff&size=96`;
                }}
              />
              <div className="profile-user-info">
                <h1 className="profile-display-name">{user?.name || user?.username}</h1>
                <p className="profile-username">@{user?.username}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="profile-stats-bar">
          <div
            className={`profile-stat-item clickable ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <LayoutGrid size={16} />
            <span className="profile-stat-value">{totalPrompts}</span>
            <span className="profile-stat-label">{t('myPrompts.promptsStat')}</span>
          </div>
          <div className="profile-stat-divider" />
          <div
            className={`profile-stat-item clickable ${filter === 'public' ? 'active' : ''}`}
            onClick={() => setFilter('public')}
          >
            <Globe size={16} />
            <span className="profile-stat-value">{publicCount}</span>
            <span className="profile-stat-label">{t('myPrompts.publicStat')}</span>
          </div>
          <div className="profile-stat-divider" />
          <div
            className={`profile-stat-item clickable ${filter === 'private' ? 'active' : ''}`}
            onClick={() => setFilter('private')}
          >
            <Lock size={16} />
            <span className="profile-stat-value">{privateCount}</span>
            <span className="profile-stat-label">{t('myPrompts.privateStat')}</span>
          </div>
          <div className="profile-stat-divider" />
          <div
            className={`profile-stat-item clickable ${filter === 'liked' ? 'active' : ''}`}
            onClick={() => setFilter('liked')}
          >
            <span className="profile-stat-value" style={{ color: '#ef4444' }}>♥</span>
            <span className="profile-stat-value">{totalLikes}</span>
            <span className="profile-stat-label">{t('myPrompts.totalLikesStat')}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {initialLoading ? (
          <div className="profile-loading">
            <div className="profile-loading-spinner" />
            <p>{t('myPrompts.loading')}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="profile-empty-state">
            <div className="profile-empty-icon">
              <Sparkles size={56} strokeWidth={1.2} />
            </div>
            <h3>{t('myPrompts.noPrompts')}</h3>
            <p>{t('myPrompts.noPromptsDesc')}</p>
            <button className="profile-create-btn" onClick={() => setFilter('all')} style={{ background: 'var(--surface-container-high)', color: 'var(--on-surface)' }}>
              <span>{t('myPrompts.clearFilter')}</span>
            </button>
          </div>
        ) : (
          <MasonryGrid
            items={filteredItems}
            onToggleLike={handleToggleLike}
            onToggleBookmark={handleToggleBookmark}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}

        <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
        {loading && !initialLoading && (
          <div className="profile-load-more">
            <div className="profile-loading-spinner small" />
            <span>{t('myPrompts.loadingMore')}</span>
          </div>
        )}
        {!hasMore && items.length > 0 && (
          <div className="profile-end-marker">
            <span>{t('myPrompts.endReached')}</span>
          </div>
        )}
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('myPrompts.deleteTitle')}
        message={t('myPrompts.deleteConfirm')}
      />

      <CreatePromptModal
        key={editingPrompt ? `edit-${editingPrompt.id}` : 'create-my'}
        isOpen={!!editingPrompt || showCreateModal}
        onClose={() => { setEditingPrompt(null); setShowCreateModal(false); }}
        prompt={editingPrompt}
        onUpdate={handleUpdate}
      />

      <Toast message={toast} />
    </div>
  );
};

export default MyPrompts;
