/**
 * Accounting and Financial Engine for My Hotel & Restaurant
 * Provides 5-Star multi-period analytics (Daily, Weekly, Monthly, Yearly, All-Time),
 * 4-Pillar Daily reconciliations, and transparent ROI Breakeven tracking.
 */

export const formatCurrency = (amount, showSign = false) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳ 0';
  const num = Math.round(Number(amount));
  const isNegative = num < 0;
  const absVal = Math.abs(num).toLocaleString('en-US');
  
  if (isNegative) {
    return `-৳ ${absVal}`;
  }
  if (showSign && num > 0) {
    return `+৳ ${absVal}`;
  }
  return `৳ ${absVal}`;
};

/**
 * Calculate full summary for a single day record
 */
export const calculateDaySummary = (record) => {
  if (!record) {
    return {
      opening_float: 0,
      total_market: 0,
      market_from_cash: 0,
      total_sales: 0,
      cash_sales: 0,
      digital_sales: 0,
      total_owner_drawings: 0,
      total_staff_advances: 0,
      total_wastage: 0,
      expected_cash: 0,
      daily_operating_profit: 0,
      net_cash_remaining: 0,
      bank_deposit: 0,
      next_day_opening_float: 0,
      retained_vault_reserve: 0,
      total_withdrawals: 0,
      is_profitable: true,
      has_closed: false,
    };
  }

  const opening_float = Number(record.opening_float || 0);

  // 1. Morning Market / Bazar
  const morning_market = record.morning_market || [];
  const total_market = morning_market.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const market_from_cash = morning_market
    .filter(item => item.paid_from === 'CASH_DRAWER' || !item.paid_from)
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 2. Sales
  const cash_sales = Number(record.sales?.cash_sales || 0);
  const digital_sales = Number(record.sales?.digital_sales || 0);
  const total_sales = cash_sales + digital_sales;

  // 3. Owner Drawings (Pocket Money)
  const owner_drawings = record.owner_drawings || [];
  const total_owner_drawings = owner_drawings.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 4. Staff Advances
  const staff_advances = record.staff_advances || [];
  const total_staff_advances = staff_advances.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 5. Wastage / Demurrage
  const wastage = record.wastage_demurrage || [];
  const total_wastage = wastage.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Night Closing distributions
  const night_closing = record.night_closing || {};
  const has_closed = !!night_closing.completed;
  const bank_deposit = Number(night_closing.bank_deposit || 0);
  const next_day_opening_float = Number(night_closing.next_day_opening_float || 0);
  const retained_vault_reserve = Number(night_closing.retained_vault_reserve || 0);
  const actual_drawer_cash = Number(night_closing.actual_drawer_cash || 0);

  // Expected Cash in Drawer before night closing distribution
  const expected_cash = opening_float + cash_sales - market_from_cash - total_owner_drawings - total_staff_advances;

  // Total Outflows / Withdrawals (Pocket Money + Staff Advances + Bank Deposit)
  const total_withdrawals = total_owner_drawings + total_staff_advances + bank_deposit;

  // Daily Operating Profit (Sales - Cost of Goods / Bazar - Direct Wastage)
  const daily_operating_profit = total_sales - total_market - total_wastage;

  // Net Cash Balance Remaining after all expenses, salaries, drawings
  const net_cash_remaining = daily_operating_profit - total_owner_drawings - total_staff_advances;

  return {
    opening_float,
    total_market,
    market_from_cash,
    total_sales,
    cash_sales,
    digital_sales,
    total_owner_drawings,
    total_staff_advances,
    total_wastage,
    expected_cash,
    actual_drawer_cash,
    bank_deposit,
    next_day_opening_float,
    retained_vault_reserve,
    total_withdrawals,
    daily_operating_profit,
    net_cash_remaining,
    is_profitable: daily_operating_profit >= 0,
    has_closed,
    night_closing,
  };
};

/**
 * Multi-Period Financial Calculation Engine
 * Supports: 'day', 'week', 'month', 'year', 'all'
 */
