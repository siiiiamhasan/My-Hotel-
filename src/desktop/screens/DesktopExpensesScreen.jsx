import React, { useState } from 'react';
import { 
  Armchair, 
  Zap, 
  AlertTriangle, 
  Plus, 
  Trash2,
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
    deleteFixedAsset, 
    addMonthlyBill, 
    deleteMonthlyBill,
    toggleMonthlyBillPaid,
    addWastageItem,
    deleteWastageItem
  } = useAppData();

  const [segment, setSegment] = useState('FIXED'); // 'FIXED', 'MONTHLY', 'WASTAGE'
  const record = getDayRecord(selectedDate);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type, id, name, amount }

  // Modals
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [wastageModalOpen, setWastageModalOpen] = useState(false);

  // Form states
  const [assetName, setAssetName] = useState('');
  const [assetAmount, setAssetAmount] = useState('');
  const [assetCategory, setAssetCategory] = useState('FURNITURE');

  const [billType, setBillType] = useState('Shop Rent');
  const [billAmount, setBillAmount] = useState('');
  const [billMonth, setBillMonth] = useState(selectedDate.slice(0, 7));

  const [wastageDesc, setWastageDesc] = useState('');
  const [wastageAmount, setWastageAmount] = useState('');
  const [wastageReason, setWastageReason] = useState('Accidental kitchen breakage');

  // Handlers
  const handleSaveAsset = () => {
    if (!assetName.trim() || !assetAmount) {
      return;
    }
    addFixedAsset({
      item_name: assetName.trim(),
      amount: Number(assetAmount),
      category: assetCategory,
      date: selectedDate,
    });
    setAssetName('');
    setAssetAmount('');
    setAssetModalOpen(false);
  };

  const handleSaveBill = () => {
    if (!billType.trim() || !billAmount) {
      return;
    }
    addMonthlyBill({
      bill_type: billType.trim(),
      amount: Number(billAmount),
      month_year: billMonth,
      payment_date: selectedDate,
      status: 'PAID'
    });
    setBillType('Shop Rent');
    setBillAmount('');
    setBillModalOpen(false);
  };

  const handleSaveWastage = () => {
    if (!wastageDesc.trim() || !wastageAmount) {
      return;
    }
    addWastageItem(selectedDate, wastageDesc.trim(), Number(wastageAmount), wastageReason);
    setWastageDesc('');
    setWastageAmount('');
    setWastageModalOpen(false);
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

  const totalFixedCost = (data.fixed_assets || []).reduce((s, a) => s + Number(a.amount || 0), 0);
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
        description="This expense record will be permanently removed from the ledger."
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
            <span>Fixed CapEx ({data.fixed_assets?.length || 0})</span>
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
          SEGMENT 1: FIXED ASSETS REGISTER
          ======================================================== */}
      {segment === 'FIXED' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Fixed Capital Equipment & Renovations</h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Total Lifetime CapEx: <strong style={{ color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(totalFixedCost)}</strong>
              </p>
            </div>

            <button
              onClick={() => setAssetModalOpen(true)}
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
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(data.fixed_assets || []).map((asset) => (
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              onClick={() => setBillModalOpen(true)}
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
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {(data.monthly_bills || []).map((bill) => (
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
                  </td>
                </tr>
              ))}
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
              onClick={() => setWastageModalOpen(true)}
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
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Action</th>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL 1: ADD ASSET */}
      <DesktopModal
        visible={assetModalOpen}
        onClose={() => setAssetModalOpen(false)}
        title="Add Fixed Capital Asset"
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
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Category</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['FURNITURE', 'KITCHEN_EQUIPMENT', 'APPLIANCES', 'INTERIOR', 'UTENSILS'].map((cat) => (
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
        <button onClick={handleSaveAsset} className="btn-primary" style={{ width: '100%', padding: '12px' }}>Save Capital Asset</button>
      </DesktopModal>

      {/* MODAL 2: ADD MONTHLY BILL */}
      <DesktopModal
        visible={billModalOpen}
        onClose={() => setBillModalOpen(false)}
        title="Record Monthly Recurring Bill"
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
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>Billing Month (YYYY-MM)</label>
          <input className="input-field" placeholder="2026-08" value={billMonth} onChange={(e) => setBillMonth(e.target.value)} />
        </div>
        <button onClick={handleSaveBill} className="btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--amber)', color: '#FFF' }}>Save Monthly Bill</button>
      </DesktopModal>

      {/* MODAL 3: ADD WASTAGE */}
      <DesktopModal
        visible={wastageModalOpen}
        onClose={() => setWastageModalOpen(false)}
        title="Record Wastage or Breakage"
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
        <button onClick={handleSaveWastage} className="btn-primary" style={{ width: '100%', padding: '12px', backgroundColor: 'var(--rose)', color: '#FFF' }}>Save Wastage Record</button>
      </DesktopModal>
    </div>
  );
};
