import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

export const DeleteConfirmModal = ({
  visible,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  itemAmount,
  description = 'This record will be permanently deleted from the database. This action cannot be undone.',
}) => {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 110,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
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
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
        />

        {/* Dialog Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            position: 'relative',
            zIndex: 111,
            width: '100%',
            maxWidth: '380px',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px 20px 20px 20px',
            boxShadow: '0 20px 35px -10px rgba(15, 23, 42, 0.25)',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          {/* Warning Icon Badge */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: 'var(--rose-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            border: '1px solid rgba(225, 29, 72, 0.2)',
          }}>
            <AlertTriangle size={26} color="var(--rose)" />
          </div>

          <h3 style={{
            fontSize: 17,
            fontWeight: 800,
            color: 'var(--text-main)',
            marginBottom: 6,
          }}>
            {title}
          </h3>

          {itemName && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '10px 12px',
              margin: '10px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{itemName}</span>
              {itemAmount !== undefined && (
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--rose)' }}>{itemAmount}</span>
              )}
            </div>
          )}

          <p style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 20,
          }}>
            {description}
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: 'var(--rose)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(225, 29, 72, 0.3)',
              }}
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
