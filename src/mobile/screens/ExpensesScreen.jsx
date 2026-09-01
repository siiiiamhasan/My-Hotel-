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
import { CustomModal } from '../components/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const ExpensesScreen = () => {
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

  // Universal Delete Confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name, amount }

  // Modals: Add
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [wastageModalOpen, setWastageModalOpen] = useState(false);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);

  // Modals: Edit
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingBill, setEditingBill] = useState(null);
  const [editingWastage, setEditingWastage] = useState(null);

  // Form: Asset Add/Edit
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetCategory, setAssetCategory] = useState('FURNITURE');
  const [assetDate, setAssetDate] = useState(selectedDate);

  // Form: Bill Add/Edit
  const [billType, setBillType] = useState('Electricity Bill');
  const [billAmount, setBillAmount] = useState('');
  const [billMonth, setBillMonth] = useState(selectedDate.slice(0, 7));
  const [billPaymentDate, setBillPaymentDate] = useState(selectedDate);

  // Form: Wastage Add/Edit
  const [wastageDesc, setWastageDesc] = useState('');
  const [wastageAmount, setWastageAmount] = useState('');
  const [wastageReason, setWastageReason] = useState('Accidental breakage');

  // Form: Capital
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
    setBillType('Electricity Bill');
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
    setWastageReason('Accidental breakage');
    setWastageModalOpen(true);
  };

  const handleOpenEditWastage = (item) => {
    setEditingWastage(item);
    setWastageDesc(item.item_description);
    setWastageAmount(String(item.amount));
    setWastageReason(item.reason || 'Accidental breakage');
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
    <div style={{ padding: '14px', paddingBottom: '24px' }}>
      {/* Universal Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteTarget?.type === 'asset' ? 'Capital Asset' : deleteTarget?.type === 'bill' ? 'Monthly Bill' : 'Wastage Item'}?`}
        itemName={deleteTarget?.name}
        itemAmount={deleteTarget?.amount}
        description="This expense record will be permanently deleted and totals will update immediately."
      />

      {/* 3-Way Segment Selector */}
      <div style={{
        display: 'flex',
        backgroundColor: '#FFFFFF',
        padding: 4,
        borderRadius: 14,
        border: '1.5px solid #E2E8F0',
        marginBottom: 14,
        boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
      }}>
        <button
          onClick={() => setSegment('FIXED')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: segment === 'FIXED' ? 'var(--primary-light)' : 'transparent',
            color: segment === 'FIXED' ? 'var(--primary-dark)' : 'var(--text-secondary)',
            fontWeight: segment === 'FIXED' ? 800 : 600,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Armchair size={14} color={segment === 'FIXED' ? 'var(--primary)' : 'var(--text-muted)'} />
          <span>Fixed CapEx</span>
        </button>

        <button
          onClick={() => setSegment('MONTHLY')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: segment === 'MONTHLY' ? 'var(--amber-light)' : 'transparent',
            color: segment === 'MONTHLY' ? 'var(--amber)' : 'var(--text-secondary)',
            fontWeight: segment === 'MONTHLY' ? 800 : 600,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Zap size={14} color={segment === 'MONTHLY' ? 'var(--amber)' : 'var(--text-muted)'} />
          <span>Monthly Bills</span>
        </button>

        <button
          onClick={() => setSegment('WASTAGE')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: segment === 'WASTAGE' ? 'var(--rose-light)' : 'transparent',
            color: segment === 'WASTAGE' ? 'var(--rose)' : 'var(--text-secondary)',
            fontWeight: segment === 'WASTAGE' ? 800 : 600,
            fontSize: 11,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <AlertTriangle size={14} color={segment === 'WASTAGE' ? 'var(--rose)' : 'var(--text-muted)'} />
          <span>Wastage/Loss</span>
        </button>
      </div>

      {/* SEGMENT 1: FIXED ASSETS & CAPEX */}
      {segment === 'FIXED' && (
        <div>
          {/* Initial Setup Capital Hero Card */}
          <div className="glass-card" style={{
            padding: '14px',
            marginBottom: '14px',
            backgroundColor: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Coins size={16} color="var(--primary)" />
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                  Total Setup Investment
                </span>
              </div>
              <button
                onClick={() => {
                  setCapitalInput(String(initialCapital));
                  setCapitalModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: 'var(--primary)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Edit2 size={11} />
                <span>Edit Capital</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Initial Hotel Capital</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                  {formatCurrency(initialCapital)}
                </div>
              </div>
              <div style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>Fixed Equipment CapEx</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                  {formatCurrency(totalFixedCost)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              paddingTop: 8,
              borderTop: '1px solid #E2E8F0',
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>Combined Capital Base</span>
              <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}>
                {formatCurrency(totalCombinedInvestment)}
              </span>
            </div>
          </div>

          {/* Fixed Assets Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Fixed Assets Register</h2>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                {(data.fixed_assets || []).length} equipment & renovation items
              </p>
            </div>
            <button
              onClick={handleOpenAddAsset}
              style={{
                backgroundColor: 'var(--primary)',
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
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
              }}
            >
              <Plus size={12} />
              <span>+ Add Asset</span>
            </button>
          </div>

          {(data.fixed_assets || []).length === 0 ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5, border: '1px solid #E2E8F0' }}>
              No fixed equipment assets added yet.
            </div>
          ) : (
            (data.fixed_assets || []).map((asset) => (
              <div key={asset.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{asset.item_name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{asset.category} • Purchased: {asset.date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)', marginRight: 4 }}>{formatCurrency(asset.amount)}</span>
                  <button
                    onClick={() => handleOpenEditAsset(asset)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    title="Edit asset"
                  >
                    <Edit2 size={14} />
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
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SEGMENT 2: MONTHLY UTILITY BILLS */}
      {segment === 'MONTHLY' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Monthly Running Bills</h2>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Recorded: <strong style={{ color: 'var(--text-main)' }}>{formatCurrency(totalMonthlyBills)}</strong>
              </p>
            </div>
            <button
              onClick={handleOpenAddBill}
              style={{
                backgroundColor: 'var(--amber)',
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
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
              }}
            >
              <Plus size={12} />
              <span>+ Add Bill</span>
            </button>
          </div>

          {(data.monthly_bills || []).length === 0 ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5, border: '1px solid #E2E8F0' }}>
              No monthly bills recorded yet.
            </div>
          ) : (
            (data.monthly_bills || []).map((bill) => (
              <div key={bill.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{bill.bill_type}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>Month: {bill.month_year} • Paid: {bill.payment_date}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--amber)' }}>{formatCurrency(bill.amount)}</span>
                  <button
                    onClick={() => toggleMonthlyBillPaid(bill.id)}
                    style={{
                      padding: '3px 6px',
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: bill.status === 'PAID' ? 'var(--primary-light)' : 'var(--rose-light)',
                      color: bill.status === 'PAID' ? 'var(--primary-dark)' : 'var(--rose)',
                      fontSize: 9.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {bill.status}
                  </button>
                  <button
                    onClick={() => handleOpenEditBill(bill)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    title="Edit bill"
                  >
                    <Edit2 size={14} />
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
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SEGMENT 3: WASTAGE & DEMURRAGE */}
      {segment === 'WASTAGE' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Wastage & Damages</h2>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Today's Loss: <strong style={{ color: 'var(--rose)' }}>{formatCurrency(totalTodayWastage)}</strong>
              </p>
            </div>
            <button
              onClick={handleOpenAddWastage}
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
              <span>+ Record Loss</span>
            </button>
          </div>

          {(!record.wastage_demurrage || record.wastage_demurrage.length === 0) ? (
            <div style={{ backgroundColor: '#F8FAFC', padding: 18, borderRadius: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 11.5, border: '1px solid #E2E8F0' }}>
              Zero wastage or damages recorded for this day.
            </div>
          ) : (
            record.wastage_demurrage.map((item) => (
              <div key={item.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>{item.item_description}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{item.reason}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--rose)' }}>-{formatCurrency(item.amount)}</span>
                  <button
                    onClick={() => handleOpenEditWastage(item)}
                    style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 4 }}
                    title="Edit wastage"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({
                      type: 'wastage',
                      id: item.id,
                      name: item.item_description,
                      amount: formatCurrency(item.amount),
                    })}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                    title="Delete wastage"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL 1: ADD/EDIT ASSET */}
      <CustomModal
        visible={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        title={editingAsset ? "Edit Fixed Capital Asset" : "Add Fixed Capital Asset"}
        subtitle="Record equipment, furniture or renovations"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Asset Name</label>
          <input className="input-field" placeholder="e.g. 10 Dining Tables & 40 Chairs" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Purchase Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 150000" value={assetAmount} onChange={(e) => setAssetAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Purchase Date</label>
          <input type="date" className="input-field" value={assetDate} onChange={(e) => setAssetDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['FURNITURE', 'KITCHEN_EQUIPMENT', 'APPLIANCES', 'INTERIOR', 'UTENSILS', 'ELECTRONICS'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setAssetCategory(cat)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: assetCategory === cat ? 800 : 600,
                  backgroundColor: assetCategory === cat ? 'var(--primary-light)' : '#F1F5F9',
                  color: assetCategory === cat ? 'var(--primary-dark)' : 'var(--text-secondary)',
                  border: `1px solid ${assetCategory === cat ? 'var(--primary)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <button onClick={handleSaveAsset} className="btn-primary" style={{ width: '100%' }}>
          {editingAsset ? "Update Capital Asset" : "Save Capital Asset"}
        </button>
      </CustomModal>

      {/* MODAL 2: ADD/EDIT MONTHLY BILL */}
      <CustomModal
        visible={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title={editingBill ? "Edit Monthly Bill" : "Record Monthly Recurring Bill"}
        subtitle="Utilities, shop rent, gas, wifi"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Bill Type</label>
          <input className="input-field" placeholder="e.g. Shop Rent / Electricity" value={billType} onChange={(e) => setBillType(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Bill Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 18500" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Billing Month (YYYY-MM)</label>
          <input className="input-field" placeholder="2026-08" value={billMonth} onChange={(e) => setBillMonth(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Payment Date</label>
          <input type="date" className="input-field" value={billPaymentDate} onChange={(e) => setBillPaymentDate(e.target.value)} />
        </div>
        <button onClick={handleSaveBill} className="btn-primary" style={{ width: '100%', backgroundColor: 'var(--amber)', color: '#FFF' }}>
          {editingBill ? "Update Monthly Bill" : "Save Monthly Bill"}
        </button>
      </CustomModal>

      {/* MODAL 3: ADD/EDIT WASTAGE */}
      <CustomModal
        visible={wastageModalOpen}
        onClose={() => setWastageModalOpen(false)}
        title={editingWastage ? "Edit Wastage Record" : "Record Wastage or Breakage"}
        subtitle="Track damaged items, spoilage or loss"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Item Description</label>
          <input className="input-field" placeholder="e.g. 2 Water Glasses broken / 2kg chicken spoiled" value={wastageDesc} onChange={(e) => setWastageDesc(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Estimated Loss Amount (৳)</label>
          <input type="number" className="input-field" placeholder="e.g. 500" value={wastageAmount} onChange={(e) => setWastageAmount(e.target.value)} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Reason / Notes</label>
          <input className="input-field" placeholder="e.g. Kitchen accident / Storage failure" value={wastageReason} onChange={(e) => setWastageReason(e.target.value)} />
        </div>
        <button onClick={handleSaveWastage} className="btn-primary" style={{ width: '100%', backgroundColor: 'var(--rose)', color: '#FFF' }}>
          {editingWastage ? "Update Wastage Record" : "Save Wastage Record"}
        </button>
      </CustomModal>

      {/* MODAL 4: EDIT INITIAL CAPITAL */}
      <CustomModal
        visible={capitalModalOpen}
        onClose={() => setCapitalModalOpen(false)}
        title="Set Initial Hotel Setup Capital"
        subtitle="Original capital invested before daily operations"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Initial Capital Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 500000"
            value={capitalInput}
            onChange={(e) => setCapitalInput(e.target.value)}
          />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.4 }}>
            💡 This is combined with your fixed equipment assets to determine your overall setup cost for the Breakeven ROI calculation.
          </p>
        </div>
        <button onClick={handleSaveCapital} className="btn-primary" style={{ width: '100%' }}>
          Save Initial Capital
        </button>
      </CustomModal>
    </div>
  );
};