export const calculatePeriodSummary = (data, periodType = 'month', selectedDate = new Date().toISOString().split('T')[0]) => {
  const daily_records = data?.daily_records || [];
  const monthly_bills = data?.monthly_bills || [];
  const fixed_assets = data?.fixed_assets || [];
  const staff = data?.staff || [];

  let filteredRecords = [];
  let filteredBills = [];
  let filteredAssets = [];
  let periodLabel = '';

  const selectedYear = selectedDate.slice(0, 4);
  const selectedMonthKey = selectedDate.slice(0, 7);

  if (periodType === 'day') {
    periodLabel = `Daily (${selectedDate})`;
    filteredRecords = daily_records.filter(r => r.date === selectedDate);
    filteredBills = monthly_bills.filter(b => b.payment_date === selectedDate);
    filteredAssets = fixed_assets.filter(a => a.date === selectedDate);
  } else if (periodType === 'week') {
    // 7-day window ending on selectedDate
    const [y, m, d] = selectedDate.split('-').map(Number);
    const endDate = new Date(y, m - 1, d);
    const startDate = new Date(y, m - 1, d);
    startDate.setDate(startDate.getDate() - 6);

    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    periodLabel = `Weekly (${startStr} to ${endStr})`;
    filteredRecords = daily_records.filter(r => r.date >= startStr && r.date <= endStr);
    filteredBills = monthly_bills.filter(b => b.payment_date >= startStr && b.payment_date <= endStr);
    filteredAssets = fixed_assets.filter(a => a.date >= startStr && a.date <= endStr);
  } else if (periodType === 'month') {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const monthDate = new Date(y, m - 1, d || 1);
    const monthName = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    periodLabel = `Monthly (${monthName})`;
    filteredRecords = daily_records.filter(r => r.date && r.date.startsWith(selectedMonthKey));
    filteredBills = monthly_bills.filter(b => b.month_year === selectedMonthKey || (b.payment_date && b.payment_date.startsWith(selectedMonthKey)));
    filteredAssets = fixed_assets.filter(a => a.date && a.date.startsWith(selectedMonthKey));
  } else if (periodType === 'year') {
    periodLabel = `Yearly (${selectedYear})`;
    filteredRecords = daily_records.filter(r => r.date && r.date.startsWith(selectedYear));
    filteredBills = monthly_bills.filter(b => (b.month_year && b.month_year.startsWith(selectedYear)) || (b.payment_date && b.payment_date.startsWith(selectedYear)));
    filteredAssets = fixed_assets.filter(a => a.date && a.date.startsWith(selectedYear));
  } else {
    // 'all'
    periodLabel = 'All-Time';
    filteredRecords = daily_records;
    filteredBills = monthly_bills;
    filteredAssets = fixed_assets;
  }

  // Aggregate daily records
  let total_sales = 0;
  let cash_sales = 0;
  let digital_sales = 0;
  let total_market = 0;
  let total_owner_drawings = 0;
  let total_staff_advances = 0;
  let total_wastage = 0;
  let total_bank_deposits = 0;

  filteredRecords.forEach(rec => {
    const summary = calculateDaySummary(rec);
    total_sales += summary.total_sales;
    cash_sales += summary.cash_sales;
    digital_sales += summary.digital_sales;
    total_market += summary.total_market;
    total_owner_drawings += summary.total_owner_drawings;
    total_staff_advances += summary.total_staff_advances;
    total_wastage += summary.total_wastage;
    total_bank_deposits += summary.bank_deposit;
  });

  // Bills in this period
  const total_bills_paid = filteredBills
    .filter(b => b.status === 'PAID')
    .reduce((sum, b) => sum + Number(b.amount || 0), 0);

  // Fixed CapEx / Asset purchases in this period
  const total_fixed_assets = filteredAssets
    .reduce((sum, a) => sum + Number(a.amount || 0), 0);

  // Total base staff payroll for month (if viewing monthly)
  let total_staff_base_salary = 0;
  if (periodType === 'month') {
    total_staff_base_salary = staff.reduce((sum, s) => sum + Number(s.monthly_salary || 0), 0);
  } else if (periodType === 'year') {
    total_staff_base_salary = staff.reduce((sum, s) => sum + Number(s.monthly_salary || 0), 0) * 12;
  }

  // Gross Operating Profit = Sales - Raw Material Bazar - Wastage
  const gross_profit = total_sales - total_market - total_wastage;

  // Net Operating Profit after Overhead bills & Fixed CapEx
  const net_operating_profit = gross_profit - total_bills_paid - total_fixed_assets;

  // Net Remaining Cash in Hand after staff payments, pocket money, bills, fixed assets & bazar
  // (Total Sales - Bazar - Staff Advances - Owner Pocket Money - Bills - Fixed Assets - Wastage)
  const net_remaining_cash = total_sales - total_market - total_staff_advances - total_owner_drawings - total_bills_paid - total_fixed_assets - total_wastage;

  // Active records count (only records with non-zero activity)
  const activeRecordsCount = filteredRecords.filter(r => (
    (r.morning_market && r.morning_market.length > 0) ||
    (r.sales && (Number(r.sales.cash_sales || 0) > 0 || Number(r.sales.digital_sales || 0) > 0)) ||
    (r.owner_drawings && r.owner_drawings.length > 0) ||
    (r.staff_advances && r.staff_advances.length > 0) ||
    (r.wastage_demurrage && r.wastage_demurrage.length > 0) ||
    (r.night_closing && r.night_closing.completed)
  )).length;

  return {
    periodType,
    periodLabel,
    total_sales,
    cash_sales,
    digital_sales,
    total_market,
    gross_profit,
    total_owner_drawings,
    total_staff_advances,
    total_staff_base_salary,
    total_bills_paid,
    total_fixed_assets,
    total_wastage,
    total_bank_deposits,
    net_operating_profit,
    net_remaining_cash,
    is_positive: net_remaining_cash >= 0,
    records_count: activeRecordsCount,
  };
};

