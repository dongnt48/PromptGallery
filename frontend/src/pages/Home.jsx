import React, { useState, useEffect } from 'react';
import { MasonryGrid } from '../components/MasonryGrid';

const Home = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const response = await fetch('http://localhost:3000/prompts');
        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }
        const data = await response.json();
        
        // Map backend data to MasonryGrid expected format
        const formattedItems = data.map(prompt => ({
          id: prompt.id,
          imageUrl: prompt.images && prompt.images.length > 0 ? prompt.images[0].imageUrl : '',
          prompt: prompt.content,
          model: prompt.aiModel,
          author: {
            name: prompt.user.username,
            avatar: prompt.user.avatar_url
          }
        }));
        
        setItems(formattedItems);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  if (loading) return <div className="page-container" style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  if (error) return <div className="page-container" style={{ padding: '40px', textAlign: 'center', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="page-container" style={{ paddingBottom: '40px' }}>
      <MasonryGrid items={items} />
    </div>
  );
};

export default Home;
