import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2 } from 'lucide-react';

export const DesktopDeleteConfirmModal = ({
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
        padding: '24px',
      }}>
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
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
          }}
        />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          style={{
            position: 'relative',
            zIndex: 111,
            width: '100%',
            maxWidth: '440px',
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px 24px 24px 24px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.3)',
            border: '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <div style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            backgroundColor: 'var(--rose-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1.5px solid rgba(225, 29, 72, 0.25)',
          }}>
            <AlertTriangle size={28} color="var(--rose)" />
          </div>

          <h3 style={{
            fontSize: 19,
            fontWeight: 900,
            color: 'var(--text-main)',
            marginBottom: 8,
          }}>
            {title}
          </h3>

          {itemName && (
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '12px 14px',
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-main)' }}>{itemName}</span>
              {itemAmount !== undefined && (
                <span style={{ fontSize: 14, fontWeight: 900, color: 'var(--rose)' }}>{itemAmount}</span>
              )}
            </div>
          )}

          <p style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            marginBottom: 24,
          }}>
            {description}
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 18px',
                borderRadius: 12,
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: 'var(--text-secondary)',
                fontSize: 13.5,
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
                padding: '12px 18px',
                borderRadius: 12,
                border: 'none',
                backgroundColor: 'var(--rose)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(225, 29, 72, 0.35)',
              }}
            >
              <Trash2 size={16} />
              <span>Delete Permanently</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
