import React from 'react';
import { Cloud, RefreshCw, Calendar, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import appLogo from '../../assets/App_logo.png';

export const Header = () => {
  const { 
    data, 
    syncing, 
    triggerGoogleDriveSync, 
    selectedDate, 
    setSelectedDate,
    goToPreviousDay,
    goToNextDay,
    goToToday,
  } = useAppData();

  const restaurantName = data?.restaurant_info?.name || 'My Hotel & Restaurant';
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Today';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
    return dateStr;
  };

  return (
    <header style={{
      padding: '10px 14px',
      backgroundColor: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      position: 'sticky',
      top: 0,
      zIndex: 40,
      boxShadow: '0 2px 8px -2px rgba(15, 23, 42, 0.04)',
    }}>
      {/* Top Row: Logo, Title & Sync */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            overflow: 'hidden',
            boxShadow: '0 2px 6px rgba(5, 150, 105, 0.2)',
            border: '1.5px solid rgba(5, 150, 105, 0.3)',
            backgroundColor: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <img 
              src={appLogo} 
              alt="App Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
              <Sparkles size={11} color="var(--primary)" />
              <span style={{
                fontSize: 9.5,
                fontWeight: 800,
                color: 'var(--primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}>
                5-Star Management
              </span>
            </div>
            <h1 style={{
              fontSize: 15.5,
              fontWeight: 900,
              color: 'var(--text-main)',
              letterSpacing: '-0.3px',
              lineHeight: 1.1,
            }}>
              {restaurantName}
            </h1>
          </div>
        </div>

        <button
          onClick={triggerGoogleDriveSync}
          disabled={syncing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backgroundColor: syncing ? 'var(--secondary-light)' : 'var(--primary-light)',
            border: `1px solid ${syncing ? 'rgba(79, 70, 229, 0.3)' : 'rgba(5, 150, 105, 0.3)'}`,
            padding: '5px 9px',
            borderRadius: 18,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {syncing ? (
            <RefreshCw size={12} color="var(--secondary)" className="spin-animation" />
          ) : (
            <Cloud size={12} color="var(--primary)" />
          )}
          <span style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: syncing ? 'var(--secondary)' : 'var(--primary)',
          }}>
            {syncing ? 'Syncing...' : 'Drive'}
          </span>
        </button>
      </div>

      {/* Bottom Row: Date Switcher Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8FAFC',
        padding: '4px 6px',
        borderRadius: 10,
        border: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <button
            onClick={goToPreviousDay}
            title="Previous Day"
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: 6,
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronLeft size={13} />
          </button>

          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '2px 7px',
            borderRadius: 6,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            cursor: 'pointer',
          }}>
            <Calendar size={12} color="var(--primary)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>
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
              borderRadius: 6,
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {!isToday ? (
            <button
              onClick={goToToday}
              style={{
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-dark)',
                border: '1px solid rgba(5, 150, 105, 0.2)',
                borderRadius: 6,
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              Today
            </button>
          ) : (
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '2px 6px',
              borderRadius: 6,
            }}>
              ● TODAY
            </span>
          )}

          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>
            {data.owners?.length || 0}P • {data.staff?.length || 0}S
          </span>
        </div>
      </div>
    </header>
  );
};