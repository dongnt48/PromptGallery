import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { Tag, X, Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:3000';
const AI_MODELS = ['GPT Image 2', "GPT Image 1.5", 'Nano Banana Pro', "Gemini 3", 'Seedream 4.5', 'Seedance 2.0', "Grok Image", 'Other'];

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const Home = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const showLoginModalRef = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const observer = useRef();

  useEffect(() => {
    showLoginModalRef.current = showLoginModal;
  }, [showLoginModal]);

  // Tag & Model filter state
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  // Fetch all tags on mount
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${API_BASE}/prompts/tags/all`);
        if (res.ok) {
          const data = await res.json();
          setAllTags(data || []);
        }
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    fetchTags();
  }, []);

  const toggleTag = (slug) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(slug)
        ? prev.filter(s => s !== slug)
        : [...prev, slug];
      return newTags;
    });
  };

  const clearTags = () => {
    setSelectedTags([]);
  };

  const params = new URLSearchParams(location.search);
  const searchKeyword = params.get('search') || '';

  // Reset items when tags, model, or search change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setRefreshKey(k => k + 1);
  }, [selectedTags, selectedModel, searchKeyword]);

  const lastItemRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        if (showLoginModalRef.current) return;
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    const fetchPrompts = async () => {
      setLoading(true);
      try {
        let url = `${API_BASE}/prompts?page=${page}&limit=15`;
        if (selectedTags.length > 0) {
          url += `&tags=${selectedTags.join(',')}`;
        }
        if (selectedModel) {
          url += `&aiModel=${encodeURIComponent(selectedModel)}`;
        }
        if (searchKeyword) {
          url += `&search=${encodeURIComponent(searchKeyword)}`;
        }
        const response = await fetch(url, {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          setShowLoginModal(true);
          setPage(prev => prev - 1); // Revert page increment so next scroll tries again
          setLoading(false);
          return; // Exit early
        }

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
          source: prompt.source,
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
          if (page === 1) return formattedItems;
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
      const res = await fetch(`http://localhost:3000/prompts/${id}/like`, {
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
      const res = await fetch(`http://localhost:3000/prompts/${id}/bookmark`, {
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
      {/* Filter Bar */}
      {allTags.length > 0 && (
        <div className="tag-filter-bar">
          <div className="tag-filter-inner">
            <div className="tags-scroll-container">
              <button
                className={`tag-filter-chip ${selectedTags.length === 0 ? 'active' : ''}`}
                onClick={clearTags}
              >
                {t('explore.all', 'All')}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag.id}
                  className={`tag-filter-chip ${selectedTags.includes(tag.slug) ? 'active' : ''}`}
                  onClick={() => toggleTag(tag.slug)}
                >
                  <Tag size={13} />
                  {tag.name}
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button className="tag-filter-clear" onClick={clearTags}>
                  <X size={14} />
                  {t('explore.clearFilters', 'Clear')}
                </button>
              )}
            </div>
            <div className="model-filter-container">
              <div className="model-filter-select-wrapper">
                <Filter size={14} className="model-filter-icon" />
                <select
                  className="model-filter-select"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="">{t('explore.allModels', 'All Models')}</option>
                  {AI_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      <MasonryGrid
        items={items}
        onToggleLike={handleToggleLike}
        onToggleBookmark={handleToggleBookmark}
        onInteractionSync={syncInteraction}
      />
      <div ref={lastItemRef} style={{ height: '20px', width: '100%' }}></div>
      {loading && <div style={{ textAlign: 'center', padding: '20px' }}>Loading more...</div>}
      {!hasMore && items.length > 0 && <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>No more prompts to load.</div>}
      {!loading && items.length === 0 && selectedTags.length > 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#888' }}>
          <p style={{ fontSize: '16px', marginBottom: '12px' }}>{t('explore.noResults', 'No prompts found for the selected tags.')}</p>
          <button className="tag-filter-clear" onClick={clearTags} style={{ margin: '0 auto' }}>
            <X size={14} />
            {t('explore.clearFilters', 'Clear filters')}
          </button>
        </div>
      )}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Home;
