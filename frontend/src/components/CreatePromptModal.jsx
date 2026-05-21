import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Tag, Globe, Lock, Plus, Trash2, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const MAX_IMAGES = 5;
const AI_MODELS = ['GPT Image', "Nanobanana", 'Seedance', "Midjourney"];

const CreatePromptModal = ({ isOpen, onClose, prompt = null, onUpdate = null }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { addNotification, showGlobalToast } = useNotifications();
  const fileInputRef = useRef(null);

  const isEdit = !!prompt;

  // Initialize state directly from prompt (for edit mode) or empty (for create mode)
  const [content, setContent] = useState(prompt?.prompt || '');
  const [aiModel, setAiModel] = useState(prompt?.model || '');
  const [source, setSource] = useState(prompt?.source || '');
  const [type, setType] = useState(prompt?.type || '');
  const [isPublic, setIsPublic] = useState(prompt?.isPublic !== undefined ? prompt.isPublic : true);
  const [tags, setTags] = useState(() => {
    if (prompt?.tags) {
      return prompt.tags.map(t => typeof t === 'string' ? t : t.tag?.name || t.name);
    }
    return [];
  });
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [images, setImages] = useState(() => {
    if (prompt?.images && prompt.images.length > 0) {
      return prompt.images.map(img => ({
        preview: img.url,
        isExisting: true
      }));
    }
    return [];
  });
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const res = await fetch(`${API_BASE}/prompts/tags/all`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data || []);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a valid file. Accepted: JPG, PNG, GIF, MP4, WebM`;
    }
    if (file.size > 50 * 1024 * 1024) {
      return `"${file.name}" exceeds 50MB limit`;
    }
    // Check for duplicate (same name + size + lastModified)
    const isDuplicate = images.some(
      (img) => img.file && img.file.name === file.name && img.file.size === file.size && img.file.lastModified === file.lastModified
    );
    if (isDuplicate) {
      return `"${file.name}" has already been added`;
    }
    return null;
  };

  const addImages = useCallback((files) => {
    const newErrors = {};
    const validFiles = [];

    for (const file of files) {
      if (images.length + validFiles.length >= MAX_IMAGES) {
        newErrors.images = `Maximum ${MAX_IMAGES} images allowed`;
        break;
      }
      const error = validateFile(file);
      if (error) {
        newErrors.images = error;
      } else {
        validFiles.push({
          file,
          preview: URL.createObjectURL(file),
          isExisting: false
        });
      }
    }

    if (validFiles.length > 0) {
      setImages(prev => [...prev, ...validFiles]);
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      setTimeout(() => setErrors(prev => {
        const { images, ...rest } = prev;
        return rest;
      }), 3000);
    }
  }, [images.length]);

  const removeImage = (index) => {
    setImages(prev => {
      const img = prev[index];
      if (!img.isExisting) {
        URL.revokeObjectURL(img.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addImages(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addImages(Array.from(e.target.files));
      e.target.value = ''; // Reset so same file can be selected again
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const addTag = (tagName) => {
    if (!tags.includes(tagName) && tags.length < 10) {
      setTags(prev => [...prev, tagName]);
    }
    setTagInput('');
    setShowTagDropdown(true);
  };

  const filteredTags = availableTags.filter(t =>
    t.name.toLowerCase().includes(tagInput.toLowerCase()) &&
    !tags.includes(t.name)
  );

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const pollJobStatus = async (jobId) => {
    const maxAttempts = 20;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`${API_BASE}/prompts/status/${jobId}`, {
          credentials: 'include',
        });
        const data = await res.json();

        if (data.status === 'completed') {
          addNotification({
            message: '🎉 Prompt created successfully!',
            type: 'success',
          });
          // Signal to all pages that a new prompt was created
          window.dispatchEvent(new Event('promptCreated'));
          return;
        } else if (data.status === 'failed') {
          addNotification({
            message: `❌ ${data.message}`,
            type: 'error',
          });
          return;
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 3000);
        }
      }
    };

    // Start polling after a short delay
    setTimeout(poll, 2000);
  };

  const handleSubmit = async () => {
    // Validate
    const newErrors = {};
    if (!content.trim()) newErrors.content = t('createPrompt.errorContent');
    if (images.length === 0) newErrors.images = t('createPrompt.errorImages');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit) {
        // Handle update
        const res = await fetch(`${API_BASE}/prompts/${prompt.id}`, {
          method: 'PATCH',
          credentials: 'include', headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            aiModel,
            source,
            type,
            isPublic,
            tags
          }),
        });

        if (!res.ok) throw new Error('Failed to update prompt');

        const updatedData = await res.json();
        if (onUpdate) onUpdate(updatedData);
        addNotification({ message: '✅ Prompt updated successfully', type: 'success' });
        onClose();
      } else {
        // Handle create
        const formData = new FormData();
        formData.append('content', content);
        formData.append('aiModel', aiModel);
        formData.append('source', source);
        formData.append('type', type);
        formData.append('isPublic', isPublic.toString());
        formData.append('tags', JSON.stringify(tags));

        images.forEach(img => {
          if (img.file) formData.append('images', img.file);
        });

        const res = await fetch(`${API_BASE}/prompts`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await res.json();

        if (result.jobId) {
          pollJobStatus(result.jobId);
          showGlobalToast('⏳ Creating your prompt...');
          resetForm();
          onClose();
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: isEdit ? t('createPrompt.submitErrorEdit') : t('createPrompt.submitErrorCreate') });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setAiModel('');
    setSource('');
    setType('');
    setIsPublic(true);
    setTags([]);
    setTagInput('');
    images.forEach(img => {
      if (!img.isExisting) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setErrors({});
  };

  const handleClose = () => {
    if (!isEdit) resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="create-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="create-modal-header">
          <h2>{isEdit ? t('createPrompt.editTitle') : t('createPrompt.createTitle')}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="create-modal-body">
          {/* Prompt Input */}
          <div className="create-field">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="create-label" style={{ marginBottom: 0 }}>
                {t('createPrompt.contentLabel')} <span className="required">*</span>
              </label>

              <button
                className={`visibility-toggle ${isPublic ? 'public' : 'private'}`}
                onClick={() => setIsPublic(!isPublic)}
                type="button"
                style={{ padding: '4px 10px', fontSize: '13px' }}
              >
                {isPublic ? <Globe size={14} /> : <Lock size={14} />}
                <span>{isPublic ? t('createPrompt.public') : t('createPrompt.private')}</span>
              </button>
            </div>
            <textarea
              className={`create-textarea ${errors.content ? 'input-error' : ''}`}
              placeholder={t('createPrompt.contentPlaceholder')}
              value={content}
              onChange={(e) => { setContent(e.target.value); setErrors(prev => ({ ...prev, content: undefined })); }}
              rows={4}
            />
            {errors.content && <span className="field-error">{errors.content}</span>}
          </div>




          {/* Image Upload */}
          <div className="create-field">
            <label className="create-label">
              {t('createPrompt.mediaLabel')} {!isEdit && <span className="required">*</span>}
              <span className="label-hint">
                {isEdit ? t('createPrompt.mediaHintEdit') : t('createPrompt.mediaHintCreate')}
              </span>
            </label>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="upload-preview-grid">
                {images.map((img, idx) => (
                  <div key={idx} className={`upload-preview-item ${idx === 0 ? 'is-cover' : ''}`}>
                    {img.file?.type?.startsWith('video/') || img.preview?.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                      <video src={img.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted loop playsInline />
                    ) : (
                      <img src={img.preview} alt={`Upload ${idx + 1}`} />
                    )}
                    {idx === 0 && <span className="cover-badge">{t('createPrompt.cover')}</span>}
                    {!isEdit && (
                      <button className="remove-image-btn" onClick={() => removeImage(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isEdit && images.length < MAX_IMAGES && (
              <div
                className={`upload-zone ${dragActive ? 'drag-active' : ''} ${errors.images ? 'input-error' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={24} className="upload-icon" />
                <p className="upload-text">{t('createPrompt.dragDrop')} <span className="upload-link">{t('createPrompt.browse')}</span></p>
                <p className="upload-hint">{t('createPrompt.uploadHint')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/ogg,video/quicktime"
                  multiple
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            )}
            {!isEdit && errors.images && <span className="field-error">{errors.images}</span>}
          </div>



          {/* AI Model, Source, Type Row */}
          <div className="create-row">
            <div className="create-field" style={{ flex: 1 }}>
              <label className="create-label">
                {t('createPrompt.modelLabel')}
              </label>
              <select
                className="create-select"
                value={aiModel}
                onChange={(e) => { setAiModel(e.target.value); }}
              >
                <option value="">{t('createPrompt.modelSelect')}</option>
                {AI_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="create-field" style={{ flex: 1 }}>
              <label className="create-label">{t('createPrompt.sourceLabel')}</label>
              <input
                type="text"
                className="create-input"
                placeholder={t('createPrompt.sourcePlaceholder')}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>

          </div>


          {/* Tags Input */}
          <div className="create-field">
            <label className="create-label">
              {t('createPrompt.tagsLabel')}
            </label>
            <div className="tag-input-container" style={{ position: 'relative' }}>
              {tags.map((tag, idx) => (
                <span key={idx} className="tag-chip-input">
                  {tag}
                  <button onClick={() => removeTag(idx)} type="button">
                    <X size={12} />
                  </button>
                </span>
              ))}
              <input
                className="tag-input"
                placeholder={tags.length === 0 ? t('createPrompt.tagsPlaceholder') : ''}
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setShowTagDropdown(true);
                }}
                onFocus={() => setShowTagDropdown(true)}
                onBlur={() => setTimeout(() => setShowTagDropdown(false), 200)}
                onKeyDown={handleTagKeyDown}
              />

              {/* Tag Dropdown */}
              {showTagDropdown && filteredTags.length > 0 && (
                <div className="tag-dropdown" style={{ bottom: '100%', top: 'auto', marginBottom: '4px', marginTop: 0 }}>
                  {filteredTags.map((tag) => (
                    <div
                      key={tag.id}
                      className="tag-dropdown-item"
                      onMouseDown={(e) => { e.preventDefault(); addTag(tag.name); }}
                    >
                      <Tag size={14} />
                      <span>{tag.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="create-modal-footer">
          {errors.submit && <span className="field-error" style={{ marginRight: 'auto' }}>{errors.submit}</span>}
          <button className="btn-cancel" onClick={handleClose} disabled={submitting}>
            {t('createPrompt.cancel')}
          </button>
          <button
            className="btn-create"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>{isEdit ? t('createPrompt.saving') : t('createPrompt.creating')}</>
            ) : (
              <>
                <CheckCircle size={18} />
                {isEdit ? t('createPrompt.saveChanges') : t('createPrompt.createPromptBtn')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePromptModal;
