import React, { createContext, useContext, useState, useCallback } from 'react';
import './ToastModal.css';

const ToastModalContext = createContext();

export const ToastModalProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [modalConfig, setModalConfig] = useState(null);
  const [promptInput, setPromptInput] = useState('');

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toastSuccess = useCallback((msg) => showToast(msg, 'success'), [showToast]);
  const toastError = useCallback((msg) => showToast(msg, 'error'), [showToast]);
  const toastInfo = useCallback((msg) => showToast(msg, 'info'), [showToast]);

  const confirm = useCallback(({ title = 'Confirmation', message, confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false }) => {
    return new Promise((resolve) => {
      setModalConfig({
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        onConfirm: () => {
          setModalConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(false);
        }
      });
    });
  }, []);

  const prompt = useCallback(({ title = 'Input Required', message = '', placeholder = '', confirmText = 'Submit', cancelText = 'Cancel' }) => {
    setPromptInput('');
    return new Promise((resolve) => {
      setModalConfig({
        type: 'prompt',
        title,
        message,
        placeholder,
        confirmText,
        cancelText,
        onConfirm: (val) => {
          setModalConfig(null);
          resolve(val);
        },
        onCancel: () => {
          setModalConfig(null);
          resolve(null);
        }
      });
    });
  }, []);

  return (
    <ToastModalContext.Provider value={{ showToast, toastSuccess, toastError, toastInfo, confirm, prompt }}>
      {children}

      <div className="mc-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`mc-toast mc-toast-${t.type}`}>
            <span className="mc-toast-message">{t.message}</span>
            <button
              className="mc-toast-close"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {modalConfig && (
        <div className="mc-dialog-overlay" onClick={modalConfig.onCancel}>
          <div className="mc-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="mc-dialog-header">
              <h4>{modalConfig.title}</h4>
              <button className="mc-dialog-close" onClick={modalConfig.onCancel}>×</button>
            </div>
            <div className="mc-dialog-body">
              {modalConfig.message && <p>{modalConfig.message}</p>}
              {modalConfig.type === 'prompt' && (
                <textarea
                  className="mc-dialog-input"
                  rows="3"
                  placeholder={modalConfig.placeholder}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  autoFocus
                />
              )}
            </div>
            <div className="mc-dialog-footer">
              <button className="mc-dialog-btn cancel" onClick={modalConfig.onCancel}>
                {modalConfig.cancelText}
              </button>
              <button
                className={`mc-dialog-btn confirm ${modalConfig.isDanger ? 'danger' : ''}`}
                onClick={() => {
                  if (modalConfig.type === 'prompt') {
                    modalConfig.onConfirm(promptInput);
                  } else {
                    modalConfig.onConfirm();
                  }
                }}
              >
                {modalConfig.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastModalContext.Provider>
  );
};

export const useDialog = () => {
  const context = useContext(ToastModalContext);
  if (!context) {
    throw new Error('useDialog must be used within a ToastModalProvider');
  }
  return context;
};