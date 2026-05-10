import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, Copy } from 'lucide-react';

const MasonryGrid = ({ items }) => {
  return (
    <div className="masonry-grid">
      {items.map((item, index) => (
        <div key={item.id || index} className="masonry-item">
          <Link to={`/artwork/${item.id}`} style={{ textDecoration: 'none' }}>
            <PromptCard item={item} />
          </Link>
        </div>
      ))}
    </div>
  );
};

const PromptCard = ({ item }) => {
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
           <div className="prompt-actions">
             <button className="icon-btn-small" onClick={(e) => { e.preventDefault(); /* prevent link click */ }}><Heart size={16} /></button>
             <button className="icon-btn-small" onClick={(e) => { e.preventDefault(); }}><Bookmark size={16} /></button>
           </div>
        </div>
        <p className="prompt-text body-md">{item.prompt}</p>
        <div className="prompt-meta">
          <span className="label-sm">{item.model}</span>
          <button className="btn-icon" onClick={(e) => { e.preventDefault(); }}><Copy size={14} style={{ marginRight: '6px' }}/> Copy</button>
        </div>
      </div>
    </div>
  );
};

export { MasonryGrid, PromptCard };