/**
 * Yesterday vs Today Comparison Helper
 */
export const calculateYesterdayComparison = (selectedDate, data) => {
  const records = data?.daily_records || [];
  
  // Calculate yesterday date string safely
  const [y, m, d] = selectedDate.split('-').map(Number);
  const prevDate = new Date(y, m - 1, d);
  prevDate.setDate(prevDate.getDate() - 1);
  const prevDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-${String(prevDate.getDate()).padStart(2, '0')}`;

  const todayRecord = records.find(r => r.date === selectedDate);
  const yesterdayRecord = records.find(r => r.date === prevDateStr);

  const todaySummary = calculateDaySummary(todayRecord);
  const yesterdaySummary = calculateDaySummary(yesterdayRecord);

  // Carryover float from yesterday's night closing
  const yesterdayClosingFloat = yesterdayRecord?.night_closing?.next_day_opening_float ?? 0;
  const yesterdayBankDeposit = yesterdayRecord?.night_closing?.bank_deposit ?? 0;
  const yesterdayCashbox = yesterdayRecord?.night_closing?.actual_drawer_cash ?? yesterdaySummary.expected_cash;

  const salesDiff = todaySummary.total_sales - yesterdaySummary.total_sales;
  const marketDiff = todaySummary.total_market - yesterdaySummary.total_market;

  return {
    yesterdayDateStr: prevDateStr,
    todaySummary,
    yesterdaySummary,
    yesterdayClosingFloat,
    yesterdayBankDeposit,
    yesterdayCashbox,
    salesDiff,
    marketDiff,
  };
};

/**
 * Long-Term Investment Breakeven & ROI Engine
 */
export const calculateBreakevenROI = (data) => {
  const initial_capital = Number(data?.restaurant_info?.initial_capital_investment || 0);
  
  // Total fixed assets cost
  const fixed_assets = data?.fixed_assets || [];
  const total_capex = fixed_assets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  
  // Total setup cost is combined initial capital investment + all recorded capital equipment
  const total_setup_cost = initial_capital + total_capex;

  // Cumulative operating profits across all days
  const daily_records = data?.daily_records || [];
  let cumulative_daily_profit = 0;
  let total_owner_withdrawn = 0;
  let total_all_time_sales = 0;
  let total_all_time_market = 0;
  let total_all_time_advances = 0;
  let total_all_time_wastage = 0;

  daily_records.forEach(rec => {
    const summary = calculateDaySummary(rec);
    cumulative_daily_profit += summary.daily_operating_profit;
    total_owner_withdrawn += summary.total_owner_drawings;
    total_all_time_sales += summary.total_sales;
    total_all_time_market += summary.total_market;
    total_all_time_advances += summary.total_staff_advances;
    total_all_time_wastage += summary.total_wastage;
  });

  // Total monthly utility bills paid
  const monthly_bills = data?.monthly_bills || [];
  const total_bills_paid = monthly_bills
    .filter(b => b.status === 'PAID')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // Net earnings applied towards capital recovery:
  // Recovered = (All Cumulative Profits - Monthly Bills - Owner Pocket Drawings - Staff Advances)
  const net_recovered = cumulative_daily_profit - total_bills_paid - total_owner_withdrawn - total_all_time_advances;
  
  const has_investment = total_setup_cost > 0;
  const remaining_to_breakeven = has_investment ? Math.max(0, total_setup_cost - net_recovered) : 0;
  
  let breakeven_percent = 0;
  let is_breakeven_reached = false;
  let net_position_status = 'CLEAN_SLATE';

  if (has_investment) {
    breakeven_percent = Number(Math.max(0, Math.min(100, (net_recovered / total_setup_cost) * 100)).toFixed(1));
    is_breakeven_reached = net_recovered >= total_setup_cost;
    net_position_status = is_breakeven_reached ? 'PROFIT_ZONE' : 'RECOVERY_PHASE';
  } else if (net_recovered > 0) {
    breakeven_percent = 100;
    is_breakeven_reached = true;
    net_position_status = 'PROFIT_ZONE';
  } else if (net_recovered < 0) {
    breakeven_percent = 0;
    is_breakeven_reached = false;
    net_position_status = 'DEFICIT_PHASE';
  }

  return {
    initial_capital: total_setup_cost,
    base_initial_capital: initial_capital,
    total_fixed_assets_capex: total_capex,
    total_all_time_sales,
    total_all_time_market,
    total_all_time_advances,
    total_all_time_wastage,
    cumulative_daily_profit,
    total_bills_paid,
    total_owner_withdrawn,
    net_recovered,
    remaining_to_breakeven,
    breakeven_percent,
    is_breakeven_reached,
    net_position_status,
  };
};

/**
 * Staff Monthly Payroll Ledger & Advance Calculation
 */
export const calculateStaffMonthlyStatus = (staffMember, data, currentMonth = new Date().toISOString().slice(0, 7)) => {
  const baseSalary = Number(staffMember.monthly_salary || 0);
  const daily_records = data?.daily_records || [];
  
  let totalAdvancesThisMonth = 0;
  const advancesList = [];

  daily_records.forEach(rec => {
    if (rec.date && rec.date.startsWith(currentMonth)) {
      const advances = rec.staff_advances || [];
      advances.forEach(adv => {
        if (adv.staff_id === staffMember.id) {
          totalAdvancesThisMonth += Number(adv.amount || 0);
          advancesList.push({
            id: adv.id,
            date: rec.date,
            amount: Number(adv.amount || 0),
            note: adv.note || 'Cash Advance',
            time: adv.time,
          });
        }
      });
    }
  });

  const netPayableSalary = Math.max(0, baseSalary - totalAdvancesThisMonth);

  return {
    baseSalary,
    totalAdvancesThisMonth,
    netPayableSalary,
    advancesList,
    isPaidOff: netPayableSalary === 0,
  };
};

/**
 * Partner Lifetime & Monthly Drawings Ledger
 */
export const calculateOwnerLifetimeDrawings = (ownerId, data, currentMonth = new Date().toISOString().slice(0, 7)) => {
  const daily_records = data?.daily_records || [];
  let totalDrawings = 0;
  let monthlyDrawings = 0;
  const history = [];

  daily_records.forEach(rec => {
    const drawings = rec.owner_drawings || [];
    drawings.forEach(d => {
      if (d.owner_id === ownerId) {
        const amt = Number(d.amount || 0);
        totalDrawings += amt;
        if (rec.date && rec.date.startsWith(currentMonth)) {
          monthlyDrawings += amt;
        }
        history.push({
          id: d.id,
          date: rec.date,
          amount: amt,
          purpose: d.purpose || 'Pocket Money',
          time: d.time,
        });
      }
    });
  });

  // Sort history newest first
  history.sort((a, b) => (a.date < b.date ? 1 : -1));

  return {
    totalDrawings,
    monthlyDrawings,
    history,
  };
};
