import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import CreatePromptModal from '../components/CreatePromptModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Toast, { useToast } from '../components/Toast';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const MyPrompts = () => {
  const { token, user } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingPrompt, setEditingPrompt] = useState(null);
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
    const fetchMyPrompts = async () => {
      if (!token) return;

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/prompts/my?page=${page}&limit=10`, {
          headers: { 'Authorization': `Bearer ${token}` }
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

    fetchMyPrompts();
  }, [page, token, refreshKey]);

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
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setItems(prev => prev.filter(item => item.id !== deleteId));
        showToast('✅ Prompt deleted successfully');
      } else {
        const err = await res.json();
        showToast('❌ ' + (err.message || 'Failed to delete prompt'));
      }
    } catch (error) {
      console.error('Error deleting prompt:', error);
      showToast('❌ An error occurred while deleting');
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
    showToast('✅ Prompt updated successfully');
  };

  if (!token) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>My Prompts</h2>
        <p style={{ color: 'var(--on-surface-variant)', marginBottom: '2rem' }}>Please log in to view your prompts.</p>
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
        <h5 style={{ fontSize: '1.5rem', color: 'var(--on-background)' }}>My Prompts</h5>
        <p style={{ color: 'var(--on-surface-variant)', marginTop: '0.5rem' }}>You have created {items.length} prompts.</p>
      </header>

      {items.length === 0 && !loading ? (
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <p style={{ color: '#888', fontSize: '1.2rem' }}>You haven't created any prompts yet.</p>
        </div>
      ) : (
        <MasonryGrid
          items={items}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onDelete={handleDelete}
          onEdit={handleEdit}
        />
      )}

      <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>}
      {!hasMore && items.length > 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>End of your prompts.</div>}

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      <ConfirmDeleteModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Prompt"
        message="Are you sure you want to delete this prompt? This action cannot be undone."
      />

      <CreatePromptModal
        key={editingPrompt ? `edit-${editingPrompt.id}` : 'create'}
        isOpen={!!editingPrompt}
        onClose={() => setEditingPrompt(null)}
        prompt={editingPrompt}
        onUpdate={handleUpdate}
      />

      <Toast message={toast} />
    </div>
  );
};

export default MyPrompts;
