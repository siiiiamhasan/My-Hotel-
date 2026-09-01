import React from 'react';
import { motion } from 'framer-motion';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor = 'var(--primary)',
  bgColor,
  glow = false,
  badge,
  badgeColor,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.015 } : {}}
      whileTap={onClick ? { scale: 0.985 } : {}}
      onClick={onClick}
      className="glass-card"
      style={{
        padding: '14px',
        marginBottom: '10px',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: bgColor || '#FFFFFF',
        borderColor: glow ? accentColor : '#E2E8F0',
        boxShadow: glow ? `0 4px 16px -2px ${accentColor}22` : 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Icon && (
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              backgroundColor: `${accentColor}18`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Icon size={16} color={accentColor} />
            </div>
          )}
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}>
            {title}
          </span>
        </div>

        {badge && (
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: 10,
            backgroundColor: `${badgeColor || accentColor}18`,
            color: badgeColor || accentColor,
          }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{
        fontSize: 20,
        fontWeight: 900,
        color: accentColor,
        letterSpacing: '-0.4px',
        margin: '2px 0',
      }}>
        {value}
      </div>

      {subtitle && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
          {subtitle}
        </div>
      )}
    </motion.div>
  );
};
