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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#F8FAFC',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#0F172A',
          textAlign: 'center',
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 16,
            padding: '32px 24px',
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 24,
              fontWeight: 'bold',
            }}>
              !
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 20 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '10px 20px',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppDataProvider>
        <RootApp />
      </AppDataProvider>
    </ErrorBoundary>
  );
}
