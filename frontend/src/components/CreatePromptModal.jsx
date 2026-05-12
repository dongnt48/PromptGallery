import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Image as ImageIcon, Tag, Globe, Lock, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGES = 5;
const AI_MODELS = ['Midjourney', 'DALL-E 3', 'Stable Diffusion XL', 'Flux', 'Leonardo AI', 'Adobe Firefly', 'Other'];

const CreatePromptModal = ({ isOpen, onClose, prompt = null, onUpdate = null }) => {
  const { token } = useAuth();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);

  const isEdit = !!prompt;

  // Initialize state directly from prompt (for edit mode) or empty (for create mode)
  const [content, setContent] = useState(prompt?.prompt || '');
  const [aiModel, setAiModel] = useState(prompt?.model || '');
  const [isPublic, setIsPublic] = useState(prompt?.isPublic !== undefined ? prompt.isPublic : true);
  const [tags, setTags] = useState(() => {
    if (prompt?.tags) {
      return prompt.tags.map(t => typeof t === 'string' ? t : t.tag?.name || t.name);
    }
    return [];
  });
  const [tagInput, setTagInput] = useState('');
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

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `"${file.name}" is not a valid image. Accepted: JPG, PNG, WebP, GIF`;
    }
    if (file.size > 10 * 1024 * 1024) {
      return `"${file.name}" exceeds 10MB limit`;
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
      const tag = tagInput.trim().replace(',', '');
      if (tag && !tags.includes(tag) && tags.length < 10) {
        setTags(prev => [...prev, tag]);
        setTagInput('');
      }
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (index) => {
    setTags(prev => prev.filter((_, i) => i !== index));
  };

  const pollJobStatus = async (jobId) => {
    const maxAttempts = 20;
    let attempts = 0;

    const poll = async () => {
      attempts++;
      try {
        const res = await fetch(`http://localhost:3000/prompts/status/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
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
    if (!content.trim()) newErrors.content = 'Prompt content is required';
    if (!aiModel) newErrors.aiModel = 'Please select an AI model';
    if (images.length === 0) newErrors.images = 'At least 1 image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (isEdit) {
        // Handle update
        const res = await fetch(`http://localhost:3000/prompts/${prompt.id}`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            aiModel,
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
        formData.append('isPublic', isPublic.toString());
        formData.append('tags', JSON.stringify(tags));

        images.forEach(img => {
          if (img.file) formData.append('images', img.file);
        });

        const res = await fetch('http://localhost:3000/prompts', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });

        const result = await res.json();

        if (result.jobId) {
          pollJobStatus(result.jobId);
          resetForm();
          onClose();
          addNotification({ message: '⏳ Creating your prompt...', type: 'info' });
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: `Failed to ${isEdit ? 'update' : 'submit'}. Please try again.` });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setContent('');
    setAiModel('');
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
          <h2>{isEdit ? 'Edit Prompt' : 'Create New Prompt'}</h2>
          <button className="modal-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="create-modal-body">
          {/* Prompt Input */}
          <div className="create-field">
            <label className="create-label">
              Prompt Content <span className="required">*</span>
            </label>
            <textarea
              className={`create-textarea ${errors.content ? 'input-error' : ''}`}
              placeholder="Describe your AI-generated image prompt in detail..."
              value={content}
              onChange={(e) => { setContent(e.target.value); setErrors(prev => ({ ...prev, content: undefined })); }}
              rows={4}
            />
            {errors.content && <span className="field-error">{errors.content}</span>}
          </div>

          {/* AI Model + Visibility Row */}
          <div className="create-row">
            <div className="create-field" style={{ flex: 1 }}>
              <label className="create-label">
                AI Model <span className="required">*</span>
              </label>
              <select
                className={`create-select ${errors.aiModel ? 'input-error' : ''}`}
                value={aiModel}
                onChange={(e) => { setAiModel(e.target.value); setErrors(prev => ({ ...prev, aiModel: undefined })); }}
              >
                <option value="">Select model...</option>
                {AI_MODELS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              {errors.aiModel && <span className="field-error">{errors.aiModel}</span>}
            </div>

            <div className="create-field" style={{ flex: 0 }}>
              <label className="create-label">Visibility</label>
              <button
                className={`visibility-toggle ${isPublic ? 'public' : 'private'}`}
                onClick={() => setIsPublic(!isPublic)}
                type="button"
              >
                {isPublic ? <Globe size={16} /> : <Lock size={16} />}
                <span>{isPublic ? 'Public' : 'Private'}</span>
              </button>
            </div>
          </div>

          {/* Image Upload */}
          <div className="create-field">
            <label className="create-label">
              Images {!isEdit && <span className="required">*</span>}
              <span className="label-hint">
                {isEdit ? 'Existing images associated with this prompt' : `${images.length}/${MAX_IMAGES} — First image will be the cover`}
              </span>
            </label>

            {/* Image Preview Grid */}
            {images.length > 0 && (
              <div className="upload-preview-grid">
                {images.map((img, idx) => (
                  <div key={idx} className={`upload-preview-item ${idx === 0 ? 'is-cover' : ''}`}>
                    <img src={img.preview} alt={`Upload ${idx + 1}`} />
                    {idx === 0 && <span className="cover-badge">Cover</span>}
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
                <p className="upload-text">Drag & drop images or <span className="upload-link">browse</span></p>
                <p className="upload-hint">JPG, PNG, WebP, GIF • Max 10MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
              </div>
            )}
            {!isEdit && errors.images && <span className="field-error">{errors.images}</span>}
          </div>

          {/* Tags Input */}
          <div className="create-field">
            <label className="create-label">
              Tags
              <span className="label-hint">Press Enter or comma to add</span>
            </label>
            <div className="tag-input-container">
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
                placeholder={tags.length === 0 ? 'e.g. cyberpunk, portrait, cinematic...' : ''}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="create-modal-footer">
          {errors.submit && <span className="field-error" style={{ marginRight: 'auto' }}>{errors.submit}</span>}
          <button className="btn-cancel" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className="btn-create"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>{isEdit ? 'Saving...' : 'Creating...'}</>
            ) : (
              <>
                <CheckCircle size={18} />
                {isEdit ? 'Save Changes' : 'Create Prompt'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePromptModal;
