import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  UserPlus,
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { 
  formatCurrency, 
  calculateStaffMonthlyStatus, 
  calculateOwnerLifetimeDrawings 
} from '../../utils/accounting';
import { DesktopModal } from '../components/DesktopModal';
import { DesktopDeleteConfirmModal } from '../components/DesktopDeleteConfirmModal';

export const DesktopFamilyStaffScreen = () => {
  const { 
    data, 
    selectedDate, 
    addOwnerDrawing, 
    deleteOwnerDrawing,
    addOwner,
    updateOwner,
    deleteOwner,
    addStaffAdvance, 
    deleteStaffAdvance,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember
  } = useAppData();

  const [activeSegment, setActiveSegment] = useState('OWNERS'); // 'OWNERS' or 'STAFF'
  
  // Profile Drawer State
  const [selectedOwnerForDetails, setSelectedOwnerForDetails] = useState(null);
  const [selectedStaffForDetails, setSelectedStaffForDetails] = useState(null);

  // Universal Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState(null); 

  // Modals
  const [drawingModalOpen, setDrawingModalOpen] = useState(false);
  const [advanceModalOpen, setAdvanceModalOpen] = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [editingOwnerId, setEditingOwnerId] = useState(null);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);

  // Form: Partner / Owner Form
  const [ownerFormName, setOwnerFormName] = useState('');
  const [ownerFormRole, setOwnerFormRole] = useState('Managing Partner');
  const [ownerFormPhone, setOwnerFormPhone] = useState('');
  const [ownerFormColor, setOwnerFormColor] = useState('#059669');

  // Form: Staff Form
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormRole, setStaffFormRole] = useState('Chef / Waiter');
  const [staffFormSalary, setStaffFormSalary] = useState('');
  const [staffFormPhone, setStaffFormPhone] = useState('');
  const [staffFormDate, setStaffFormDate] = useState(new Date().toISOString().split('T')[0]);

  // Form: Pocket Money Entry
  const [drawingOwnerId, setDrawingOwnerId] = useState(data.owners?.[0]?.id || '');
  const [drawingAmount, setDrawingAmount] = useState('');
  const [drawingPurpose, setDrawingPurpose] = useState('Personal Pocket Money');

  // Form: Staff Advance Entry
  const [advanceStaffId, setAdvanceStaffId] = useState(data.staff?.[0]?.id || '');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('Daily Advance');

  // --- Handlers: Partner Management ---
  const handleOpenAddOwner = () => {
    setEditingOwnerId(null);
    setOwnerFormName('');
    setOwnerFormRole('Managing Partner');
    setOwnerFormPhone('');
    setOwnerFormColor('#059669');
    setOwnerModalOpen(true);
  };

  const handleOpenEditOwner = (owner) => {
    setEditingOwnerId(owner.id);
    setOwnerFormName(owner.name);
    setOwnerFormRole(owner.role || 'Managing Partner');
    setOwnerFormPhone(owner.phone || '');
    setOwnerFormColor(owner.color || '#059669');
    setOwnerModalOpen(true);
  };

  const handleSaveOwner = () => {
    if (!ownerFormName.trim()) {
      return;
    }
    if (editingOwnerId) {
      updateOwner(editingOwnerId, {
        name: ownerFormName.trim(),
        role: ownerFormRole.trim(),
        phone: ownerFormPhone.trim(),
        color: ownerFormColor,
      });
      if (selectedOwnerForDetails?.id === editingOwnerId) {
        setSelectedOwnerForDetails(prev => ({
          ...prev,
          name: ownerFormName.trim(),
          role: ownerFormRole.trim(),
          phone: ownerFormPhone.trim(),
          color: ownerFormColor,
        }));
      }
    } else {
      addOwner({
        name: ownerFormName.trim(),
        role: ownerFormRole.trim(),
        phone: ownerFormPhone.trim(),
        color: ownerFormColor,
      });
    }
    setOwnerModalOpen(false);
  };

  // --- Handlers: Staff Management ---
  const handleOpenAddStaff = () => {
    setEditingStaffId(null);
    setStaffFormName('');
    setStaffFormRole('Chef / Waiter');
    setStaffFormSalary('');
    setStaffFormPhone('');
    setStaffFormDate(new Date().toISOString().split('T')[0]);
    setStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setStaffFormName(staff.name);
    setStaffFormRole(staff.designation || 'Staff');
    setStaffFormSalary(String(staff.monthly_salary || ''));
    setStaffFormPhone(staff.phone || '');
    setStaffFormDate(staff.joining_date || new Date().toISOString().split('T')[0]);
    setStaffModalOpen(true);
  };

  const handleSaveStaff = () => {
    if (!staffFormName.trim() || !staffFormSalary) {
      return;
    }
    if (editingStaffId) {
      updateStaffMember(editingStaffId, {
        name: staffFormName.trim(),
        designation: staffFormRole.trim(),
        monthly_salary: Number(staffFormSalary),
        phone: staffFormPhone.trim(),
        joining_date: staffFormDate,
      });
      if (selectedStaffForDetails?.id === editingStaffId) {
        setSelectedStaffForDetails(prev => ({
          ...prev,
          name: staffFormName.trim(),
          designation: staffFormRole.trim(),
          monthly_salary: Number(staffFormSalary),
          phone: staffFormPhone.trim(),
        }));
      }
    } else {
      addStaffMember({
        name: staffFormName.trim(),
        designation: staffFormRole.trim(),
        monthly_salary: Number(staffFormSalary),
        phone: staffFormPhone.trim(),
        joining_date: staffFormDate,
      });
    }
    setStaffModalOpen(false);
  };

  // --- Handlers: Pocket Money ---
  const handleSaveDrawing = () => {
    if (!drawingAmount || isNaN(Number(drawingAmount))) {
      return;
    }
    addOwnerDrawing(selectedDate, drawingOwnerId, Number(drawingAmount), drawingPurpose);
    setDrawingAmount('');
    setDrawingModalOpen(false);
  };

  // --- Handlers: Staff Advance ---
  const handleSaveAdvance = () => {
    if (!advanceAmount || isNaN(Number(advanceAmount))) {
      return;
    }
    addStaffAdvance(selectedDate, advanceStaffId, Number(advanceAmount), advanceNote);
    setAdvanceAmount('');
    setAdvanceModalOpen(false);
  };

  const handleExecuteDelete = () => {
    if (!deleteTarget) return;
    const { type, id, date } = deleteTarget;

    if (type === 'owner') {
      deleteOwner(id);
      setSelectedOwnerForDetails(null);
    } else if (type === 'staff') {
      deleteStaffMember(id);
      setSelectedStaffForDetails(null);
    } else if (type === 'drawing') {
      deleteOwnerDrawing(date || selectedDate, id);
    } else if (type === 'advance') {
      deleteStaffAdvance(date || selectedDate, id);
    }
    setDeleteTarget(null);
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Universal Delete Modal */}
      <DesktopDeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteTarget?.type === 'owner' ? 'Family Partner' : deleteTarget?.type === 'staff' ? 'Staff Member' : 'Transaction'}?`}
        itemName={deleteTarget?.name}
        itemAmount={deleteTarget?.amount}
        description="This record will be permanently deleted from the database."
      />

      {/* Top Controls Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '22px',
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Family Partners & Staff Payroll
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Manage owner profit drawings, employee monthly salaries & advance ledgers
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: '#FFFFFF',
          padding: '4px',
          borderRadius: 14,
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
        }}>
          <button
            onClick={() => setActiveSegment('OWNERS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: activeSegment === 'OWNERS' ? 'var(--purple-light)' : 'transparent',
              color: activeSegment === 'OWNERS' ? 'var(--purple)' : 'var(--text-secondary)',
              fontWeight: activeSegment === 'OWNERS' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Users size={16} />
            <span>Family Partners ({data.owners?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveSegment('STAFF')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 10,
              border: 'none',
              backgroundColor: activeSegment === 'STAFF' ? 'var(--cyan-light)' : 'transparent',
              color: activeSegment === 'STAFF' ? 'var(--cyan)' : 'var(--text-secondary)',
              fontWeight: activeSegment === 'STAFF' ? 800 : 600,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <UserCheck size={16} />
            <span>Staff Directory & Payroll ({data.staff?.length || 0})</span>
          </button>
        </div>
      </div>

      {/* ========================================================
          SEGMENT 1: FAMILY PARTNERS DIRECTORY
          ======================================================== */}
      {activeSegment === 'OWNERS' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>Managing Partners Matrix</h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleOpenAddOwner}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={15} color="var(--primary)" />
                <span>+ Register New Partner</span>
              </button>

              <button
                onClick={() => setDrawingModalOpen(true)}
                style={{
                  backgroundColor: 'var(--purple)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(147, 51, 234, 0.3)',
                }}
              >
                <Plus size={15} />
                <span>+ Record Pocket Money</span>
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px',
          }}>
            {(data.owners || []).map((owner) => {
              const stats = calculateOwnerLifetimeDrawings(owner.id, data);
              return (
                <div
                  key={owner.id}
                  onClick={() => setSelectedOwnerForDetails(owner)}
                  className="glass-card"
                  style={{
                    padding: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        backgroundColor: owner.color || 'var(--purple)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        color: '#FFF',
                        fontSize: 17,
                      }}>
                        {owner.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-main)' }}>{owner.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditOwner(owner);
                            }}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                            title="Edit Partner"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                          {owner.role} • {owner.phone}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lifetime Withdrawn</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--purple)' }}>{formatCurrency(stats.totalDrawings)}</div>
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 8,
                    backgroundColor: '#F8FAFC',
                    padding: 10,
                    borderRadius: 10,
                    border: '1px solid #E2E8F0',
                    marginTop: 14,
                    fontSize: 11.5,
                  }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>This Month</div>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>{formatCurrency(stats.monthlyDrawings)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)' }}>Total Logs</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>{stats.history.length} records</div>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 12,
                    paddingTop: 8,
                    borderTop: '1px solid #E2E8F0',
                    fontSize: 12,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Click to view full drawing ledger</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--purple)', fontWeight: 800 }}>
                      <span>View History</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SEGMENT 2: STAFF & PAYROLL MATRIX
          ======================================================== */}
      {activeSegment === 'STAFF' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>
                Staff Directory & Monthly Payroll
              </h2>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                Active Payroll Period: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleOpenAddStaff}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '8px 14px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={15} color="var(--primary)" />
                <span>+ Register New Staff</span>
              </button>

              <button
                onClick={() => setAdvanceModalOpen(true)}
                style={{
                  backgroundColor: 'var(--cyan)',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: 10,
                  padding: '8px 16px',
                  fontSize: 12.5,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(8, 145, 178, 0.3)',
                }}
              >
                <Plus size={15} />
                <span>+ Record Staff Advance</span>
              </button>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5, textTransform: 'uppercase' }}>
                  <th style={{ padding: '12px 8px' }}>Staff Member</th>
                  <th style={{ padding: '12px 8px' }}>Designation</th>
                  <th style={{ padding: '12px 8px' }}>Phone</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Base Salary</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Advances ({selectedDate.slice(0, 7)})</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Net Due Salary</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data.staff || []).map((staffMember) => {
                  const currentMonth = selectedDate.slice(0, 7);
                  const payroll = calculateStaffMonthlyStatus(staffMember, data, currentMonth);

                  return (
                    <tr key={staffMember.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            backgroundColor: 'var(--cyan)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#FFF',
                            fontSize: 15,
                          }}>
                            {staffMember.name.charAt(0)}
                          </div>
                          <div>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{staffMember.name}</span>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Joined: {staffMember.joining_date}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 8px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {staffMember.designation}
                      </td>

                      <td style={{ padding: '14px 8px', color: 'var(--text-muted)' }}>
                        {staffMember.phone || 'N/A'}
                      </td>

                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)' }}>
                        {formatCurrency(payroll.baseSalary)}
                      </td>

                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--rose)' }}>
                        -{formatCurrency(payroll.totalAdvancesThisMonth)}
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>({payroll.advancesList.length})</span>
                      </td>

                      <td style={{ padding: '14px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: 15 }}>
                        {formatCurrency(payroll.netPayableSalary)}
                      </td>

                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <button
                            onClick={() => setSelectedStaffForDetails(staffMember)}
                            style={{
                              backgroundColor: 'var(--cyan-light)',
                              color: 'var(--cyan)',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 11.5,
                              fontWeight: 800,
                              cursor: 'pointer',
                            }}
                          >
                            Ledger
                          </button>

                          <button
                            onClick={() => handleOpenEditStaff(staffMember)}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                            title="Edit Staff Info"
                          >
                            <Edit2 size={15} />
                          </button>

                          <button
                            onClick={() => setDeleteTarget({
                              type: 'staff',
                              id: staffMember.id,
                              name: staffMember.name,
                            })}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                            title="Delete Staff"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAIL MODAL: PARTNER WITHDRAWAL LEDGER */}
      {selectedOwnerForDetails && (() => {
        const owner = (data.owners || []).find(o => o.id === selectedOwnerForDetails.id) || selectedOwnerForDetails;
        const ownerStats = calculateOwnerLifetimeDrawings(owner.id, data);

        return (
          <DesktopModal
            visible={!!selectedOwnerForDetails}
            onClose={() => setSelectedOwnerForDetails(null)}
            title={`${owner.name} — Full Drawing Ledger`}
            subtitle={`${owner.role} • Personal pocket money withdrawals audit`}
            maxWidth="640px"
          >
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: owner.color || 'var(--purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: '#FFF',
                    fontSize: 18,
                  }}>
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>{owner.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{owner.role} • {owner.phone}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setDrawingOwnerId(owner.id);
                    setDrawingModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: 'var(--purple)', padding: '8px 14px', fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>+ Record Pocket Money</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>This Month Drawings</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--purple)', marginTop: 2 }}>
                    {formatCurrency(ownerStats.monthlyDrawings)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>All-Time Lifetime Total</div>
                  <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--primary)', marginTop: 2 }}>
                    {formatCurrency(ownerStats.totalDrawings)}
                  </div>
                </div>
              </div>
            </div>

            {ownerStats.history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 13 }}>
                No drawings recorded for {owner.name} yet.
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '8px 14px', border: '1px solid #E2E8F0', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 4px' }}>Date</th>
                      <th style={{ padding: '8px 4px' }}>Purpose / Note</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ownerStats.history.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 4px', color: 'var(--text-secondary)' }}>{item.date}</td>
                        <td style={{ padding: '10px 4px', fontWeight: 700, color: 'var(--text-main)' }}>{item.purpose}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 900, color: 'var(--purple)', fontSize: 14 }}>
                          {formatCurrency(item.amount)}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'drawing',
                              id: item.id,
                              name: `${owner.name} - ${item.purpose}`,
                              amount: formatCurrency(item.amount),
                              date: item.date,
                            })}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DesktopModal>
        );
      })()}

      {/* DETAIL MODAL: STAFF ADVANCES LEDGER */}
      {selectedStaffForDetails && (() => {
        const staffMember = (data.staff || []).find(s => s.id === selectedStaffForDetails.id) || selectedStaffForDetails;
        const currentMonth = selectedDate.slice(0, 7);
        const payroll = calculateStaffMonthlyStatus(staffMember, data, currentMonth);

        return (
          <DesktopModal
            visible={!!selectedStaffForDetails}
            onClose={() => setSelectedStaffForDetails(null)}
            title={`${staffMember.name} — Advance Ledger`}
            subtitle={`${staffMember.designation} • Monthly payroll calculations`}
            maxWidth="640px"
          >
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 16,
              marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: 'var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    color: '#FFF',
                    fontSize: 18,
                  }}>
                    {staffMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)' }}>{staffMember.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{staffMember.designation} • {staffMember.phone}</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setAdvanceStaffId(staffMember.id);
                    setAdvanceModalOpen(true);
                  }}
                  className="btn-primary"
                  style={{ backgroundColor: 'var(--cyan)', padding: '8px 14px', fontSize: 12 }}
                >
                  <Plus size={14} />
                  <span>+ Give Cash Advance</span>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Base Salary</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>{formatCurrency(payroll.baseSalary)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Advances Deducted</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--rose)', marginTop: 2 }}>-{formatCurrency(payroll.totalAdvancesThisMonth)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Net Due Salary</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--primary)', marginTop: 2 }}>{formatCurrency(payroll.netPayableSalary)}</div>
                </div>
              </div>
            </div>

            {payroll.advancesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, backgroundColor: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 13 }}>
                No advances recorded this month for {staffMember.name}.
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 12, padding: '8px 14px', border: '1px solid #E2E8F0', maxHeight: 360, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 12.5 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase' }}>
                      <th style={{ padding: '8px 4px' }}>Date</th>
                      <th style={{ padding: '8px 4px' }}>Reason / Note</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Advance Amount</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payroll.advancesList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: '10px 4px', color: 'var(--text-secondary)' }}>{item.date}</td>
                        <td style={{ padding: '10px 4px', fontWeight: 700, color: 'var(--text-main)' }}>{item.note}</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 900, color: 'var(--rose)', fontSize: 14 }}>
                          -{formatCurrency(item.amount)}
                        </td>
                        <td style={{ padding: '10px 4px', textAlign: 'right' }}>
                          <button
                            onClick={() => setDeleteTarget({
                              type: 'advance',
                              id: item.id,
                              name: `${staffMember.name} - ${item.note}`,
                              amount: formatCurrency(item.amount),
                              date: item.date,
                            })}
                            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DesktopModal>
        );
      })()}

      {/* MODAL: ADD / EDIT PARTNER */}
      <DesktopModal
        visible={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        title={editingOwnerId ? "Edit Managing Partner" : "Register New Family Partner"}
        subtitle="Configure partner identity, role and dashboard color"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Partner Full Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Partner Full Name"
            value={ownerFormName}
            onChange={(e) => setOwnerFormName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Designation / Role
          </label>
          <input
            className="input-field"
            placeholder="e.g. Managing Partner / Operations Director"
            value={ownerFormRole}
            onChange={(e) => setOwnerFormRole(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            className="input-field"
            placeholder="e.g. +880 1XXXXXXXXX"
            value={ownerFormPhone}
            onChange={(e) => setOwnerFormPhone(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Avatar Theme Color
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {['#059669', '#4F46E5', '#D97706', '#9333EA', '#E11D48', '#0891B2'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setOwnerFormColor(c)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: c,
                  border: ownerFormColor === c ? '3px solid #0F172A' : 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveOwner}
          className="btn-primary"
          style={{ width: '100%', padding: '12px' }}
        >
          {editingOwnerId ? "Update Partner Info" : "Create Partner Profile"}
        </button>
      </DesktopModal>

      {/* MODAL: ADD / EDIT STAFF */}
      <DesktopModal
        visible={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title={editingStaffId ? "Edit Staff Information" : "Register New Employee"}
        subtitle="Manage employee profile, monthly base salary and designation"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Employee Full Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Employee Name"
            value={staffFormName}
            onChange={(e) => setStaffFormName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Designation / Role
          </label>
          <input
            className="input-field"
            placeholder="e.g. Head Chef / Senior Waiter / Cashier"
            value={staffFormRole}
            onChange={(e) => setStaffFormRole(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Fixed Monthly Salary (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter salary amount"
            value={staffFormSalary}
            onChange={(e) => setStaffFormSalary(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Mobile Phone Number
          </label>
          <input
            className="input-field"
            placeholder="e.g. 01XXXXXXXXX"
            value={staffFormPhone}
            onChange={(e) => setStaffFormPhone(e.target.value)}
          />
        </div>

        <button
          onClick={handleSaveStaff}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--cyan)' }}
        >
          {editingStaffId ? "Update Employee Profile" : "Register Employee"}
        </button>
      </DesktopModal>

      {/* MODAL: RECORD OWNER POCKET MONEY */}
      <DesktopModal
        visible={drawingModalOpen}
        onClose={() => setDrawingModalOpen(false)}
        title="Record Partner Pocket Money"
        subtitle="Cash withdrawn from drawer for personal use"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Partner
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(data.owners || []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDrawingOwnerId(o.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: drawingOwnerId === o.id ? 800 : 600,
                  backgroundColor: drawingOwnerId === o.id ? 'var(--purple-light)' : '#F1F5F9',
                  color: drawingOwnerId === o.id ? 'var(--purple)' : 'var(--text-secondary)',
                  border: `1.5px solid ${drawingOwnerId === o.id ? 'var(--purple)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Withdrawal Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 2000"
            value={drawingAmount}
            onChange={(e) => setDrawingAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Purpose / Note
          </label>
          <input
            className="input-field"
            placeholder="e.g. Personal Pocket Money, Grocery"
            value={drawingPurpose}
            onChange={(e) => setDrawingPurpose(e.target.value)}
          />
        </div>

        <button
          onClick={handleSaveDrawing}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--purple)', color: '#FFF' }}
        >
          Save Pocket Money Entry
        </button>
      </DesktopModal>

      {/* MODAL: RECORD STAFF ADVANCE */}
      <DesktopModal
        visible={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title="Record Staff Cash Advance"
        subtitle="Petty cash given to staff, auto-deducted from monthly salary"
      >
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Staff Member
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {(data.staff || []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAdvanceStaffId(s.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: advanceStaffId === s.id ? 800 : 600,
                  backgroundColor: advanceStaffId === s.id ? 'var(--cyan-light)' : '#F1F5F9',
                  color: advanceStaffId === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: `1.5px solid ${advanceStaffId === s.id ? 'var(--cyan)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Advance Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 1000"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Note / Reason
          </label>
          <input
            className="input-field"
            placeholder="e.g. Snack advance / Emergency medical"
            value={advanceNote}
            onChange={(e) => setAdvanceNote(e.target.value)}
          />
        </div>

        <button
          onClick={handleSaveAdvance}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', backgroundColor: 'var(--cyan)', color: '#FFF' }}
        >
          Save Staff Advance
        </button>
      </DesktopModal>
    </div>
  );
};
