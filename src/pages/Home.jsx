import React, { useState } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';

const MOCK_ITEMS = [
  { id: 1, imageUrl: 'https://picsum.photos/id/10/600/800', prompt: 'A highly detailed cinematic shot of a futuristic city...', model: 'Midjourney v6', author: { name: 'Elena_V', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' } },
  { id: 2, imageUrl: 'https://picsum.photos/id/11/600/400', prompt: 'A serene mountain landscape at sunset...', model: 'DALL-E 3', author: { name: 'JohnDoe Art', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80' } },
  { id: 3, imageUrl: 'https://picsum.photos/id/12/600/900', prompt: 'Cyberpunk street view with neon lights...', model: 'Stable Diffusion XL', author: { name: 'NeonDreams', avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&q=80' } },
  { id: 4, imageUrl: 'https://picsum.photos/id/13/600/500', prompt: 'Macro photography of a water drop...', model: 'Midjourney v6', author: { name: 'MacroMaster', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' } },
  { id: 5, imageUrl: 'https://picsum.photos/id/14/600/700', prompt: 'A magical forest with glowing plants...', model: 'DALL-E 3', author: { name: 'Elena_V', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80' } },
  { id: 6, imageUrl: 'https://picsum.photos/id/15/600/600', prompt: 'Abstract fluid art with gold and blue...', model: 'Midjourney v5', author: { name: 'AbstractHero', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' } },
];

const Home = () => {
  const [items] = useState(MOCK_ITEMS);

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <MasonryGrid items={items} />
    </div>
  );
};

export default Home;
