import React from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Banknote, 
  Coins, 
  Sparkles,
  Calendar,
  ShieldCheck,
  Plus
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

export const DesktopDashboardScreen = ({ onNavigateTab, onOpenQuickAction }) => {
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
    { id: 'day', label: 'Daily View' },
    { id: 'week', label: 'Weekly Summary' },
    { id: 'month', label: 'Monthly Report' },
    { id: 'year', label: 'Yearly Financials' },
    { id: 'all', label: 'All-Time Lifetime' },
  ];

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* 1. Header with Period Filter Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '22px',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Executive Financial Dashboard
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Real-time multi-period accounts, daily cashier ledger & capital ROI
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: '#FFFFFF',
          padding: '3px',
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}>
          {periods.map((p) => {
            const isSelected = selectedPeriod === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPeriod(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: 12.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Top Row: Today's 4 Financial Pillars */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* 1. Morning Bazar */}
        <div 
          onClick={() => onNavigateTab('daily_log')}
          className="glass-card" 
          style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              1. Bazar / Market
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={18} color="var(--rose)" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--rose)', letterSpacing: '-0.5px' }}>
            {formatCurrency(daySummary.total_market)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {todayRecord.morning_market?.length || 0} raw material items today
          </div>
        </div>

        {/* 2. Total Gross Sales */}
        <div 
          onClick={() => onNavigateTab('daily_log')}
          className="glass-card" 
          style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              2. Total Sales
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="var(--primary)" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)', letterSpacing: '-0.5px' }}>
            {formatCurrency(daySummary.total_sales)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Cash: {formatCurrency(daySummary.cash_sales)} • POS: {formatCurrency(daySummary.digital_sales)}
          </div>
        </div>

        {/* 3. Cash Box / Register Float */}
        <div 
          onClick={() => onNavigateTab('daily_log')}
          className="glass-card" 
          style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              3. Cash Box / Float
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={18} color="var(--amber)" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--amber)', letterSpacing: '-0.5px' }}>
            {formatCurrency(daySummary.expected_cash)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {daySummary.has_closed ? `Closing Float: ${formatCurrency(daySummary.night_closing?.next_day_opening_float)}` : `Opening Float: ${formatCurrency(daySummary.opening_float)}`}
          </div>
        </div>

        {/* 4. Withdrawals & Bank */}
        <div 
          onClick={() => onNavigateTab('daily_log')}
          className="glass-card" 
          style={{ padding: '18px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              4. Withdraw / Bank
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={18} color="var(--purple)" />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--purple)', letterSpacing: '-0.5px' }}>
            {formatCurrency(daySummary.total_withdrawals)}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
            Bank: {formatCurrency(daySummary.bank_deposit)} • Pocket: {formatCurrency(daySummary.total_owner_drawings)}
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Multi-Period Financial Overview & Long-Term ROI Breakeven */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '20px',
        marginBottom: '24px',
      }}>
        {/* Left Card: Period Financial Summary & 6-Part Matrix */}
        <motion.div
          key={selectedPeriod + selectedDate}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
          style={{
            padding: '22px',
            backgroundColor: '#FFFFFF',
            border: `1.5px solid ${periodSummary.is_positive ? 'rgba(5, 150, 105, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
            boxShadow: '0 8px 30px -4px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={18} color="var(--primary)" />
              <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>
                {periodSummary.periodLabel} Financial Summary
              </h3>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 10px',
              borderRadius: 8,
              backgroundColor: periodSummary.is_positive ? 'var(--bg-card-secondary)' : 'var(--rose-light)',
              color: periodSummary.is_positive ? 'var(--text-main)' : 'var(--rose)',
            }}>
              {periodSummary.is_positive ? 'NET SURPLUS' : 'NET DEFICIT'}
            </span>
          </div>

          {/* Big Remaining Cash Box */}
          <div style={{
            backgroundColor: '#F8FAFC',
            padding: '16px 20px',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            marginBottom: '18px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>
              Net Cash Remaining in Hand (সব খরচ, বেতন ও পকেট মানির পর অবশিষ্ট লাভ)
            </div>
            <div style={{
              fontSize: 32,
              fontWeight: 900,
              color: periodSummary.is_positive ? 'var(--primary)' : 'var(--rose)',
              letterSpacing: '-0.6px',
            }}>
              {formatCurrency(periodSummary.net_remaining_cash, true)}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
              Calculated across {periodSummary.records_count} active daily logs
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', fontSize: 12 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>1. Total Sell (মোট বিক্রি)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--primary)', marginTop: 3 }}>
                {formatCurrency(periodSummary.total_sales)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>2. Bazar / Raw Cost (বাজার)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--rose)', marginTop: 3 }}>
                -{formatCurrency(periodSummary.total_market)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>3. Gross Profit (ব্যবসায়িক লাভ)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: periodSummary.gross_profit >= 0 ? 'var(--primary)' : 'var(--rose)', marginTop: 3 }}>
                {formatCurrency(periodSummary.gross_profit)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>4. Staff Advances (বেতন)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--cyan)', marginTop: 3 }}>
                -{formatCurrency(periodSummary.total_staff_advances)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>5. Pocket Money (পকেট মানি)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--purple)', marginTop: 3 }}>
                -{formatCurrency(periodSummary.total_owner_drawings)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>6. Monthly Bills Paid (বিল)</div>
              <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--amber)', marginTop: 3 }}>
                -{formatCurrency(periodSummary.total_bills_paid)}
              </div>
            </div>

            {periodSummary.total_fixed_assets > 0 && (
              <div style={{ backgroundColor: '#F8FAFC', padding: '10px 12px', borderRadius: 10, border: '1px solid #E2E8F0', gridColumn: 'span 3' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700 }}>7. Fixed Equipment CapEx (ফিক্সড সম্পদ)</div>
                <div style={{ fontWeight: 900, fontSize: 15, color: 'var(--rose)', marginTop: 3 }}>
                  -{formatCurrency(periodSummary.total_fixed_assets)}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Card: Capital Recovery & ROI Breakeven */}
        <div className="glass-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: roiData.initial_capital === 0 ? '#F1F5F9' : roiData.is_breakeven_reached ? 'var(--primary-light)' : 'var(--amber-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ShieldCheck size={20} color={roiData.initial_capital === 0 ? '#64748B' : roiData.is_breakeven_reached ? 'var(--primary)' : 'var(--amber)'} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15.5, fontWeight: 900, color: 'var(--text-main)' }}>Capital ROI Status</h3>
                  <p style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                    {roiData.initial_capital === 0 ? 'No Setup Capital Declared' : roiData.is_breakeven_reached ? 'Pure Profit Phase (+)' : 'Capital Recovery Phase (-)'}
                  </p>
                </div>
              </div>

              <span style={{
                fontSize: 11,
                fontWeight: 900,
                padding: '4px 10px',
                borderRadius: 8,
                backgroundColor: roiData.initial_capital === 0 ? '#F1F5F9' : roiData.is_breakeven_reached ? 'var(--primary-light)' : 'var(--amber-light)',
                color: roiData.initial_capital === 0 ? '#64748B' : roiData.is_breakeven_reached ? 'var(--primary-dark)' : 'var(--amber)',
              }}>
                {roiData.initial_capital === 0 ? '0% RECOVERED' : roiData.is_breakeven_reached ? '🟢 (+) 100% PROFIT' : `🟡 ${roiData.breakeven_percent}% RECOVERED`}
              </span>
            </div>

            {/* 2-Column Investment Info */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              backgroundColor: '#F8FAFC',
              padding: '14px',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              marginBottom: 14,
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Setup Capital
                </div>
                <div style={{ fontSize: 19, fontWeight: 900, color: 'var(--text-main)', marginTop: 3 }}>
                  {formatCurrency(roiData.initial_capital)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Capital + Fixed CapEx
                </div>
              </div>

              <div style={{ borderLeft: '1.5px solid #E2E8F0', paddingLeft: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {roiData.initial_capital === 0 ? 'Net Position' : roiData.is_breakeven_reached ? 'Net Lifetime Profit' : 'Remaining To Breakeven'}
                </div>
                <div style={{
                  fontSize: 19,
                  fontWeight: 900,
                  color: roiData.initial_capital === 0 ? 'var(--text-main)' : roiData.is_breakeven_reached ? 'var(--primary)' : 'var(--rose)',
                  marginTop: 3,
                }}>
                  {roiData.initial_capital === 0
                    ? formatCurrency(roiData.net_recovered, true)
                    : roiData.is_breakeven_reached
                    ? formatCurrency(roiData.net_recovered - roiData.initial_capital, true)
                    : `-${formatCurrency(roiData.remaining_to_breakeven)}`}
                </div>
                <div style={{ fontSize: 11, color: roiData.initial_capital === 0 ? 'var(--text-muted)' : roiData.is_breakeven_reached ? 'var(--primary)' : 'var(--rose)', fontWeight: 700, marginTop: 2 }}>
                  {roiData.initial_capital === 0
                    ? 'Clean ledger'
                    : roiData.is_breakeven_reached
                    ? 'Pure Surplus (+)'
                    : `৳${roiData.remaining_to_breakeven.toLocaleString()} left (-)`}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 5 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Investment Payback Progress:</span>
                <span style={{ fontWeight: 900, color: roiData.initial_capital === 0 ? '#64748B' : roiData.is_breakeven_reached ? 'var(--primary)' : 'var(--amber)' }}>
                  {roiData.breakeven_percent}%
                </span>
              </div>
              <div style={{ height: 10, backgroundColor: '#E2E8F0', borderRadius: 5, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.max(0, roiData.breakeven_percent))}%`,
                  backgroundColor: roiData.initial_capital === 0 ? '#64748B' : roiData.is_breakeven_reached ? 'var(--primary)' : 'var(--amber)',
                  borderRadius: 5,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
            মূলধন {roiData.initial_capital > 0 ? `(${formatCurrency(roiData.initial_capital)}) ` : ''}সম্পূর্ণ উঠে না আসা পর্যন্ত ব্যালেন্স রিকভারি মোডে (-) থাকবে। মূলধন উঠে গেলে এটি স্বয়ংক্রিয়ভাবে সারপ্লাস (+) জোনে চলে যাবে।
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Yesterday Comparison & Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
      }}>
        {/* Yesterday vs Today Banner */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="var(--primary)" />
              <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-main)' }}>
                Yesterday ({yesterdayComp.yesterdayDateStr}) vs Today
              </h3>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Auto Carryover</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Yesterday Closing Float</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--amber)', marginTop: 4 }}>
                {formatCurrency(yesterdayComp.yesterdayClosingFloat || daySummary.opening_float)}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Sales Growth / Diff</div>
              <div style={{
                fontSize: 17,
                fontWeight: 900,
                color: yesterdayComp.salesDiff >= 0 ? 'var(--text-main)' : 'var(--rose)',
                marginTop: 4,
              }}>
                {yesterdayComp.salesDiff >= 0 ? `+${formatCurrency(yesterdayComp.salesDiff)}` : `${formatCurrency(yesterdayComp.salesDiff)}`}
              </div>
            </div>

            <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>Yesterday Bank Deposit</div>
              <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--cyan)', marginTop: 4 }}>
                {formatCurrency(yesterdayComp.yesterdayBankDeposit)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Entry Launcher */}
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-main)', marginBottom: 14 }}>
            Quick Financial Entry Shortcuts
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              onClick={() => onOpenQuickAction('market')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px',
                borderRadius: 12,
                border: '1.5px solid rgba(225, 29, 72, 0.25)',
                backgroundColor: 'var(--rose-light)',
                color: 'var(--rose)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <ShoppingBag size={18} />
              <span>+ Morning Bazar</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('sales')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px',
                borderRadius: 12,
                border: '1.5px solid rgba(5, 150, 105, 0.25)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary-dark)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <TrendingUp size={18} />
              <span>+ Record Sales</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('pocket_money')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px',
                borderRadius: 12,
                border: '1.5px solid rgba(147, 51, 234, 0.25)',
                backgroundColor: 'var(--purple-light)',
                color: 'var(--purple)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Coins size={18} />
              <span>+ Pocket Money</span>
            </button>

            <button
              onClick={() => onOpenQuickAction('staff_advance')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '14px',
                borderRadius: 12,
                border: '1.5px solid rgba(8, 145, 178, 0.25)',
                backgroundColor: 'var(--cyan-light)',
                color: 'var(--cyan)',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Banknote size={18} />
              <span>+ Staff Advance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
