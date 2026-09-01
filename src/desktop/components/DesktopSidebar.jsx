import React from 'react';
import { 
  LayoutDashboard, 
  CalendarClock, 
  Users2, 
  Landmark, 
  Cloud, 
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Coins,
  Banknote,
  CheckCircle2
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import appLogo from '../../assets/App_logo.png';
import { formatCurrency, calculateDaySummary } from '../../utils/accounting';

export const DesktopSidebar = ({ activeTab, onTabChange, onOpenQuickAction }) => {
  const { data, selectedDate, getDayRecord, syncing } = useAppData();
  const restaurantName = data?.restaurant_info?.name || 'My Hotel & Restaurant';
  const record = getDayRecord(selectedDate);
  const daySummary = calculateDaySummary(record);

  const isConnected = !!data?.restaurant_info?.google_drive_connected;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, badge: null },
    { id: 'daily_log', label: 'Daily Transaction Log', icon: CalendarClock, badge: record.morning_market?.length ? `${record.morning_market.length} Items` : null },
    { id: 'family_staff', label: 'Family Partners & Staff', icon: Users2, badge: `${data.owners?.length || 0}P • ${data.staff?.length || 0}S` },
    { id: 'fixed_bills', label: 'Fixed CapEx & Bills', icon: Landmark, badge: null },
    { id: 'cloud_sync', label: 'Cloud & Database', icon: Cloud, badge: isConnected ? (syncing ? 'Syncing...' : 'Synced') : 'Ready' },
  ];

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#FFFFFF',
      borderRight: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
      zIndex: 30,
      boxShadow: '2px 0 12px rgba(15, 23, 42, 0.03)',
    }}>
      {/* Brand Header with App_logo.png */}
      <div style={{
        padding: '20px 18px',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FAFBFD',
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          overflow: 'hidden',
          backgroundColor: '#0F172A',
          border: '2px solid rgba(5, 150, 105, 0.4)',
          boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img 
            src={appLogo} 
            alt="Hotel App Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        <div style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
            <Sparkles size={12} color="var(--primary)" />
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
            }}>
              5-Star Management
            </span>
          </div>
          <h2 style={{
            fontSize: 15,
            fontWeight: 900,
            color: 'var(--text-main)',
            letterSpacing: '-0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {restaurantName}
          </h2>
        </div>
      </div>

      {/* Navigation Menu */}
      <div style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <div style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.8px',
          padding: '0 10px 8px 10px',
        }}>
          Navigation Menu
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '11px 12px',
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: 13,
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon 
                    size={18} 
                    color={isActive ? 'var(--primary-dark)' : 'var(--text-muted)'} 
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 8,
                    backgroundColor: isActive ? 'var(--primary)' : '#F1F5F9',
                    color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Action Buttons on Desktop Sidebar */}
        <div style={{ marginTop: 24 }}>
          <div style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            padding: '0 10px 8px 10px',
          }}>
            Quick Desk Entry
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              onClick={() => onOpenQuickAction('market')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 10,
                border: '1px solid rgba(225, 29, 72, 0.2)',
                backgroundColor: 'var(--rose-light)',
                color: 'var(--rose)',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={14} />
              <span>+ Bazar</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('sales')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 10,
                border: '1px solid rgba(5, 150, 105, 0.2)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-dark)',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              <TrendingUp size={14} />
              <span>+ Sales</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('pocket_money')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 10,
                border: '1px solid rgba(147, 51, 234, 0.2)',
                backgroundColor: 'var(--purple-light)',
                color: 'var(--purple)',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              <Coins size={14} />
              <span>+ Pocket</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('staff_advance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 10px',
                borderRadius: 10,
                border: '1px solid rgba(8, 145, 178, 0.2)',
                backgroundColor: 'var(--cyan-light)',
                color: 'var(--cyan)',
                fontWeight: 700,
                fontSize: 11.5,
                cursor: 'pointer',
              }}
            >
              <Banknote size={14} />
              <span>+ Advance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Balance Widget at bottom of Sidebar */}
      <div style={{
        padding: '14px',
        backgroundColor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Current Drawer Cash
          </span>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 6,
            backgroundColor: daySummary.has_closed ? 'var(--primary-light)' : 'var(--amber-light)',
            color: daySummary.has_closed ? 'var(--primary-dark)' : 'var(--amber)',
          }}>
            {daySummary.has_closed ? 'Sealed' : 'Active'}
          </span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
          {formatCurrency(daySummary.expected_cash)}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
          Float: {formatCurrency(daySummary.opening_float)} • Sales: {formatCurrency(daySummary.total_sales)}
        </div>
      </div>
    </aside>
  );
};
