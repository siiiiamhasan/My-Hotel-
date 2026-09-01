import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const CustomModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '480px',
}) => {
  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(4px)',
            }}
          />

          {/* Sheet / Drawer Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'relative',
              zIndex: 101,
              width: '100%',
              maxWidth: maxWidth,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              borderTop: '1px solid #E2E8F0',
              borderLeft: '1px solid #E2E8F0',
              borderRight: '1px solid #E2E8F0',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -10px 40px -10px rgba(15, 23, 42, 0.18)',
            }}
          >
            {/* Drag Handle */}
            <div style={{
              width: '42px',
              height: '4.5px',
              backgroundColor: '#CBD5E1',
              borderRadius: '3px',
              alignSelf: 'center',
              marginTop: '10px',
              marginBottom: '6px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: '1px solid #E2E8F0',
            }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{title}</h3>
                {subtitle && <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 2 }}>{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="btn-icon"
                style={{ padding: '6px' }}
              >
                <X size={18} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Content Body */}
            <div style={{
              padding: '20px',
              overflowY: 'auto',
              flex: 1,
            }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
