import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Copy, Share2, Eye, Bookmark, ExternalLink } from 'lucide-react';

const ArtworkDetail = () => {
  const { id } = useParams();
  const [artwork, setArtwork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const response = await fetch(`http://localhost:3000/prompts/${id}`);
        const data = await response.json();
        setArtwork(data);
        if (data.images && data.images.length > 0) {
          setActiveImage(data.images[0].imageUrl);
        }
      } catch (error) {
        console.error('Error fetching artwork:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loader">Loading artwork...</div>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="page-container">
        <div className="error-message">Artwork not found</div>
      </div>
    );
  }

  return (
    <div className="artwork-detail-page">
      <div className="artwork-hero-section">
        <div className="artwork-main-display">
          <div className="artwork-image-wrapper">
            <img 
              src={activeImage} 
              alt="Main Artwork" 
              className="main-artwork-image"
            />
            <div className="artwork-image-overlay"></div>
          </div>
          
          <div className="artwork-hero-content">
            <Link to="/" className="back-button-glass">
              <ArrowLeft size={20} />
              <span>Back</span>
            </Link>
            
            <div className="artwork-variations-bar">
              {artwork.images.map((img, idx) => (
                <div 
                  key={img.id} 
                  className={`variation-thumb ${activeImage === img.imageUrl ? 'active' : ''}`}
                  onClick={() => setActiveImage(img.imageUrl)}
                >
                  <img src={img.imageUrl} alt={`Variation ${idx + 1}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="artwork-content-grid page-container">
        <div className="artwork-info-main">
          <section className="prompt-section-premium">
            <div className="section-header">
              <h2 className="label-sm">THE PROMPT</h2>
              <button className="btn-copy-glass" onClick={() => copyToClipboard(artwork.content)}>
                <Copy size={16} />
                <span>Copy Prompt</span>
              </button>
            </div>
            <p className="prompt-text-display">{artwork.content}</p>
            
            {artwork.negativePrompt && (
              <div className="negative-prompt-box">
                <span className="label-sm">NEGATIVE PROMPT</span>
                <p className="negative-text">{artwork.negativePrompt}</p>
              </div>
            )}
            
            <div className="tag-cloud">
              {artwork.tags?.map((t) => (
                <span key={t.tag.id} className="tag-chip-premium">#{t.tag.name}</span>
              ))}
            </div>
          </section>

          <section className="generation-data-glass">
            <h2 className="label-sm">TECHNICAL DATA</h2>
            <div className="data-grid-premium">
              <div className="data-item">
                <span className="data-label">AI Model</span>
                <p className="data-value">{artwork.aiModel}</p>
              </div>
              <div className="data-item">
                <span className="data-label">Seed</span>
                <p className="data-value">{artwork.seed || 'Random'}</p>
              </div>
              <div className="data-item">
                <span className="data-label">Sampler</span>
                <p className="data-value">{artwork.sampler || 'Default'}</p>
              </div>
              <div className="data-item">
                <span className="data-label">Steps / CFG</span>
                <p className="data-value">{artwork.steps || '-' } / {artwork.cfgScale || '-'}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="artwork-sidebar-premium">
          <div className="author-card-premium">
            <img 
              src={artwork.user.avatarUrl || `https://ui-avatars.com/api/?name=${artwork.user.name || artwork.user.username}&background=random`} 
              alt={artwork.user.username} 
              className="author-avatar-large"
            />
            <div className="author-details">
              <h3 className="author-name">{artwork.user.name || artwork.user.username}</h3>
              <p className="author-title">Elite Creator • 12.8k followers</p>
            </div>
            <button className="btn-follow">Follow</button>
          </div>

          <div className="stats-row-premium">
            <div className="stat-box">
              <Heart size={20} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">2.4k</span>
                <span className="stat-label">Appreciations</span>
              </div>
            </div>
            <div className="stat-box">
              <Eye size={20} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">{artwork.viewsCount || 0}</span>
                <span className="stat-label">Views</span>
              </div>
            </div>
            <div className="stat-box">
              <Bookmark size={20} className="stat-icon" />
              <div className="stat-info">
                <span className="stat-value">842</span>
                <span className="stat-label">Collections</span>
              </div>
            </div>
          </div>

          <div className="sidebar-actions-premium">
            <button className="btn-primary-large">
              <Heart size={20} />
              <span>Appreciate Artwork</span>
            </button>
            <button className="btn-secondary-large">
              <Share2 size={20} />
              <span>Share Experience</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ArtworkDetail;
