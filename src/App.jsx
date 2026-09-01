import React, { useState, useEffect } from 'react';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { MobileApp } from './mobile/MobileApp';
import { DesktopApp } from './desktop/DesktopApp';
import { Monitor } from 'lucide-react';

const RootApp = () => {
  const { loading } = useAppData();
  
  // Detect screen size initially and listen for resize
  const [isLargeScreen, setIsLargeScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 860 : false
  );
  // viewMode can be 'auto', 'desktop', or 'mobile'
  const [viewMode, setViewMode] = useState('auto');

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 860);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeMode = viewMode === 'auto' ? (isLargeScreen ? 'desktop' : 'mobile') : viewMode;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--bg-main)',
        color: 'var(--text-secondary)',
      }}>
        <div style={{
          width: 38,
          height: 38,
          border: '3.5px solid var(--border-color)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'spin 0.9s linear infinite',
          marginBottom: 14,
        }} />
        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Initializing Hotel Master DB...</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Connecting Google Cloud & Local Storage</span>
      </div>
    );
  }

  // If in desktop viewport (or wide screen)
  if (isLargeScreen) {
    return <DesktopApp />;
  }

  // Mobile App on phones / Android APK
  return <MobileApp />;
};

export default function App() {
  return (
    <AppDataProvider>
      <RootApp />
    </AppDataProvider>
  );
}
