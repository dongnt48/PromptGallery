import React, { useState } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';

const SAVED_ITEMS = [
  { id: 1, imageUrl: 'https://picsum.photos/id/16/600/800', prompt: 'Vintage car on a desert road...', model: 'Midjourney v6', author: { name: 'Elena_V', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' } },
  { id: 4, imageUrl: 'https://picsum.photos/id/13/600/500', prompt: 'Macro photography of a water drop...', model: 'Midjourney v6', author: { name: 'MacroMaster', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' } },
];

const MyLibrary = () => {
  const [items] = useState(SAVED_ITEMS);

  return (
    <div className="page-container">
      <div style={{ marginBottom: '40px' }}>
        <h1 className="display-lg">My Library</h1>
        <p className="body-lg" style={{ color: 'var(--on-surface-variant)', marginTop: '16px' }}>Your saved and created prompts.</p>
      </div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button className="btn-primary" style={{ height: '40px', padding: '0 16px' }}>Saved</button>
        <button className="btn-primary" style={{ background: 'var(--surface-container)', color: 'var(--on-surface)', height: '40px', padding: '0 16px' }}>Created</button>
      </div>
      <MasonryGrid items={items} />
    </div>
  );
};

export default MyLibrary;
