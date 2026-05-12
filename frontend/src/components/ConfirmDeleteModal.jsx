import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div className="confirm-header">
          <div className="confirm-icon-wrapper">
            <AlertTriangle size={32} />
          </div>
          <h2>{title || 'Delete Prompt'}</h2>
          <p>{message || 'Are you sure you want to delete this prompt? This action cannot be undone.'}</p>
        </div>

        <div className="confirm-actions">
          <button className="confirm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="confirm-btn-delete" 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
