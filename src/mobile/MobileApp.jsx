import React, { useState } from 'react';
import { Header } from './components/Header';
import { TabBar } from './components/TabBar';
import { DashboardScreen } from './screens/DashboardScreen';
import { DailyLogScreen } from './screens/DailyLogScreen';
import { FamilyStaffScreen } from './screens/FamilyStaffScreen';
import { ExpensesScreen } from './screens/ExpensesScreen';
import { CloudSettingsScreen } from './screens/CloudSettingsScreen';
import { useAppData } from '../context/AppDataContext';

export const MobileApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { selectedDate } = useAppData();

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            key={selectedDate}
            onNavigateTab={setActiveTab}
            onOpenQuickAction={(action) => {
              if (action === 'market' || action === 'sales') {
                setActiveTab('daily_log');
              } else if (action === 'pocket_money' || action === 'staff_advance') {
                setActiveTab('family_staff');
              }
            }}
          />
        );
      case 'daily_log':
        return <DailyLogScreen key={selectedDate} />;
      case 'family_staff':
        return <FamilyStaffScreen key={selectedDate} />;
      case 'fixed_bills':
        return <ExpensesScreen key={selectedDate} />;
      case 'cloud_sync':
        return <CloudSettingsScreen key={selectedDate} />;
      default:
        return <DashboardScreen onNavigateTab={setActiveTab} />;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      backgroundColor: 'var(--bg-main)',
    }}>
      <Header />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {renderActiveScreen()}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default MobileApp;
