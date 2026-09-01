import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../../utils/accounting';

export const BreakevenCard = ({ roiData }) => {
  const [showFormula, setShowFormula] = useState(false);
  const {
    initial_capital,
    cumulative_daily_profit,
    total_bills_paid,
    total_owner_withdrawn,
    net_recovered,
    remaining_to_breakeven,
    breakeven_percent,
    is_breakeven_reached,
    total_all_time_sales,
    total_all_time_market,
  } = roiData;

  const isPositiveProgress = net_recovered > 0;
  const statusColor = is_breakeven_reached 
    ? 'var(--primary)' 
    : isPositiveProgress 
      ? 'var(--amber)' 
      : 'var(--rose)';

  return (
    <div
      className="glass-card"
      style={{
        padding: '16px',
        marginBottom: '16px',
        border: `1.5px solid ${is_breakeven_reached ? 'rgba(5, 150, 105, 0.4)' : 'rgba(217, 119, 6, 0.3)'}`,
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Top Header: Title & Status Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: `${statusColor}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {is_breakeven_reached ? (
              <ShieldCheck size={18} color="var(--primary)" />
            ) : (
              <TrendingUp size={18} color={statusColor} />
            )}
          </div>
          <div>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>
              Capital Investment & ROI Status
            </span>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {is_breakeven_reached ? 'Pure Profit Phase (+)' : 'Capital Recovery Phase (-)'}
            </div>
          </div>
        </div>

        <span style={{
          fontSize: 10.5,
          fontWeight: 900,
          padding: '4px 10px',
          borderRadius: 10,
          backgroundColor: is_breakeven_reached ? 'var(--bg-card-secondary)' : 'var(--bg-card-secondary)',
          color: is_breakeven_reached ? 'var(--text-main)' : 'var(--text-secondary)',
          letterSpacing: '0.4px',
        }}>
          {is_breakeven_reached ? '(+) 100% PROFIT' : `${breakeven_percent}% RECOVERED`}
        </span>
      </div>

      {/* Main 2-Column Financial Status Box */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        backgroundColor: '#F8FAFC',
        padding: '14px 12px',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        marginBottom: '12px',
        gap: '10px',
      }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
            Total Initial Setup Cost
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text-main)' }}>
            {formatCurrency(initial_capital)}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
            Original hotel investment
          </div>
        </div>

        <div style={{ borderLeft: '1.5px solid #E2E8F0', paddingLeft: '12px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 3 }}>
            {is_breakeven_reached ? 'Net Lifetime Profit' : 'Remaining To Breakeven'}
          </div>
          <div style={{ fontSize: 17, fontWeight: 900, color: is_breakeven_reached ? 'var(--primary)' : 'var(--rose)' }}>
            {is_breakeven_reached
              ? formatCurrency(net_recovered, true)
              : `-${formatCurrency(remaining_to_breakeven)}`}
          </div>
          <div style={{ fontSize: 10.5, color: is_breakeven_reached ? 'var(--text-main)' : 'var(--rose)', fontWeight: 700, marginTop: 2 }}>
            {is_breakeven_reached ? 'Pure Surplus (+)' : `৳${remaining_to_breakeven.toLocaleString()} left (-)`}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Investment Payback Progress:</span>
          <span style={{ fontWeight: 800, color: statusColor }}>{breakeven_percent}%</span>
        </div>
        <div style={{
          height: 9,
          backgroundColor: '#E2E8F0',
          borderRadius: 5,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(2, breakeven_percent))}%`,
            backgroundColor: statusColor,
            borderRadius: 5,
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Toggle Explanatory Math */}
      <button
        onClick={() => setShowFormula(!showFormula)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          backgroundColor: '#F1F5F9',
          borderRadius: 8,
          border: '1px solid #E2E8F0',
          fontSize: 11,
          fontWeight: 700,
          color: 'var(--text-secondary)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <HelpCircle size={13} color="var(--primary)" />
          <span>How is (+) or (-) calculated? (হিসাব বোঝার নিয়ম)</span>
        </div>
        {showFormula ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {showFormula && (
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '12px',
          marginTop: 8,
          fontSize: 11.5,
          lineHeight: 1.5,
          color: 'var(--text-secondary)',
        }}>
          <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
            Investment Recovery Breakdown:
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>1. Initial Hotel Setup Cost (বিনিয়োগ):</span>
            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(initial_capital)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>2. All-Time Sales (মোট বিক্রি):</span>
            <span style={{ fontWeight: 800, color: 'var(--primary)' }}>+{formatCurrency(total_all_time_sales)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>3. Raw Material Bazar Cost (বাজার খরচ):</span>
            <span style={{ fontWeight: 800, color: 'var(--rose)' }}>-{formatCurrency(total_all_time_market)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>4. Monthly Bills Paid (ভাড়া ও বিল):</span>
            <span style={{ fontWeight: 800, color: 'var(--amber)' }}>-{formatCurrency(total_bills_paid)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
            <span>5. Pocket Money Taken (পকেট মানি):</span>
            <span style={{ fontWeight: 800, color: 'var(--purple)' }}>-{formatCurrency(total_owner_withdrawn)}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: '6px',
            marginTop: '6px',
            borderTop: '1px solid #E2E8F0',
            fontWeight: 800,
          }}>
            <span style={{ color: 'var(--text-main)' }}>Net Recovered to Date (উত্তোলিত লাভ):</span>
            <span style={{ color: isPositiveProgress ? 'var(--primary)' : 'var(--rose)' }}>
              {formatCurrency(net_recovered, true)}
            </span>
          </div>
          <p style={{ marginTop: 8, fontSize: 10.5, color: 'var(--text-muted)' }}>
            💡 মূলধন {initial_capital > 0 ? `(${formatCurrency(initial_capital)}) ` : ''}সম্পূর্ণ উঠে না আসা পর্যন্ত ব্যালেন্স রিকভারি মোডে (-) থাকবে। মূলধন উঠে গেলে এটি স্বয়ংক্রিয়ভাবে গ্রিন প্লাস (+) জোনে চলে যাবে।
          </p>
        </div>
      )}
    </div>
  );
};
