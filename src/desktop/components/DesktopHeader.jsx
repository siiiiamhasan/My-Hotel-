import React from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { SyncBadge } from './SyncBadge';

export const DesktopHeader = ({ onNavigateTab }) => {
  const { 
    selectedDate, 
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
  } = useAppData();

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Today';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    }
    return dateStr;
  };

  return (
    <header style={{
      height: '68px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 25,
      boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
    }}>
      {/* Left: Date Navigation Hub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#F8FAFC',
          padding: '5px 8px',
          borderRadius: 12,
          border: '1.5px solid #E2E8F0',
        }}>
          <button
            onClick={goToPreviousDay}
            title="Previous Day"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '5px 14px',
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
          }}>
            <Calendar size={16} color="var(--primary)" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
              {formatDateLabel(selectedDate)}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: 0,
                cursor: 'pointer',
              }}
            />
          </div>

          <button
            onClick={goToNextDay}
            title="Next Day"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {!isToday ? (
          <button
            onClick={goToToday}
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary-dark)',
              border: '1.5px solid rgba(5, 150, 105, 0.3)',
              borderRadius: 10,
              padding: '8px 14px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Jump to Today
          </button>
        ) : (
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
            padding: '6px 12px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            LIVE TODAY
          </span>
        )}
      </div>

      {/* Right: Cloud Sync Hub using SyncBadge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SyncBadge onNavigateToCloudSettings={() => onNavigateTab && onNavigateTab('cloud_sync')} />
      </div>
    </header>
  );
};
