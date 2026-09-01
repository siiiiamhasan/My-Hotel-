import React, { useState } from 'react';
import { 
  Armchair, 
  Zap, 
  AlertTriangle, 
  Plus, 
  Trash2,
  Edit2,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { formatCurrency } from '../../utils/accounting';
import { DesktopModal } from '../components/DesktopModal';
import { DesktopDeleteConfirmModal } from '../components/DesktopDeleteConfirmModal';

export const DesktopExpensesScreen = () => {
  const { 
    data, 
    selectedDate, 
    getDayRecord, 
    addFixedAsset, 
    updateFixedAsset,
    deleteFixedAsset, 
    addMonthlyBill, 
    updateMonthlyBill,
    deleteMonthlyBill,
    toggleMonthlyBillPaid,
    addWastageItem,
    updateWastageItem,
    deleteWastageItem,
    updateInitialCapital
  } = useAppData();

  const [segment, setSegment] = useState('FIXED'); // 'FIXED', 'MONTHLY', 'WASTAGE'
  const record = getDayRecord(selectedDate);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name, amount }

  // Modals
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [wastageModalOpen, setWastageModalOpen] = useState(false);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);

  // Edit targets
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editingWastage, setEditingWastage] = useState(null);

  // Form states: Asset
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetCategory, setAssetCategory] = useState('FURNITURE');
  const [assetDate, setAssetDate] = useState(selectedDate);

  // Form states: Bill
  const [billType, setBillType] = useState('Shop Rent');
  const [billAmount, setBillAmount] = useState('');
  const [billMonth, setBillMonth] = useState(selectedDate.slice(0, 7));
  const [billPaymentDate, setBillPaymentDate] = useState(selectedDate);

  // Form states: Wastage
  const [wastageDesc, setWastageDesc] = useState('');
  const [wastageAmount, setWastageAmount] = useState('');
  const [wastageReason, setWastageReason] = useState('Accidental kitchen breakage');

  // Form states: Capital
  const [capitalInput, setCapitalInput] = useState(String(data?.restaurant_info?.initial_capital_investment || '0'));

  // Handlers: Asset
  const handleOpenAddAsset = () => {
    setEditingAsset(null);
    setAssetName('');
    setAssetAmount('');
    setAssetCategory('FURNITURE');
    setAssetDate(selectedDate);
    setAssetModalOpen(true);
  };

  const handleOpenEditAsset = (asset) => {
    setEditingAsset(asset);
    setAssetName(asset.item_name);
    setAssetAmount(String(asset.amount));
    setAssetCategory(asset.category || 'FURNITURE');
    setAssetDate(asset.date || selectedDate);
    setAssetModalOpen(true);
  };

  const handleSaveAsset = () => {
    if (!assetName.trim() || !assetAmount || isNaN(Number(assetAmount))) return;

    if (editingAsset) {
      updateFixedAsset(editingAsset.id, {
        item_name: assetName.trim(),
        amount: Number(assetAmount),
        category: assetCategory,
        date: assetDate || selectedDate,
      });
    } else {
      addFixedAsset({
        item_name: assetName.trim(),
        amount: Number(assetAmount),
        category: assetCategory,
        date: assetDate || selectedDate,
      });
    }
    setAssetModalOpen(false);
  };

  // Handlers: Bill
  const handleOpenAddBill = () => {
    setEditingBill(null);
    setBillType('Shop Rent');
    setBillAmount('');
    setBillMonth(selectedDate.slice(0, 7));
    setBillPaymentDate(selectedDate);
    setBillModalOpen(true);
  };

  const handleOpenEditBill = (bill) => {
    setEditingBill(bill);
    setBillType(bill.bill_type);
    setBillAmount(String(bill.amount));
    setBillMonth(bill.month_year || selectedDate.slice(0, 7));
    setBillPaymentDate(bill.payment_date || selectedDate);
    setBillModalOpen(true);
  };

  const handleSaveBill = () => {
    if (!billType.trim() || !billAmount || isNaN(Number(billAmount))) return;

    if (editingBill) {
      updateMonthlyBill(editingBill.id, {
        bill_type: billType.trim(),
        amount: Number(billAmount),
        month_year: billMonth,
        payment_date: billPaymentDate,
      });
    } else {
      addMonthlyBill({
        bill_type: billType.trim(),
        amount: Number(billAmount),
        month_year: billMonth,
        payment_date: billPaymentDate,
        status: 'PAID'
      });
    }
    setBillModalOpen(false);
  };

  // Handlers: Wastage
  const handleOpenAddWastage = () => {
    setEditingWastage(null);
    setWastageDesc('');
    setWastageAmount('');
    setWastageReason('Accidental kitchen breakage');
    setWastageModalOpen(true);
  };

  const handleOpenEditWastage = (item) => {
    setEditingWastage(item);
    setWastageDesc(item.item_description);
    setWastageAmount(String(item.amount));
    setWastageReason(item.reason || 'Accidental kitchen breakage');
    setWastageModalOpen(true);
  };

  const handleSaveWastage = () => {
    if (!wastageDesc.trim() || !wastageAmount || isNaN(Number(wastageAmount))) return;

    if (editingWastage) {
      updateWastageItem(selectedDate, editingWastage.id, {
        item_description: wastageDesc.trim(),
        amount: Number(wastageAmount),
        reason: wastageReason,
      });
    } else {
      addWastageItem(selectedDate, wastageDesc.trim(), Number(wastageAmount), wastageReason);
    }
    setWastageModalOpen(false);
  };

  // Handlers: Capital
  const handleSaveCapital = () => {
    const num = Number(capitalInput || 0);
    updateInitialCapital(isNaN(num) ? 0 : num);
    setCapitalModalOpen(false);
  };

  const handleExecuteDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'asset') {
      deleteFixedAsset(deleteTarget.id);
    } else if (deleteTarget.type === 'bill') {
      deleteMonthlyBill(deleteTarget.id);
    } else if (deleteTarget.type === 'wastage') {
      deleteWastageItem(selectedDate, deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const initialCapital = Number(data?.restaurant_info?.initial_capital_investment || 0);
  const totalFixedCost = (data.fixed_assets || []).reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalCombinedInvestment = initialCapital + totalFixedCost;
  const totalMonthlyBills = (data.monthly_bills || []).reduce((s, b) => s + Number(b.amount || 0), 0);
  const totalTodayWastage = (record.wastage_demurrage || []).reduce((s, w) => s + Number(w.amount || 0), 0);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Universal Delete Confirmation Modal */}
      <DesktopDeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteTarget?.type === 'asset' ? 'Capital Asset' : deleteTarget?.type === 'bill' ? 'Monthly Bill' : 'Wastage Item'}?`}
        itemName={deleteTarget?.name}
        itemAmount={deleteTarget?.amount}
        description="This expense record will be permanently removed and totals will update immediately."
      />

      {/* Top Header & Segment Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '22px',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Fixed CapEx, Monthly Bills & Wastage
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Manage capital investments, recurring shop expenses, utilities and kitchen spoilage
          </p>
        </div>

        {/* 3-Way Segment Selector */}
        <div style={{
          display: 'flex',
          backgroundColor: '#FFFFFF',
          padding: '4px',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        }}>
          <button
            onClick={() => setSegment('FIXED')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: segment === 'FIXED' ? 'var(--primary-light)' : 'transparent',
              color: segment === 'FIXED' ? 'var(--primary-dark)' : 'var(--text-secondary)',
              fontWeight: segment === 'FIXED' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Armchair size={16} />
            <span>Fixed CapEx & Capital ({data.fixed_assets?.length || 0})</span>
          </button>

          <button
            onClick={() => setSegment('MONTHLY')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: segment === 'MONTHLY' ? 'var(--amber-light)' : 'transparent',
              color: segment === 'MONTHLY' ? 'var(--amber)' : 'var(--text-secondary)',
              fontWeight: segment === 'MONTHLY' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Zap size={16} />
            <span>Monthly Bills ({data.monthly_bills?.length || 0})</span>
          </button>

          <button
            onClick={() => setSegment('WASTAGE')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: segment === 'WASTAGE' ? 'var(--rose-light)' : 'transparent',
              color: segment === 'WASTAGE' ? 'var(--rose)' : 'var(--text-secondary)',
              fontWeight: segment === 'WASTAGE' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AlertTriangle size={16} />
            <span>Wastage & Losses ({record.wastage_demurrage?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SEGMENT 1: FIXED ASSETS & SETUP CAPITAL
          ======================================================== */}
      {segment === 'FIXED' && (
        <div>
          {/* Top Capital Setup Overview Box */}
          <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Coins size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Total Hotel Setup Investment Base</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Combined Initial Capital + Fixed Asset Renovation & Equipment</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setCapitalInput(String(initialCapital));
                  setCapitalModalOpen(true);
                }}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12.5, backgroundColor: '#F8FAFC', color: 'var(--primary)', border: '1px solid #CBD5E1' }}
              >
                <Edit2 size={14} />
                <span>Edit Initial Capital</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>1. Initial Capital Invested</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {formatCurrency(initialCapital)}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 14, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-muted)' }}>2. Fixed Equipment CapEx</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', marginTop: 4 }}>
                  {formatCurrency(totalFixedCost)}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--primary-light)', padding: 14, borderRadius: 12, border: '1.5px solid rgba(5, 150, 105, 0.3)' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--primary-dark)' }}>Total Setup Capital Base</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary-dark)', marginTop: 4 }}>
                  {formatCurrency(totalCombinedInvestment)}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Assets Register Table */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Fixed Capital Equipment Register</h2>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Total Lifetime CapEx: <strong style={{ color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(totalFixedCost)}</strong>
                </p>
              </div>

              <button
                onClick={handleOpenAddAsset}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12.5 }}
              >
                <Plus size={15} />
                <span>+ Add Capital Asset</span>
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 8px' }}>Asset / Equipment Name</th>
                  <th style={{ padding: '12px 8px' }}>Category</th>
                  <th style={{ padding: '12px 8px' }}>Purchase Date</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Cost Amount</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.fixed_assets || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No capital equipment assets recorded yet.
                    </td>
                  </tr>
                ) : (
                  (data.fixed_assets || []).map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--text-main)' }}>
                        {asset.item_name}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                          {asset.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                        {asset.date}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--text-main)', fontSize: 14 }}>
                        {formatCurrency(asset.amount)}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleOpenEditAsset(asset)}
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                            title="Edit asset"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'asset',
                              id: asset.id,
                              name: asset.item_name,
                              amount: formatCurrency(asset.amount),
                            })}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                            title="Delete asset"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          SEGMENT 2: MONTHLY UTILITIES & BILLS
          ======================================================== */}
      {segment === 'MONTHLY' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Monthly Recurring Operational Bills</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Recorded Bills: <strong style={{ color: 'var(--amber)', fontSize: 14 }}>{formatCurrency(totalMonthlyBills)}</strong>
              </p>
            </div>

            <button
              onClick={handleOpenAddBill}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 12.5, backgroundColor: 'var(--amber)' }}
            >
              <Plus size={15} />
              <span>+ Record Monthly Bill</span>
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 8px' }}>Bill Description</th>
                <th style={{ padding: '12px 8px' }}>Billing Month</th>
                <th style={{ padding: '12px 8px' }}>Payment Date</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>Amount</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Payment Status</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data.monthly_bills || []).length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No recurring operational bills recorded yet.
                  </td>
                </tr>
              ) : (
                (data.monthly_bills || []).map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {bill.bill_type}
                    </td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                      {bill.month_year}
                    </td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                      {bill.payment_date}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--amber)', fontSize: 14 }}>
                      {formatCurrency(bill.amount)}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <button
                        onClick={() => toggleMonthlyBillPaid(bill.id)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: 'none',
                          backgroundColor: bill.status === 'PAID' ? 'var(--primary-light)' : 'var(--rose-light)',
                          color: bill.status === 'PAID' ? 'var(--primary-dark)' : 'var(--rose)',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {bill.status === 'PAID' ? 'PAID' : 'PENDING'}
                      </button>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditBill(bill)}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                          title="Edit bill"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({
                            type: 'bill',
                            id: bill.id,
                            name: bill.bill_type,
                            amount: formatCurrency(bill.amount),
                          })}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                          title="Delete bill"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================
          SEGMENT 3: WASTAGE & DEMURRAGE
          ======================================================== */}
      {segment === 'WASTAGE' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Wastage, Breakage & Demurrage Loss</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Today's Recorded Loss: <strong style={{ color: 'var(--rose)', fontSize: 14 }}>{formatCurrency(totalTodayWastage)}</strong>
              </p>
            </div>

            <button
              onClick={handleOpenAddWastage}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: 12.5, backgroundColor: 'var(--rose)' }}
            >
              <Plus size={15} />
              <span>+ Record Wastage</span>
            </button>
          </div>

          {(!record.wastage_demurrage || record.wastage_demurrage.length === 0) ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: 36, borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px solid #E2E8F0' }}>
              Zero wastage or breakage recorded for this day.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 8px' }}>Item Description</th>
                  <th style={{ padding: '12px 8px' }}>Reason / Cause</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Estimated Loss</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {record.wastage_demurrage.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {item.item_description}
                    </td>
                    <td style={{ padding: '14px 8px', color: 'var(--text-secondary)' }}>
                      {item.reason}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--rose)', fontSize: 14 }}>
                      -{formatCurrency(item.amount)}
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          onClick={() => handleOpenEditWastage(item)}
                          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                          title="Edit wastage"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({
                            type: 'wastage',
                            id: item.id,
                            name: item.item_description,
                            amount: formatCurrency(item.amount),
                          })}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL 1: ADD/EDIT ASSET */}
      <DesktopModal
        visible={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        title={editingAsset ? "Edit Fixed Capital Asset" : "Add Fixed Capital Asset"}
        subtitle="Record equipment, restaurant furniture or kitchen setup expenses"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Asset / Equipment Name</label>
          <input className="input-field" placeholder="e.g. 10 Dining Tables & 40 Chairs" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Purchase Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 150000" value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Purchase Date</label>
          <input type="date" className="input-field" value={assetDate} onChange={(e) => setAssetDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['FURNITURE', 'KITCHEN_EQUIPMENT', 'APPLIANCES', 'INTERIOR', 'UTENSILS', 'ELECTRONICS'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAssetCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: assetCategory === cat ? 800 : 600,
                  backgroundColor: assetCategory === cat ? 'var(--primary-light)' : '#F1F5F9',
                  color: assetCategory === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1.5px solid ${assetCategory === cat ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSaveAsset} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
          {editingAsset ? "Update Capital Asset" : "Save Capital Asset"}
        </button>
      </DesktopModal>

      {/* MODAL 2: ADD/EDIT MONTHLY BILL */}
      <DesktopModal
        visible={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title={editingBill ? "Edit Monthly Bill" : "Record Monthly Recurring Bill"}
        subtitle="Record shop rent, electricity, gas, internet and waste management"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Bill Description / Type</label>
          <input className="input-field" placeholder="e.g. Shop Rent / Electricity Bill" value={billType} onChange={(e) => setBillType(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Bill Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 22000" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Billing Month (YYYY-MM)</label>
          <input className="input-field" placeholder="2026-08" value={billMonth} onChange={(e) => setBillMonth(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Date</label>
          <input type="date" className="input-field" value={billPaymentDate} onChange={(e) => setBillPaymentDate(e.target.value)} />
        </div>
        <button onClick={handleSaveBill} className="btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--amber)', color: '#FFF' }}>
          {editingBill ? "Update Monthly Bill" : "Save Monthly Bill"}
        </button>
      </DesktopModal>

      {/* MODAL 3: ADD/EDIT WASTAGE */}
      <DesktopModal
        visible={wastageModalOpen}
        onClose={() => setWastageModalOpen(false)}
        title={editingWastage ? "Edit Wastage Record" : "Record Wastage or Breakage"}
        subtitle="Track damaged supplies, food spoilage or kitchen breakage loss"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Item Description</label>
          <input className="input-field" placeholder="e.g. 5 Plates broken / 3kg fish spoiled" value={wastageDesc} onChange={(e) => setWastageDesc(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Estimated Loss Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 1200" value={wastageAmount} onChange={(e) => setWastageAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason / Cause</label>
          <input className="input-field" placeholder="e.g. Accidental drop during rush hours" value={wastageReason} onChange={(e) => setWastageReason(e.target.value)} />
        </div>
        <button onClick={handleSaveWastage} className="btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--rose)', color: '#FFF' }}>
          {editingWastage ? "Update Wastage Record" : "Save Wastage Record"}
        </button>
      </DesktopModal>

      {/* MODAL 4: EDIT INITIAL CAPITAL */}
      <DesktopModal
        visible={capitalModalOpen}
        onClose={() => setCapitalModalOpen(false)}
        title="Configure Initial Hotel Setup Capital"
        subtitle="Set the starting investment amount before daily operational expenses"
      >
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Initial Capital Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 500000"
            value={capitalInput}
            onChange={(e) => setCapitalInput(e.target.value)}
          />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, lineHeight: 1.5 }}>
            💡 This amount is combined with your fixed equipment assets to compute your total setup capital for ROI and payback tracking.
          </p>
        </div>
        <button onClick={handleSaveCapital} className="btn-primary" style={{ width: '100%', padding: '12px' }}>
          Save Initial Capital
        </button>
      </DesktopModal>
    </div>
  );
};
