import React, { useState } from 'react';
import { Heart, Bookmark, Copy, Check, Pencil, Trash2 } from 'lucide-react';
import PromptDetailModal from './PromptDetailModal';
import Toast, { useToast, copyWithToast } from './Toast';

const MasonryGrid = ({ items, onToggleLike, onToggleBookmark, onInteractionSync, onEdit, onDelete }) => {
  const [selectedPromptId, setSelectedPromptId] = useState(null);
  const { toast, showToast } = useToast();

  const openPrompt = (id) => setSelectedPromptId(id);
  const closePrompt = () => setSelectedPromptId(null);

  return (
    <>
      <div className="masonry-grid">
        {items.map((item, index) => (
          <div key={item.id || index} className="masonry-item" onClick={() => openPrompt(item.id)}>
            <PromptCard 
              item={item} 
              onLike={() => onToggleLike(item.id)} 
              onBookmark={() => onToggleBookmark(item.id)}
              onCopy={() => copyWithToast(item.prompt, showToast)}
              onEdit={onEdit ? () => onEdit(item) : null}
              onDelete={onDelete ? () => onDelete(item.id) : null}
            />
          </div>
        ))}
      </div>

      {selectedPromptId && (
        <PromptDetailModal 
          id={selectedPromptId} 
          onClose={closePrompt} 
          onInteractionSync={onInteractionSync}
          showToast={showToast}
        />
      )}

      <Toast message={toast} />
    </>
  );
};

const PromptCard = ({ item, onLike, onBookmark, onCopy, onEdit, onDelete }) => {
  const [justCopied, setJustCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onCopy();
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 1500);
  };

  return (
    <div className="prompt-card transition-smooth shadow-soft">
      <div className="prompt-card-image">
        <img src={item.imageUrl} alt={item.title || "AI Generated Image"} loading="lazy" />
      </div>
      <div className="prompt-card-overlay glass">
        <div className="prompt-card-header">
           <div className="prompt-author">
             {item.author && <img src={item.author.avatar} alt={item.author.name} className="author-avatar" />}
             <span className="author-name label-sm" style={{ textTransform: 'none', fontWeight: 600 }}>{item.author?.name}</span>
           </div>
           <div className="prompt-actions" onClick={(e) => e.stopPropagation()}>
              <div className={`action-item ${item.isLiked ? 'active-like' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onLike(); }}>
                  <Heart size={16} fill={item.isLiked ? "#ef4444" : "none"} color={item.isLiked ? "#ef4444" : "currentColor"} />
                </button>
                <span className="count-label">{item.likesCount || 0}</span>
              </div>
              <div className={`action-item ${item.isBookmarked ? 'active-save' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="icon-btn-small" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onBookmark(); }}>
                  <Bookmark size={16} fill={item.isBookmarked ? "#f59e0b" : "none"} color={item.isBookmarked ? "#f59e0b" : "currentColor"} />
                </button>
                <span className="count-label">{item.bookmarksCount || 0}</span>
              </div>
              
              {onEdit && (
                <button className="icon-btn-small edit-btn" onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(); }}>
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
        <p className="prompt-text body-md">{item.prompt}</p>
        <div className="prompt-meta">
          <span className="label-sm">{item.model}</span>
          <button className={`btn-icon ${justCopied ? 'btn-copied' : ''}`} onClick={handleCopy}>
            {justCopied ? <Check size={14} style={{ marginRight: '6px' }} /> : <Copy size={14} style={{ marginRight: '6px' }} />}
            {justCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
};

export { MasonryGrid, PromptCard };
