import React, { useState, useEffect } from 'react';
import { X, Heart, Copy, Check, Bookmark, Eye, Link } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE;

const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE}${url}`;
};

const PromptDetailModal = ({ id, initialData, onClose, onInteractionSync, showToast }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [promptData, setPromptData] = useState(initialData || null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(initialData?.imageUrl || (initialData?.images?.[0]?.imageUrl ? resolveImageUrl(initialData.images[0].imageUrl) : null));
  const [isLiked, setIsLiked] = useState(initialData?.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(initialData?.isBookmarked || false);
  const [likesCount, setLikesCount] = useState(initialData?.likesCount || 0);
  const [bookmarksCount, setBookmarksCount] = useState(initialData?.bookmarksCount || 0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchPrompt = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/prompts/${id}`, {
          credentials: 'include',
          priority: 'high'
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
  }, [id, user]);

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
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/prompts/${id}/like`, {
        method: 'POST',
        credentials: 'include'
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
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/prompts/${id}/bookmark`, {
        method: 'POST',
        credentials: 'include'
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
              <div className="loader">{t('promptDetail.loading')}</div>
            </div>
          ) : !promptData ? (
            <div className="modal-error-container">
              <div className="error-message">{t('promptDetail.notFound')}</div>
            </div>
          ) : (
            <div className="prompt-split-container modal-layout">
              <div className="prompt-image-pane">
                {activeImage?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video
                    src={activeImage}
                    className="prompt-main-image-split"
                    autoPlay
                    loop
                    playsInline
                    controls
                  />
                ) : (
                  <img
                    src={activeImage}
                    alt="Main Prompt"
                    className="prompt-main-image-split"
                  />
                )}
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
                  <h3 className="section-label-minimal">{t('promptDetail.variations')}</h3>
                  <div className="variations-row">
                    {promptData.images?.map((img, idx) => (
                      <div
                        key={img.id}
                        className={`variation-thumb-sq ${activeImage === resolveImageUrl(img.imageUrl) ? 'active' : ''}`}
                        onClick={() => setActiveImage(resolveImageUrl(img.imageUrl))}
                      >
                        {resolveImageUrl(img.imageUrl)?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video
                            src={resolveImageUrl(img.imageUrl)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            muted
                            playsInline
                          />
                        ) : (
                          <img src={resolveImageUrl(img.imageUrl)} alt={`Variation ${idx + 1}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Creative Concept (Prompt) */}
                <section className="info-section-prompt">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 className="section-label-minimal" style={{ margin: 0 }}>{t('promptDetail.creativeConcept')}</h3>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ position: 'relative' }}>
                        {copied && (
                          <div className="copy-tooltip-above">
                            {t('promptDetail.copiedShort')}
                          </div>
                        )}
                        <button
                          className={`prompt-toolbar-btn ${copied ? 'active' : ''}`}
                          onClick={() => copyToClipboard(promptData.content)}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                          <span>{t('promptDetail.copyPrompt')}</span>
                        </button>
                      </div>
                      {promptData.source && (
                        <a
                          href={promptData.source.startsWith('http') ? promptData.source : `https://${promptData.source}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View source"
                          className="prompt-toolbar-btn"
                        >
                          <Link size={16} />
                        </a>
                      )}
                      <button
                        className={`prompt-toolbar-btn ${isLiked ? 'active-like' : ''}`}
                        onClick={handleToggleLike}
                        title="Like"
                      >
                        <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                        <span>{likesCount}</span>
                      </button>
                      <button
                        className={`prompt-toolbar-btn ${isBookmarked ? 'active-save' : ''}`}
                        onClick={handleToggleBookmark}
                        title="Bookmark"
                      >
                        <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
                        <span>{bookmarksCount}</span>
                      </button>
                    </div>
                  </div>
                  <div className="prompt-text-boxed">
                    {promptData.content}
                  </div>
                </section>

                {/* AI Model & Tags */}
                {(promptData.aiModel || (promptData.tags && promptData.tags.length > 0)) && (
                  <section className="info-section">
                    <h3 className="section-label-minimal">AI Model & Tags</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {promptData.aiModel && (
                        <span className="badge-model" style={{ padding: '8px 16px', background: 'var(--primary, #3b82f6)', color: 'var(--on-primary, #ffffff)', borderRadius: '100px', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                          {promptData.aiModel}
                        </span>
                      )}
                      {promptData.tags?.map(promptTag => (
                        <span key={promptTag.tag?.id} className="badge-tag" style={{ padding: '8px 16px', background: 'var(--surface-variant, #f1f5f9)', color: 'var(--on-surface-variant, #475569)', borderRadius: '100px', fontSize: '13px', fontWeight: 500, border: '1px solid rgba(0,0,0,0.05)', transition: 'all 0.2s ease', cursor: 'default' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary, #3b82f6)'; e.currentTarget.style.color = 'var(--primary, #3b82f6)'; e.currentTarget.style.background = '#ffffff'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'var(--on-surface-variant, #475569)'; e.currentTarget.style.background = 'var(--surface-variant, #f1f5f9)'; }}
                        >
                          #{promptTag.tag?.name}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Footer Stats */}
                {/* <footer className="prompt-modal-footer">
                  <div className="footer-stat">{t('promptDetail.published')}</div>
                </footer> */}
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
