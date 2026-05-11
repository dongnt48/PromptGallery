import React, { useState, useCallback } from 'react';
import { Check } from 'lucide-react';

let showToastGlobal = null;

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, duration = 2000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  }, []);

  showToastGlobal = showToast;

  return { toast, showToast };
};

export const copyWithToast = async (text, showToast) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✅ Copied to clipboard!');
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('✅ Copied to clipboard!');
  }
};

const Toast = ({ message }) => {
  if (!message) return null;

  return (
    <div className="toast-notification">
      <Check size={16} />
      <span>{message}</span>
    </div>
  );
};

export default Toast;
