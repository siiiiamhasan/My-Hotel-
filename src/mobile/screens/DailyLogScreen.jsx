import React, { useState } from 'react';
import { 
  ShoppingBag, 
  TrendingUp, 
  Moon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Landmark,
  Coins,
  Edit2,
  RotateCcw,
  UserCheck,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency, calculateDaySummary, calculateYesterdayComparison } from '../../utils/accounting';
import { CustomModal } from '../components/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const DailyLogScreen = () => {
  const { 
    selectedDate, 
    getDayRecord, 
    addMorningMarketItem, 
    updateMorningMarketItem,
    deleteMorningMarketItem,
    updateDailySales,
    submitNightClosing,
    resetNightClosing,
    deleteOwnerDrawing,
    deleteStaffAdvance,
    deleteWastageItem,
    data
  } = useAppData();

  const record = getDayRecord(selectedDate);
  const summary = calculateDaySummary(record);
  const yesterdayComp = calculateYesterdayComparison(selectedDate, data);

  // Modals state
  const [marketModalOpen, setMarketModalOpen] = useState(false);
  const [salesModalOpen, setSalesModalOpen] = useState(false);
  const [closingModalOpen, setClosingModalOpen] = useState(false);
  const [resetClosingConfirmOpen, setResetClosingConfirmOpen] = useState(false);

  // Edit states
  const [editingMarketItem, setEditingMarketItem] = useState(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name, amount }

  // Form states: Market Item
  const [marketItemName, setMarketItemName] = useState('');
  const [marketAmount, setMarketAmount] = useState('');
  const [marketCategory, setMarketCategory] = useState('GROCERY');
  const [marketBuyer, setMarketBuyer] = useState(data?.owners?.[0]?.name || '');
  const [marketPaidFrom, setMarketPaidFrom] = useState('CASH_DRAWER');
  const [marketError, setMarketError] = useState('');

  // Form states: Sales
  const [cashSalesInput, setCashSalesInput] = useState(record.sales?.cash_sales ? String(record.sales.cash_sales) : '');
  const [digitalSalesInput, setDigitalSalesInput] = useState(record.sales?.digital_sales ? String(record.sales.digital_sales) : '');

  // Form states: Night Closing Wizard
  const [actualDrawerCash, setActualDrawerCash] = useState(
    record.night_closing?.actual_drawer_cash !== undefined ? String(record.night_closing.actual_drawer_cash) : String(summary.expected_cash)
  );
  const [nextDayFloat, setNextDayFloat] = useState(
    record.night_closing?.next_day_opening_float !== undefined ? String(record.night_closing.next_day_opening_float) : '0'
  );
  const [bankDeposit, setBankDeposit] = useState(
    record.night_closing?.bank_deposit !== undefined ? String(record.night_closing.bank_deposit) : '0'
  );
  const [bankNote, setBankNote] = useState(
    record.night_closing?.bank_note || ''
  );
  const [closedBy, setClosedBy] = useState(
    record.night_closing?.closed_by || (data?.owners?.[0]?.name || '')
  );
  const [closingNotes, setClosingNotes] = useState(
    record.night_closing?.notes || ''
  );

  // Handlers: Market Item
  const handleOpenAddMarket = () => {
    setEditingMarketItem(null);
    setMarketItemName('');
    setMarketAmount('');
    setMarketCategory('GROCERY');
    setMarketBuyer(data?.owners?.[0]?.name || 'Partner');
    setMarketPaidFrom('CASH_DRAWER');
    setMarketError('');
    setMarketModalOpen(true);
  };

  const handleOpenEditMarket = (item) => {
    setEditingMarketItem(item);
    setMarketItemName(item.item_name);
    setMarketAmount(String(item.amount));
    setMarketCategory(item.category || 'GROCERY');
    setMarketBuyer(item.buyer || (data?.owners?.[0]?.name || 'Partner'));
    setMarketPaidFrom(item.paid_from || 'CASH_DRAWER');
    setMarketError('');
    setMarketModalOpen(true);
  };

  const handleSaveMarketItem = () => {
    if (!marketItemName.trim() || !marketAmount || isNaN(Number(marketAmount))) {
      setMarketError('Please enter a valid item name and amount.');
      return;
    }
    setMarketError('');

    if (editingMarketItem) {
      updateMorningMarketItem(selectedDate, editingMarketItem.id, {
        item_name: marketItemName.trim(),
        category: marketCategory,
        amount: Number(marketAmount),
        paid_from: marketPaidFrom,
        buyer: marketBuyer,
      });
    } else {
      addMorningMarketItem(selectedDate, {
        item_name: marketItemName.trim(),
        category: marketCategory,
        amount: Number(marketAmount),
        paid_from: marketPaidFrom,
        buyer: marketBuyer,
      });
    }
    setMarketModalOpen(false);
  };

  // Handlers: Sales
  const handleSaveSales = () => {
    updateDailySales(selectedDate, Number(cashSalesInput || 0), Number(digitalSalesInput || 0));
    setSalesModalOpen(false);
  };

  // Handlers: Night Closing
  const handleSaveNightClosing = () => {
    const countedCash = Number(actualDrawerCash || 0);
    const expCash = summary.expected_cash;
    const floatAmount = Number(nextDayFloat || 0);
    const depositAmount = Number(bankDeposit || 0);
    const vaultReserve = Math.max(0, countedCash - floatAmount - depositAmount);

    submitNightClosing(selectedDate, {
      actual_drawer_cash: countedCash,
      expected_cash: expCash,
      variance: countedCash - expCash,
      next_day_opening_float: floatAmount,
      bank_deposit: depositAmount,
      bank_note: bankNote,
      retained_vault_reserve: vaultReserve,
      closed_by: closedBy,
      notes: closingNotes,
    });

    try {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#059669', '#4F46E5', '#D97706', '#E11D48']
      });
    } catch (e) {}

    setClosingModalOpen(false);
  };

  const handleResetClosing = () => {
    resetNightClosing(selectedDate);
    setResetClosingConfirmOpen(false);
  };

  // Handlers: Universal Delete
  const handleExecuteDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'market') {
      deleteMorningMarketItem(selectedDate, deleteTarget.id);
    } else if (deleteTarget.type === 'drawing') {
      deleteOwnerDrawing(selectedDate, deleteTarget.id);
    } else if (deleteTarget.type === 'advance') {
      deleteStaffAdvance(selectedDate, deleteTarget.id);
    } else if (deleteTarget.type === 'wastage') {
      deleteWastageItem(selectedDate, deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  return (
    <div style={{ padding: '14px', paddingBottom: '24px' }}>
      {/* Universal Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteTarget?.type === 'market' ? 'Bazar Item' : deleteTarget?.type === 'drawing' ? 'Pocket Money' : deleteTarget?.type === 'advance' ? 'Staff Advance' : 'Wastage Item'}?`}
        itemName={deleteTarget?.name}
        itemAmount={deleteTarget?.amount}
        description="This transaction will be removed from today's accounts and dashboard will update immediately."
      />

      {/* Reset Night Closing Confirmation Modal */}
      <DeleteConfirmModal
        visible={resetClosingConfirmOpen}
        onClose={() => setResetClosingConfirmOpen(false)}
        onConfirm={handleResetClosing}
        title="Reset Today's Night Closing?"
        itemName="Night Closing Seal"
        description="This will unlock today's cash drawer reconciliation and allow editing."
      />

      {/* Yesterday's Carryover Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: '12px 14px',
        border: '1px solid #E2E8F0',
        marginBottom: '14px',
        boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)' }}>
              TODAY'S OPENING FLOAT (কালকের জমার জের)
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--amber)', marginTop: 2 }}>
              {formatCurrency(summary.opening_float)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
              Auto carried from {yesterdayComp.yesterdayDateStr}
            </span>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)', marginTop: 2 }}>
              Active in Cash Drawer
            </div>
          </div>
        </div>
      </div>

      {/* 1. MORNING BAZAR / MARKET EXPENSES */}
      <div className="glass-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--rose-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={15} color="var(--rose)" />
            </div>
            <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>1. Morning Bazar / Market</h2>
          </div>
          <button
            onClick={handleOpenAddMarket}
            style={{
              backgroundColor: 'var(--rose)',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 10.5,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(225, 29, 72, 0.25)',
            }}
          >
            <Plus size={12} />
            <span>+ Add Bazar</span>
          </button>
        </div>

        <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Daily raw materials, meat, fish, spices, and groceries purchased for kitchen.
        </p>

        {(!record.morning_market || record.morning_market.length === 0) ? (
          <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5, border: '1px solid #E2E8F0' }}>
            No market purchases recorded for this date yet.
          </div>
        ) : (
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: '6px 10px', border: '1px solid #E2E8F0' }}>
            {record.morning_market.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)' }}>{item.item_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    {item.category} • Buyer: {item.buyer} • Paid: {item.paid_from === 'CASH_DRAWER' ? 'Cash Box' : 'Owner Pocket'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--rose)', marginRight: 4 }}>{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => handleOpenEditMarket(item)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    title="Edit item"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({
                      type: 'market',
                      id: item.id,
                      name: item.item_name,
                      amount: formatCurrency(item.amount)
                    })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, marginTop: 2 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Total Bazar Expense</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--rose)' }}>
                {formatCurrency(summary.total_market)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. DAILY SALES ENTRY */}
      <div className="glass-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} color="var(--primary)" />
            </div>
            <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>2. Total Sales / Revenue</h2>
          </div>
          <button
            onClick={() => {
              setCashSalesInput(record.sales?.cash_sales ? String(record.sales.cash_sales) : '');
              setDigitalSalesInput(record.sales?.digital_sales ? String(record.sales.digital_sales) : '');
              setSalesModalOpen(true);
            }}
            style={{
              backgroundColor: 'var(--primary)',
              color: '#FFF',
              border: 'none',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 10.5,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
            }}
          >
            {record.sales?.total_sales ? 'Edit Sales' : '+ Record Sales'}
          </button>
        </div>

        <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Customer receipts across Cash Register and Digital POS (bKash/Cards).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>Cash Sales</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(summary.cash_sales)}</div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>Digital / bKash POS</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(summary.digital_sales)}</div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 8,
          borderTop: '1px solid #E2E8F0',
        }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Total Gross Sales</span>
          <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)' }}>
            {formatCurrency(summary.total_sales)}
          </span>
        </div>
      </div>

      {/* 3. CASH BOX & NIGHT CLOSING RECONCILIATION */}
      <div 
        className="glass-card" 
        style={{
          padding: '14px', 
          marginBottom: '14px',
          borderColor: summary.has_closed ? 'rgba(5, 150, 105, 0.3)' : 'rgba(217, 119, 6, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: summary.has_closed ? 'var(--primary-light)' : 'var(--amber-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Moon size={15} color={summary.has_closed ? 'var(--primary)' : 'var(--amber)'} />
            </div>
            <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>3. Cash Box & Night Closing</h2>
          </div>
          
          <div style={{ display: 'flex', gap: 6 }}>
            {summary.has_closed && (
              <button
                onClick={() => setResetClosingConfirmOpen(true)}
                style={{
                  backgroundColor: 'var(--rose-light)',
                  color: 'var(--rose)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '5px 8px',
                  fontSize: 10.5,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={() => {
                setActualDrawerCash(String(record.night_closing?.actual_drawer_cash || summary.expected_cash));
                setNextDayFloat(String(record.night_closing?.next_day_opening_float !== undefined ? record.night_closing.next_day_opening_float : 0));
                setBankDeposit(String(record.night_closing?.bank_deposit !== undefined ? record.night_closing.bank_deposit : 0));
                setClosingModalOpen(true);
              }}
              style={{
                backgroundColor: summary.has_closed ? '#F1F5F9' : 'var(--amber)',
                color: summary.has_closed ? 'var(--text-main)' : '#FFF',
                border: 'none',
                borderRadius: 8,
                padding: '5px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {summary.has_closed ? 'Adjust Closing' : 'Start Closing'}
            </button>
          </div>
        </div>

        <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: 10 }}>
          Count physical cash in register, allocate tomorrow's float, and deposit to bank.
        </p>

        {summary.has_closed ? (
          <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <CheckCircle2 size={15} color="var(--primary)" />
              <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--primary-dark)' }}>
                Night Closing Sealed by {summary.night_closing?.closed_by}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Actual Physical Cash</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)' }}>{formatCurrency(summary.night_closing?.actual_drawer_cash)}</div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Tomorrow's Float</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--amber)' }}>
                  {formatCurrency(summary.night_closing?.next_day_opening_float)}
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Bank Deposit</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--cyan)' }}>
                  {formatCurrency(summary.night_closing?.bank_deposit)}
                </div>
              </div>
              <div style={{ backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)' }}>Retained Vault Reserve</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)' }}>{formatCurrency(summary.night_closing?.retained_vault_reserve)}</div>
              </div>
            </div>

            {summary.night_closing?.bank_note ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: 6, backgroundColor: 'var(--cyan-light)', borderRadius: 6, fontSize: 10.5, color: 'var(--cyan)', fontWeight: 600 }}>
                <Landmark size={12} />
                <span>{summary.night_closing.bank_note}</span>
              </div>
            ) : null}
          </div>
        ) : (
          <div style={{ backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>System Expected Cash:</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--amber)' }}>{formatCurrency(summary.expected_cash)}</span>
            </div>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Formula: Float ({formatCurrency(summary.opening_float)}) + Cash Sales ({formatCurrency(summary.cash_sales)}) - Market/Payouts ({formatCurrency(summary.market_from_cash + summary.total_owner_drawings + summary.total_staff_advances)})
            </p>
          </div>
        )}
      </div>

      {/* 4. WITHDRAWALS & DISTRIBUTIONS SUMMARY WITH DIRECT DELETE */}
      <div className="glass-card" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'var(--purple-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coins size={15} color="var(--purple)" />
          </div>
          <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>4. Today's Payouts & Drawings</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 8, marginBottom: 12 }}>
          <div style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Pocket Money</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--purple)', marginTop: 2 }}>
              {formatCurrency(summary.total_owner_drawings)}
            </div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Staff Advances</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--cyan)', marginTop: 2 }}>
              {formatCurrency(summary.total_staff_advances)}
            </div>
          </div>
          <div style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>Bank Deposit</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
              {formatCurrency(summary.bank_deposit)}
            </div>
          </div>
        </div>

        {/* Itemized Payouts List */}
        {((record.owner_drawings || []).length > 0 || (record.staff_advances || []).length > 0) && (
          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Itemized Payout Transactions Today:
            </div>

            {/* Pocket Money List */}
            {(record.owner_drawings || []).map((d) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 11 }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--purple)' }}>{d.owner_name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{d.purpose || 'Pocket Money'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(d.amount)}</span>
                  <button
                    onClick={() => setDeleteTarget({
                      type: 'drawing',
                      id: d.id,
                      name: `${d.owner_name} Pocket Money`,
                      amount: formatCurrency(d.amount),
                    })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                    title="Delete drawing"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}

            {/* Staff Advances List */}
            {(record.staff_advances || []).map((sa) => (
              <div key={sa.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9', fontSize: 11 }}>
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{sa.staff_name}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{sa.note || 'Advance'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatCurrency(sa.amount)}</span>
                  <button
                    onClick={() => setDeleteTarget({
                      type: 'advance',
                      id: sa.id,
                      name: `${sa.staff_name} Advance`,
                      amount: formatCurrency(sa.amount),
                    })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                    title="Delete advance"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- MODAL 1: ADD/EDIT MARKET ITEM --- */}
      <CustomModal
        visible={marketModalOpen}
        onClose={() => setMarketModalOpen(false)}
        title={editingMarketItem ? "Edit Morning Bazar Item" : "Add Morning Bazar / Market"}
        subtitle="Record raw materials & supplies purchased"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Item Name & Quantity
          </label>
          <input
            className="input-field"
            placeholder="e.g. Beef 15kg, Rice 50kg, Oil 5L"
            value={marketItemName}
            onChange={(e) => setMarketItemName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Cost Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 7500"
            value={marketAmount}
            onChange={(e) => setMarketAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Category
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['MEAT_FISH', 'GROCERY', 'PRODUCE', 'DAIRY', 'PACKAGING', 'SPICES'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setMarketCategory(cat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: marketCategory === cat ? 800 : 600,
                  backgroundColor: marketCategory === cat ? 'var(--primary-light)' : '#F1F5F9',
                  color: marketCategory === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1px solid ${marketCategory === cat ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Purchased By (Partner)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.owners || []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setMarketBuyer(o.name)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: marketBuyer === o.name ? 800 : 600,
                  backgroundColor: marketBuyer === o.name ? 'var(--primary-light)' : '#F1F5F9',
                  color: marketBuyer === o.name ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1px solid ${marketBuyer === o.name ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Paid From
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { id: 'CASH_DRAWER', label: 'Cash Box' },
              { id: 'OWNER_POCKET', label: 'Owner Pocket' }
            ].map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => setMarketPaidFrom(src.id)}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: marketPaidFrom === src.id ? 800 : 600,
                  backgroundColor: marketPaidFrom === src.id ? 'var(--primary-light)' : '#F1F5F9',
                  color: marketPaidFrom === src.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1px solid ${marketPaidFrom === src.id ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {src.label}
              </button>
            ))}
          </div>
        </div>

        {marketError ? (
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--rose-light)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: 10, marginBottom: 10, fontSize: 11.5, color: 'var(--rose)', fontWeight: 700 }}>
            {marketError}
          </div>
        ) : null}

        <button
          onClick={handleSaveMarketItem}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          {editingMarketItem ? "Update Market Entry" : "Save Market Entry"}
        </button>
      </CustomModal>

      {/* --- MODAL 2: EDIT SALES --- */}
      <CustomModal
        visible={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        title="Record Daily Sales Revenue"
        subtitle="Enter customer receipts across cash and digital POS"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Cash Sales (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 45000"
            value={cashSalesInput}
            onChange={(e) => setCashSalesInput(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Digital / bKash / POS Sales (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 8000"
            value={digitalSalesInput}
            onChange={(e) => setDigitalSalesInput(e.target.value)}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          padding: 10,
          borderRadius: 10,
          margin: '12px 0',
        }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>Gross Revenue:</span>
          <span style={{ fontSize: 17, fontWeight: 900, color: 'var(--primary)' }}>
            {formatCurrency(Number(cashSalesInput || 0) + Number(digitalSalesInput || 0))}
          </span>
        </div>

        <button
          onClick={handleSaveSales}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          Update Sales Record
        </button>
      </CustomModal>

      {/* --- MODAL 3: NIGHT CLOSING WIZARD --- */}
      <CustomModal
        visible={closingModalOpen}
        onClose={() => setClosingModalOpen(false)}
        title="Night Cash Closing Wizard"
        subtitle="Count physical drawer cash, set tomorrow's float & bank deposit"
      >
        <div style={{
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          padding: 10,
          borderRadius: 10,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>System Expected Cash in Drawer</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--amber)', marginTop: 2 }}>
            {formatCurrency(summary.expected_cash)}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            1. Counted Physical Cash in Drawer (৳)
          </label>
          <input
            type="number"
            className="input-field"
            style={{ borderColor: 'var(--amber)' }}
            placeholder="Enter counted physical cash"
            value={actualDrawerCash}
            onChange={(e) => setActualDrawerCash(e.target.value)}
          />

          {actualDrawerCash ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, fontSize: 10.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Variance:</span>
              <span style={{
                fontWeight: 800,
                color: Number(actualDrawerCash) - summary.expected_cash >= 0 ? 'var(--primary)' : 'var(--rose)'
              }}>
                {formatCurrency(Number(actualDrawerCash) - summary.expected_cash, true)}
                {Number(actualDrawerCash) === summary.expected_cash && ' (Balanced)'}
              </span>
            </div>
          ) : null}
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            2. Next Day Opening Float (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter amount"
            value={nextDayFloat}
            onChange={(e) => setNextDayFloat(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            3. Bank Deposit Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter amount"
            value={bankDeposit}
            onChange={(e) => setBankDeposit(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Bank Deposit Note
          </label>
          <input
            className="input-field"
            placeholder="e.g. Cash Deposit / Mobile Banking"
            value={bankNote}
            onChange={(e) => setBankNote(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Closed By (Partner)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.owners || []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setClosedBy(o.name)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: closedBy === o.name ? 800 : 600,
                  backgroundColor: closedBy === o.name ? 'var(--primary-light)' : '#F1F5F9',
                  color: closedBy === o.name ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1px solid ${closedBy === o.name ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveNightClosing}
          className="btn-primary"
          style={{ width: '100%' }}
        >
          Seal Night Closing
        </button>
      </CustomModal>
    </div>
  );
};
