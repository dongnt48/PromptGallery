import React, { useState, useRef, useEffect } from 'react';
import { Heart, Bookmark, Copy, Check, Pencil, Trash2, Link, Video } from 'lucide-react';
import PromptDetailModal from './PromptDetailModal';
import Toast, { useToast, copyWithToast } from './Toast';
import Masonry from 'masonry-layout';
import imagesLoaded from 'imagesloaded';

const MasonryGrid = ({ items, onToggleLike, onToggleBookmark, onInteractionSync, onEdit, onDelete, onLayoutComplete }) => {
  const { toast, showToast } = useToast();
  
  const gridRef = useRef(null);
  const masonryRef = useRef(null);
  const prevItemCountRef = useRef(0);

  useEffect(() => {
    if (!gridRef.current) return;
    
    // transitionDuration: 0 = repositioning is INSTANT (invisible to user, no "jumping")
    masonryRef.current = new Masonry(gridRef.current, {
      itemSelector: '.masonry-item',
      columnWidth: '.grid-sizer',
      percentPosition: true,
      transitionDuration: 0
    });

    return () => {
      if (masonryRef.current) masonryRef.current.destroy();
    };
  }, []);

  useEffect(() => {
    if (!gridRef.current || !masonryRef.current) return;
    
    const allItems = gridRef.current.querySelectorAll('.masonry-item');
    const prevCount = prevItemCountRef.current;
    const currentCount = allItems.length;

    if (currentCount === 0) {
      prevItemCountRef.current = 0;
      if (onLayoutComplete) onLayoutComplete();
      return;
    }

    // Full reset (page changed, filter changed, etc.)
    if (currentCount <= prevCount) {
      prevItemCountRef.current = currentCount;
      masonryRef.current.reloadItems();
      masonryRef.current.layout();
      
      const imgLoad = imagesLoaded(gridRef.current);
      imgLoad.on('progress', function(instance, image) {
        if (image.img) {
          const el = image.img.closest('.masonry-item');
          if (el) el.classList.add('loaded');
        }
      });
      imgLoad.on('always', function() {
        if (masonryRef.current) masonryRef.current.layout();
        if (onLayoutComplete) onLayoutComplete();
      });
      return;
    }

    // === INCREMENTAL ADD: only process NEW items ===
    const newItems = Array.from(allItems).slice(prevCount);
    prevItemCountRef.current = currentCount;

    // Add new elements to Masonry
    masonryRef.current.appended(newItems);

    // Immediately show items that have no images to load
    newItems.forEach(item => {
      const imgs = item.querySelectorAll('img');
      const videos = item.querySelectorAll('video');
      if (imgs.length === 0 && videos.length === 0) {
        item.classList.add('loaded');
      }
    });

    // Track loading of new items only — reveal each card as its image loads,
    // but DON'T call layout() until ALL new images are done.
    let loadedCount = 0;
    const totalNew = newItems.length;

    newItems.forEach(item => {
      const imgLoad = imagesLoaded(item);
      
      imgLoad.on('progress', function(instance, image) {
        // Just reveal the card, no layout() call = no jumping
        if (image.img) {
          const el = image.img.closest('.masonry-item');
          if (el) el.classList.add('loaded');
        }
      });

      imgLoad.on('always', function() {
        loadedCount++;
        if (loadedCount >= totalNew) {
          // ONE single layout after all new images loaded
          if (masonryRef.current) masonryRef.current.layout();
          if (onLayoutComplete) onLayoutComplete();
        }
      });
    });

  }, [items, onLayoutComplete]);

  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const openPrompt = (item) => setSelectedPrompt(item);
  const closePrompt = () => setSelectedPrompt(null);

  return (
    <>
      <div className="masonry-grid-absolute" ref={gridRef} style={{ margin: '0 auto' }}>
        <div className="grid-sizer"></div>
        {items.map((item, index) => (
          <div key={item.id || index} className="masonry-item" onClick={() => openPrompt(item)}>
            <PromptCard
              item={item}
              onVideoLoaded={null}
              onLike={() => onToggleLike(item.id)}
              onBookmark={() => onToggleBookmark(item.id)}
              onCopy={() => copyWithToast(item.prompt, showToast)}
              onEdit={onEdit ? () => onEdit(item) : null}
              onDelete={onDelete ? () => onDelete(item.id) : null}
            />
          </div>
        ))}
      </div>

      {selectedPrompt && (
        <PromptDetailModal
          id={selectedPrompt.id}
          initialData={{
            ...selectedPrompt,
            content: selectedPrompt.prompt,
            aiModel: selectedPrompt.model,
            source: selectedPrompt.source,
            user: {
              name: selectedPrompt.author?.name,
              avatarUrl: selectedPrompt.author?.avatar,
              username: selectedPrompt.author?.name
            },
            images: selectedPrompt.images || [{ id: 'main', imageUrl: selectedPrompt.imageUrl }]
          }}
          onClose={closePrompt}
          onInteractionSync={onInteractionSync}
          showToast={showToast}
        />
      )}

      <Toast message={toast} />
    </>
  );
};

