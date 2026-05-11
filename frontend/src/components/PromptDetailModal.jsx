import React, { useState, useEffect } from 'react';
import { X, Heart, Copy, Check, Bookmark, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const API_BASE = 'http://localhost:3000';

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const PromptDetailModal = ({ id, onClose, onInteractionSync, showToast }) => {
  const { token } = useAuth();
  const [promptData, setPromptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPrompt = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/prompts/${id}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        setPromptData(data);
        if (data.images && data.images.length > 0) {
          setActiveImage(resolveImageUrl(data.images[0].imageUrl));
        }
        setIsLiked(data.isLiked || false);
        setIsBookmarked(data.isBookmarked || false);
        setLikesCount(data.likesCount || 0);
        setBookmarksCount(data.bookmarksCount || 0);
      } catch (error) {
        console.error('Error fetching prompt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrompt();
  }, [id, token]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    if (showToast) showToast('✅ Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLike = async () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/prompts/${id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setIsLiked(result.liked);
      setLikesCount(prev => result.liked ? prev + 1 : prev - 1);
      
      // Sync with parent list
      if (onInteractionSync) {
        onInteractionSync(id, 'like', result.liked);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleToggleBookmark = async () => {
    if (!token) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`http://localhost:3000/prompts/${id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      setIsBookmarked(result.bookmarked);
      setBookmarksCount(prev => result.bookmarked ? prev + 1 : prev - 1);
      
      // Sync with parent list
      if (onInteractionSync) {
        onInteractionSync(id, 'bookmark', result.bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  if (!id) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="prompt-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>

          {loading ? (
            <div className="modal-loader-container">
              <div className="loader">Loading prompt...</div>
            </div>
          ) : !promptData ? (
            <div className="modal-error-container">
              <div className="error-message">Prompt not found</div>
            </div>
          ) : (
            <div className="prompt-split-container modal-layout">
              <div className="prompt-image-pane">
                <img
                  src={activeImage}
                  alt="Main Prompt"
                  className="prompt-main-image-split"
                />
              </div>
              <div className="prompt-info-pane">
                {/* Author Section at the very top */}
                <div className="author-card-minimal">
                  <img
                    src={promptData.user?.avatarUrl || `https://ui-avatars.com/api/?name=${promptData.user?.name || promptData.user?.username}&background=random`}
                    alt={promptData.user?.username}
                    className="author-avatar-minimal"
                  />
                  <div className="author-details-minimal">
                    <h4 className="author-name-minimal">{promptData.user?.name || promptData.user?.username}</h4>
                    {/* <p className="author-subtitle-minimal">Elite Creator • 12.8k followers</p> */}
                  </div>
                </div>

                {/* Variations */}
                <section className="info-section">
                  <h3 className="section-label-minimal">VARIATIONS</h3>
                  <div className="variations-row">
                    {promptData.images?.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`variation-thumb-sq ${activeImage === resolveImageUrl(img.imageUrl) ? 'active' : ''}`}
                        onClick={() => setActiveImage(resolveImageUrl(img.imageUrl))}
                      >
                        <img src={resolveImageUrl(img.imageUrl)} alt={`Variation ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </section>

                {/* Creative Concept (Prompt) */}
                <section className="info-section-prompt">
                  <h3 className="section-label-minimal">CREATIVE CONCEPT</h3>
                  <div className="prompt-text-boxed">
                    {promptData.content}
                  </div>
                </section>

                {/* Interaction Bar */}
                <div className="interaction-bar-refined">
                  <button className={`btn-copy-black ${copied ? 'btn-copied' : ''}`} onClick={() => copyToClipboard(promptData.content)}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                  <div className="interaction-stats-row">
                    <div 
                      className={`stat-icon-group clickable ${isLiked ? 'active-like' : ''}`} 
                      onClick={handleToggleLike}
                    >
                      <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                      <span className="stat-text">{likesCount}</span>
                    </div>
                    <div 
                      className={`stat-icon-group clickable ${isBookmarked ? 'active-save' : ''}`} 
                      onClick={handleToggleBookmark}
                    >
                      <Bookmark size={20} fill={isBookmarked ? "currentColor" : "none"} />
                      <span className="stat-text">{bookmarksCount}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Stats */}
                <footer className="prompt-modal-footer">
                  <div className="footer-stat">Published 2 days ago</div>
                </footer>
              </div>
            </div>
          )}
        </div>
      </div>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
};

export default PromptDetailModal;
