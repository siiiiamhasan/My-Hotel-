import React from 'react';
import { LayoutDashboard, CalendarClock, Users2, Landmark, Cloud } from 'lucide-react';

export const TabBar = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'daily_log', label: 'Daily Log', icon: CalendarClock },
    { id: 'family_staff', label: 'Family & Staff', icon: Users2 },
    { id: 'fixed_bills', label: 'Fixed & Bills', icon: Landmark },
    { id: 'cloud_sync', label: 'Cloud & Sync', icon: Cloud },
  ];

  return (
    <nav style={{
      display: 'flex',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      paddingTop: 8,
      paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      paddingLeft: 4,
      paddingRight: 4,
      position: 'sticky',
      bottom: 0,
      zIndex: 40,
      boxShadow: '0 -2px 10px -2px rgba(15, 23, 42, 0.04)',
    }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0',
              position: 'relative',
            }}
          >
            <div style={{
              padding: '6px 12px',
              borderRadius: 12,
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
              marginBottom: 3,
              transition: 'all 0.2s',
            }}>
              <Icon
                size={19}
                color={isActive ? 'var(--primary-dark)' : 'var(--text-muted)'}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
            </div>
            <span style={{
              fontSize: 10.5,
              fontWeight: isActive ? 800 : 600,
              color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