const PromptCard = ({ item, onLike, onBookmark, onCopy, onEdit, onDelete, onVideoLoaded }) => {
  const [justCopied, setJustCopied] = useState(false);
  const videoRef = useRef(null);
  const isVideo = item.imageUrl?.match(/\.(mp4|webm|ogg|mov)$/i);

  const handleMouseEnter = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.play().catch(() => { });
    }
  };

  const handleMouseLeave = () => {
    if (isVideo && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onCopy();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  };

  return (
    <div
      className="prompt-card transition-smooth shadow-soft"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="prompt-card-image" style={{ position: 'relative' }}>
        {isVideo ? (
          <>
            <video
              ref={videoRef}
              src={item.imageUrl}
              poster={item.thumbnailUrl || undefined}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              muted
              loop
              playsInline
              preload="metadata"
              onLoadedMetadata={(e) => {
                const itemElement = e.target.closest('.masonry-item');
                if (itemElement) itemElement.classList.add('loaded');
                if (onVideoLoaded) onVideoLoaded();
              }}
              onTimeUpdate={(e) => {
                if (e.target.currentTime >= 3) {
                  e.target.currentTime = 0;
                  e.target.play().catch(() => { });
                }
              }}
            />
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '50%',
              padding: '6px',
              display: 'flex',
              backdropFilter: 'blur(4px)'
            }}>
              <Video size={16} color="white" />
            </div>
          </>
        ) : (
          <img 
            src={item.imageUrl} 
            alt={item.title || "AI Generated Image"} 
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.minHeight = '200px';
              e.target.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            }}
          />
        )}
      </div>
      <div className="prompt-card-overlay">
        <div className="prompt-card-header" style={{ marginBottom: 0 }}>
           <div className="prompt-author">
             {item.author && (
               <img 
                 src={item.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author.name || 'User')}&background=random&size=32`} 
                 alt={item.author.name} 
                 className="author-avatar"
                 referrerPolicy="no-referrer"
                 onError={(e) => {
                   e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author.name || 'User')}&background=random&size=32`;
                 }}
               />
             )}
             <span className="author-name label-sm" style={{ textTransform: 'none', fontWeight: 600, color: '#fff' }}>{item.author?.name}</span>
           </div>
           <div className="prompt-actions" onClick={(e) => e.stopPropagation()}>
              <div className={`action-item ${item.isLiked ? 'active-like' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike(); }}>
                  <Heart size={16} fill={item.isLiked ? "#ef4444" : "none"} color={item.isLiked ? "#ef4444" : "#fff"} />
                </button>
                <span className="count-label" style={{ color: item.isLiked ? '#ef4444' : '#fff' }}>{item.likesCount || 0}</span>
              </div>
              <div className={`action-item ${item.isBookmarked ? 'active-save' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onBookmark(); }}>
                  <Bookmark size={16} fill={item.isBookmarked ? "#f59e0b" : "none"} color={item.isBookmarked ? "#f59e0b" : "#fff"} />
                </button>
                <span className="count-label" style={{ color: item.isBookmarked ? '#f59e0b' : '#fff' }}>{item.bookmarksCount || 0}</span>
              </div>
              
              {item.source && (
                <a 
                  href={item.source.startsWith('http') ? item.source : `https://${item.source}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="View source"
                  onClick={(e) => e.stopPropagation()}
                  className="icon-btn-small"
                  style={{ color: '#fff' }}
                >
                  <Link size={16} />
                </a>
              )}
              
              {onEdit && (
                <button className="icon-btn-small edit-btn" style={{ color: '#fff' }} onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}>
                  <Pencil size={16} />
                </button>
              )}
              
              {onDelete && (
                <button className="icon-btn-small delete-btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(); }}>
                  <Trash2 size={16} color="#ef4444" />
                </button>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export { MasonryGrid, PromptCard };
