import React, { useState } from 'react';
import { 
  CloudOff, 
  LogIn, 
  RefreshCw, 
  X, 
  ShieldAlert, 
  ArrowRight 
} from 'lucide-react';
import { DesktopSidebar } from './components/DesktopSidebar';
import { DesktopHeader } from './components/DesktopHeader';
import { DesktopDashboardScreen } from './screens/DesktopDashboardScreen';
import { DesktopDailyLogScreen } from './screens/DesktopDailyLogScreen';
import { DesktopFamilyStaffScreen } from './screens/DesktopFamilyStaffScreen';
import { DesktopExpensesScreen } from './screens/DesktopExpensesScreen';
import { DesktopCloudSettingsScreen } from './screens/DesktopCloudSettingsScreen';
import { DesktopModal } from './components/DesktopModal';
import { useAppData } from '../context/AppDataContext';

export const DesktopApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const { 
    data, 
    selectedDate, 
    addMorningMarketItem, 
    updateDailySales, 
    addOwnerDrawing, 
    addStaffAdvance,
    signInWithGoogle 
  } = useAppData();

  const isConnected = !!data?.restaurant_info?.google_drive_connected;

  // Quick Action Modal states
  const [quickActionModal, setQuickActionModal] = useState(null); // 'market' | 'sales' | 'pocket_money' | 'staff_advance'
  const [quickMarketName, setQuickMarketName] = useState('');
  const [quickMarketAmount, setQuickMarketAmount] = useState('');
  const [quickSalesCash, setQuickSalesCash] = useState('');
  const [quickSalesDigital, setQuickSalesDigital] = useState('');
  const [quickDrawingOwnerId, setQuickDrawingOwnerId] = useState(data.owners?.[0]?.id || '');
  const [quickDrawingAmount, setQuickDrawingAmount] = useState('');
  const [quickAdvanceStaffId, setQuickAdvanceStaffId] = useState(data.staff?.[0]?.id || '');
  const [quickAdvanceAmount, setQuickAdvanceAmount] = useState('');

  const handleBannerConnect = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DesktopDashboardScreen
            key={selectedDate}
            onNavigateTab={setActiveTab}
            onOpenQuickAction={(action) => setQuickActionModal(action)}
          />
        );
      case 'daily_log':
        return <DesktopDailyLogScreen key={selectedDate} />;
      case 'family_staff':
        return <DesktopFamilyStaffScreen key={selectedDate} />;
      case 'fixed_bills':
        return <DesktopExpensesScreen key={selectedDate} />;
      case 'cloud_sync':
        return <DesktopCloudSettingsScreen />;
      default:
        return <DesktopDashboardScreen onNavigateTab={setActiveTab} onOpenQuickAction={(action) => setQuickActionModal(action)} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--bg-main)',
    }}>
      {/* 1. Left Sidebar Navigation */}
      <DesktopSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAction={(action) => setQuickActionModal(action)}
      />

      {/* 2. Main Content Viewport */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        height: '100vh',
        overflow: 'hidden',
      }}>
        <DesktopHeader onNavigateTab={setActiveTab} />

        {/* Cloud Status Banner (When Google Drive is inactive) */}
        {!isConnected && !bannerDismissed && (
          <div style={{
            backgroundColor: '#EFF6FF',
            borderBottom: '1px solid #BFDBFE',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            zIndex: 20,
            animation: 'fadeIn 0.2s ease-in',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: '#DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
                flexShrink: 0,
              }}>
                <CloudOff size={16} />
              </div>
              <div style={{ fontSize: 13, color: '#1E3A8A' }}>
                <strong>Cloud backup is inactive.</strong> Your data is stored safely locally. Connect Google Drive for automatic cloud synchronization.
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button
                onClick={handleBannerConnect}
                disabled={isSigningIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: isSigningIn ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                {isSigningIn ? <RefreshCw size={13} className="spin-animation" /> : <LogIn size={13} />}
                <span>{isSigningIn ? 'Connecting...' : 'Connect Google Drive'}</span>
              </button>

              <button
                onClick={() => setBannerDismissed(true)}
                title="Dismiss Banner"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  padding: '4px',
                  cursor: 'pointer',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {renderActiveScreen()}
        </main>
      </div>

      {/* Quick Action Modal: Bazar */}
      <DesktopModal
        visible={quickActionModal === 'market'}
        onClose={() => setQuickActionModal(null)}
        title="Quick Entry: Morning Bazar"
        subtitle={`Record grocery or kitchen item purchased on ${selectedDate}`}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Item Name & Description
          </label>
          <input
            className="input-field"
            placeholder="e.g. Chicken 10kg, Cooking Oil 5L"
            value={quickMarketName}
            onChange={(e) => setQuickMarketName(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Cost Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 3500"
            value={quickMarketAmount}
            onChange={(e) => setQuickMarketAmount(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            if (!quickMarketName || !quickMarketAmount) return;
            addMorningMarketItem(selectedDate, {
              item_name: quickMarketName,
              amount: Number(quickMarketAmount),
              category: 'GROCERY',
              paid_from: 'CASH_DRAWER',
              buyer: data.owners?.[0]?.name || 'Owner',
            });
            setQuickMarketName('');
            setQuickMarketAmount('');
            setQuickActionModal(null);
          }}
          className="btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          Save Bazar Item
        </button>
      </DesktopModal>

      {/* Quick Action Modal: Sales */}
      <DesktopModal
        visible={quickActionModal === 'sales'}
        onClose={() => setQuickActionModal(null)}
        title="Quick Entry: Daily Sales"
        subtitle={`Record today's gross customer sales on ${selectedDate}`}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Cash Sales (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter cash sales"
            value={quickSalesCash}
            onChange={(e) => setQuickSalesCash(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Digital / bKash / Cards (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter digital sales"
            value={quickSalesDigital}
            onChange={(e) => setQuickSalesDigital(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            updateDailySales(selectedDate, Number(quickSalesCash || 0), Number(quickSalesDigital || 0));
            setQuickSalesCash('');
            setQuickSalesDigital('');
            setQuickActionModal(null);
          }}
          className="btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          Update Sales
        </button>
      </DesktopModal>

      {/* Quick Action Modal: Pocket Money */}
      <DesktopModal
        visible={quickActionModal === 'pocket_money'}
        onClose={() => setQuickActionModal(null)}
        title="Quick Entry: Partner Pocket Money"
        subtitle={`Cash withdrawn from register on ${selectedDate}`}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Partner
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(data.owners || []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setQuickDrawingOwnerId(o.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: quickDrawingOwnerId === o.id ? 800 : 600,
                  backgroundColor: quickDrawingOwnerId === o.id ? 'var(--purple-light)' : '#F1F5F9',
                  color: quickDrawingOwnerId === o.id ? 'var(--purple)' : 'var(--text-secondary)',
                  border: `1.5px solid ${quickDrawingOwnerId === o.id ? 'var(--purple)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 1000"
            value={quickDrawingAmount}
            onChange={(e) => setQuickDrawingAmount(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            if (!quickDrawingAmount) return;
            addOwnerDrawing(selectedDate, quickDrawingOwnerId, Number(quickDrawingAmount), 'Quick Pocket Money');
            setQuickDrawingAmount('');
            setQuickActionModal(null);
          }}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--purple)' }}
        >
          Save Pocket Money
        </button>
      </DesktopModal>

      {/* Quick Action Modal: Staff Advance */}
      <DesktopModal
        visible={quickActionModal === 'staff_advance'}
        onClose={() => setQuickActionModal(null)}
        title="Quick Entry: Staff Advance"
        subtitle={`Cash advance given to employee on ${selectedDate}`}
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Staff Member
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(data.staff || []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setQuickAdvanceStaffId(s.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: quickAdvanceStaffId === s.id ? 800 : 600,
                  backgroundColor: quickAdvanceStaffId === s.id ? 'var(--cyan-light)' : '#F1F5F9',
                  color: quickAdvanceStaffId === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: `1.5px solid ${quickAdvanceStaffId === s.id ? 'var(--cyan)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 500"
            value={quickAdvanceAmount}
            onChange={(e) => setQuickAdvanceAmount(e.target.value)}
          />
        </div>
        <button
          onClick={() => {
            if (!quickAdvanceAmount) return;
            addStaffAdvance(selectedDate, quickAdvanceStaffId, Number(quickAdvanceAmount), 'Daily Advance');
            setQuickAdvanceAmount('');
            setQuickActionModal(null);
          }}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--cyan)' }}
        >
          Save Staff Advance
        </button>
      </DesktopModal>
    </div>
  );
};

export default DesktopApp;
