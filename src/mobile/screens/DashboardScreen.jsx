import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Banknote, 
  Coins, 
  Sparkles,
  Calendar,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppData } from '../../context/AppDataContext';
import { 
  formatCurrency, 
  calculateDaySummary, 
  calculatePeriodSummary, 
  calculateBreakevenROI,
  calculateYesterdayComparison
} from '../../utils/accounting';
import { BreakevenCard } from '../components/BreakevenCard';
import { StatCard } from '../components/StatCard';

export const DashboardScreen = ({ onNavigateTab, onOpenQuickAction }) => {
  const { 
    data, 
    selectedDate, 
    getDayRecord, 
    selectedPeriod, 
    setSelectedPeriod 
  } = useAppData();

  const todayRecord = getDayRecord(selectedDate);
  const daySummary = calculateDaySummary(todayRecord);
  const periodSummary = calculatePeriodSummary(data, selectedPeriod, selectedDate);
  const roiData = calculateBreakevenROI(data);
  const yesterdayComp = calculateYesterdayComparison(selectedDate, data);

  const periods = [
    { id: 'day', label: 'Daily' },
    { id: 'week', label: 'Weekly' },
    { id: 'month', label: 'Monthly' },
    { id: 'year', label: 'Yearly' },
    { id: 'all', label: 'All-Time' },
  ];

  return (
    <div style={{ padding: '14px', paddingBottom: '24px' }}>
      {/* 1. PERIOD FILTER SELECTOR */}
      <div style={{
        display: 'flex',
        backgroundColor: '#FFFFFF',
        padding: '3px',
        borderRadius: 12,
        border: '1px solid #E5E7EB',
        marginBottom: '14px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      }}>
        {periods.map((p) => {
          const isSelected = selectedPeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 2px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. PERIOD FINANCIAL SUMMARY HERO CARD */}
      <motion.div
        key={selectedPeriod + selectedDate}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
        style={{
          padding: '16px',
          marginBottom: '14px',
          backgroundColor: '#FFFFFF',
          border: `1.5px solid ${periodSummary.is_positive ? 'rgba(5, 150, 105, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
          boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={15} color="var(--primary)" />
            <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--text-main)' }}>
              {periodSummary.periodLabel} Overview
            </span>
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 7px',
            borderRadius: 7,
            backgroundColor: periodSummary.is_positive ? 'var(--bg-card-secondary)' : 'var(--rose-light)',
            color: periodSummary.is_positive ? 'var(--text-main)' : 'var(--rose)',
          }}>
            {periodSummary.is_positive ? 'NET SURPLUS' : 'NET DEFICIT'}
          </span>
        </div>

        {/* Big Remaining Cash Box */}
        <div style={{
          backgroundColor: '#F8FAFC',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid #E2E8F0',
          marginBottom: '12px',
        }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>
            Net Cash Remaining in Hand (সব খরচের পর অবশিষ্ট লাভ)
          </div>
          <div style={{
            fontSize: 24,
            fontWeight: 900,
            color: periodSummary.is_positive ? 'var(--primary)' : 'var(--rose)',
            letterSpacing: '-0.5px',
          }}>
            {formatCurrency(periodSummary.net_remaining_cash, true)}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
            Calculated from {periodSummary.records_count} active daily logs
          </div>
        </div>

        {/* Financial Breakdown Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: 11 }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>1. Total Sell (মোট বিক্রি)</div>
            <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
              {formatCurrency(periodSummary.total_sales)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>2. Bazar / Raw Cost (বাজার)</div>
            <div style={{ fontWeight: 800, color: 'var(--rose)', marginTop: 2 }}>
              -{formatCurrency(periodSummary.total_market)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>3. Gross Profit (ব্যবসায়িক লাভ)</div>
            <div style={{ fontWeight: 800, color: periodSummary.gross_profit >= 0 ? 'var(--primary)' : 'var(--rose)', marginTop: 2 }}>
              {formatCurrency(periodSummary.gross_profit)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>4. Staff Advance/Beton (বেতন)</div>
            <div style={{ fontWeight: 800, color: 'var(--cyan)', marginTop: 2 }}>
              -{formatCurrency(periodSummary.total_staff_advances)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>5. Pocket Money (পকেট মানি)</div>
            <div style={{ fontWeight: 800, color: 'var(--purple)', marginTop: 2 }}>
              -{formatCurrency(periodSummary.total_owner_drawings)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>6. Monthly Bills Paid (বিল)</div>
            <div style={{ fontWeight: 800, color: 'var(--amber)', marginTop: 2 }}>
              -{formatCurrency(periodSummary.total_bills_paid)}
            </div>
          </div>

          {periodSummary.total_fixed_assets > 0 && (
            <div style={{ backgroundColor: '#F8FAFC', padding: '7px 9px', borderRadius: 8, border: '1px solid #E2E8F0', gridColumn: 'span 2' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 700 }}>7. Fixed Equipment CapEx (ফিক্সড সম্পদ)</div>
              <div style={{ fontWeight: 800, color: 'var(--rose)', marginTop: 2 }}>
                -{formatCurrency(periodSummary.total_fixed_assets)}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 3. TODAY'S 4 CORE PILLARS CARD */}
      <div style={{
        fontSize: 11.5,
        fontWeight: 800,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginBottom: '8px',
      }}>
        Today's 4 Financial Pillars ({selectedDate})
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <StatCard
          title="1. Bazar / Market"
          value={formatCurrency(daySummary.total_market)}
          subtitle={`${todayRecord.morning_market?.length || 0} items purchased`}
          icon={ShoppingBag}
          accentColor="var(--rose)"
          onClick={() => onNavigateTab('daily_log')}
        />

        <StatCard
          title="2. Total Sell"
          value={formatCurrency(daySummary.total_sales)}
          subtitle={`Cash: ${formatCurrency(daySummary.cash_sales)} | POS: ${formatCurrency(daySummary.digital_sales)}`}
          icon={TrendingUp}
          accentColor="var(--primary)"
          onClick={() => onNavigateTab('daily_log')}
        />

        <StatCard
          title="3. Cash Box / Float"
          value={formatCurrency(daySummary.expected_cash)}
          subtitle={daySummary.has_closed ? `Closing Float: ${formatCurrency(daySummary.night_closing?.next_day_opening_float)}` : 'Register balance'}
          icon={Banknote}
          accentColor="var(--amber)"
          onClick={() => onNavigateTab('daily_log')}
        />

        <StatCard
          title="4. Withdraw / Bank"
          value={formatCurrency(daySummary.total_withdrawals)}
          subtitle={`Bank: ${formatCurrency(daySummary.bank_deposit)} | Pocket: ${formatCurrency(daySummary.total_owner_drawings)}`}
          icon={Coins}
          accentColor="var(--purple)"
          onClick={() => onNavigateTab('daily_log')}
        />
      </div>

      {/* 4. YESTERDAY VS TODAY */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 14,
        padding: '12px 14px',
        marginBottom: '14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--primary)" />
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-main)' }}>
              Yesterday ({yesterdayComp.yesterdayDateStr}) vs Today
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Auto Carryover</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 10.5 }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: 7, borderRadius: 8 }}>
            <div style={{ color: 'var(--text-muted)' }}>Yesterday Float</div>
            <div style={{ fontWeight: 800, color: 'var(--amber)', marginTop: 2 }}>
              {formatCurrency(yesterdayComp.yesterdayClosingFloat || daySummary.opening_float)}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: 7, borderRadius: 8 }}>
            <div style={{ color: 'var(--text-muted)' }}>Sales Comparison</div>
            <div style={{
              fontWeight: 800,
              color: yesterdayComp.salesDiff >= 0 ? 'var(--text-main)' : 'var(--rose)',
              marginTop: 2,
            }}>
              {yesterdayComp.salesDiff >= 0 ? `+${formatCurrency(yesterdayComp.salesDiff)}` : `${formatCurrency(yesterdayComp.salesDiff)}`}
            </div>
          </div>

          <div style={{ backgroundColor: '#F8FAFC', padding: 7, borderRadius: 8 }}>
            <div style={{ color: 'var(--text-muted)' }}>Bank Deposit</div>
            <div style={{ fontWeight: 800, color: 'var(--cyan)', marginTop: 2 }}>
              {formatCurrency(yesterdayComp.yesterdayBankDeposit)}
            </div>
          </div>
        </div>
      </div>

      {/* 5. LONG-TERM CAPITAL ROI */}
      <div style={{
        fontSize: 11.5,
        fontWeight: 800,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginBottom: '8px',
      }}>
        Investment Recovery & ROI
      </div>

      <BreakevenCard roiData={roiData} />

      {/* 6. QUICK OPERATIONS SHORTCUTS */}
      <div style={{
        fontSize: 11.5,
        fontWeight: 800,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginBottom: '8px',
      }}>
        Quick Entry Shortcuts
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <button
          onClick={() => onOpenQuickAction('market')}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px',
            cursor: 'pointer',
            border: '1.5px solid rgba(225, 29, 72, 0.2)',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: 11.5,
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBag size={14} color="var(--rose)" />
          </div>
          <span>+ Morning Bazar</span>
        </button>

        <button
          onClick={() => onOpenQuickAction('sales')}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px',
            cursor: 'pointer',
            border: '1.5px solid rgba(5, 150, 105, 0.2)',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: 11.5,
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={14} color="var(--primary)" />
          </div>
          <span>+ Record Sales</span>
        </button>

        <button
          onClick={() => onOpenQuickAction('pocket_money')}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px',
            cursor: 'pointer',
            border: '1.5px solid rgba(147, 51, 234, 0.2)',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: 11.5,
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={14} color="var(--purple)" />
          </div>
          <span>+ Pocket Money</span>
        </button>

        <button
          onClick={() => onOpenQuickAction('staff_advance')}
          className="glass-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '11px',
            cursor: 'pointer',
            border: '1.5px solid rgba(8, 145, 178, 0.2)',
            color: 'var(--text-main)',
            fontWeight: 700,
            fontSize: 11.5,
            backgroundColor: '#FFFFFF',
          }}
        >
          <div style={{ width: 26, height: 26, borderRadius: 7, backgroundColor: 'var(--cyan-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Banknote size={14} color="var(--cyan)" />
          </div>
          <span>+ Staff Advance</span>
        </button>
      </div>
    </div>
  );
};
