import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY || 'default_key';

const FetchInterceptor = () => {
  const { showGlobalToast } = useNotifications();

  useEffect(() => {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        let [url, config] = args;
        
        // 1. ENCRYPT REQUEST BODY
        if (config && config.body && typeof config.body === 'string') {
          try {
            // Only encrypt if it's JSON
            JSON.parse(config.body);
            const encryptedBody = CryptoJS.AES.encrypt(config.body, ENCRYPTION_KEY).toString();
            config.body = JSON.stringify({ payload: encryptedBody });
          } catch (e) {
            // Not JSON, leave body as is (e.g. FormData)
          }
        }
        
        const response = await originalFetch(url, config);
        
        if (response.status === 429) {
          showGlobalToast("Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại!");
        }

        // 2. DECRYPT RESPONSE BODY
        // We clone so we don't consume the stream
        const responseClone = response.clone();
        
        response.json = async () => {
          try {
            const text = await responseClone.text();
            if (!text) return null; // Handle empty responses gracefully

            const data = JSON.parse(text);
            if (data && typeof data === 'object' && data.payload) {
              try {
                const bytes = CryptoJS.AES.decrypt(data.payload, ENCRYPTION_KEY);
                const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
                if (decryptedString) {
                  return JSON.parse(decryptedString);
                }
              } catch (err) {
                console.error('Decryption failed', err);
              }
            }
            return data; // Return original if not encrypted or decryption fails
          } catch (err) {
            console.error('JSON parsing error in FetchInterceptor:', err);
            return null;
          }
        };

        return response;
      } catch (error) {
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch; // Cleanup on unmount
    };
  }, [showGlobalToast]);

  return null; 
};

export default FetchInterceptor;
