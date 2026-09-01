import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Plus, 
  ChevronRight,
  Edit2,
  Trash2,
  UserPlus
} from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { 
  formatCurrency, 
  calculateStaffMonthlyStatus, 
  calculateOwnerLifetimeDrawings 
} from '../../utils/accounting';
import { CustomModal } from '../components/Modal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const FamilyStaffScreen = () => {
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
  const [staffFormRole, setStaffFormRole] = useState('Senior Waiter');
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
      setOwnerFormName(''); // force re-focus by clearing
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

  // Delete Action Dispatcher
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
    <div style={{ padding: '14px', paddingBottom: '24px' }}>
      {/* Universal Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExecuteDelete}
        title={`Delete ${deleteTarget?.type === 'owner' ? 'Family Partner' : deleteTarget?.type === 'staff' ? 'Staff Member' : 'Transaction'}?`}
        itemName={deleteTarget?.name}
        itemAmount={deleteTarget?.amount}
        description="This entry will be permanently removed from your hotel records."
      />

      {/* Segment Switcher */}
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
          onClick={() => setActiveSegment('OWNERS')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: activeSegment === 'OWNERS' ? 'var(--purple-light)' : 'transparent',
            color: activeSegment === 'OWNERS' ? 'var(--purple)' : 'var(--text-secondary)',
            fontWeight: activeSegment === 'OWNERS' ? 800 : 600,
            fontSize: 11.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <Users size={15} color={activeSegment === 'OWNERS' ? 'var(--purple)' : 'var(--text-muted)'} />
          <span>Family Partners ({data.owners?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSegment('STAFF')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '9px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: activeSegment === 'STAFF' ? 'var(--cyan-light)' : 'transparent',
            color: activeSegment === 'STAFF' ? 'var(--cyan)' : 'var(--text-secondary)',
            fontWeight: activeSegment === 'STAFF' ? 800 : 600,
            fontSize: 11.5,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <UserCheck size={15} color={activeSegment === 'STAFF' ? 'var(--cyan)' : 'var(--text-muted)'} />
          <span>Staff & Payroll ({data.staff?.length || 0})</span>
        </button>
      </div>

      {/* SEGMENT 1: FAMILY PARTNERS */}
      {activeSegment === 'OWNERS' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Family Partners & Drawings</h2>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>Click partner profile for full history</p>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={handleOpenAddOwner}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '5px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={12} color="var(--primary)" />
                <span>+ Partner</span>
              </button>

              <button
                onClick={() => setDrawingModalOpen(true)}
                style={{
                  backgroundColor: 'var(--purple)',
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
                  boxShadow: '0 2px 6px rgba(147, 51, 234, 0.3)',
                }}
              >
                <Plus size={12} />
                <span>+ Pocket Money</span>
              </button>
            </div>
          </div>

          {(data.owners || []).map((owner) => {
            const stats = calculateOwnerLifetimeDrawings(owner.id, data);
            return (
              <div
                key={owner.id}
                onClick={() => setSelectedOwnerForDetails(owner)}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: owner.color || 'var(--purple)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: '#FFF',
                      fontSize: 15,
                    }}>
                      {owner.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>{owner.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditOwner(owner);
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                          title="Rename / Edit"
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {owner.role} • {owner.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Withdrawn</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--purple)' }}>{formatCurrency(stats.totalDrawings)}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: '1px solid #E2E8F0',
                  fontSize: 10.5,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{stats.history.length} withdrawals</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--purple)', fontWeight: 800 }}>
                    <span>Open History</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SEGMENT 2: STAFF & PAYROLL */}
      {activeSegment === 'STAFF' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div>
              <h2 style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>Staff Salary & Advances</h2>
              <p style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 2 }}>
                Month: <strong>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</strong> • Tap to view ledger
              </p>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <button
                onClick={handleOpenAddStaff}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: 'var(--text-main)',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '5px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <UserPlus size={12} color="var(--primary)" />
                <span>+ Staff</span>
              </button>

              <button
                onClick={() => setAdvanceModalOpen(true)}
                style={{
                  backgroundColor: 'var(--cyan)',
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
                  boxShadow: '0 2px 6px rgba(8, 145, 178, 0.3)',
                }}
              >
                <Plus size={12} />
                <span>+ Advance</span>
              </button>
            </div>
          </div>

          {(data.staff || []).map((staffMember) => {
            const currentMonth = selectedDate.slice(0, 7);
            const payroll = calculateStaffMonthlyStatus(staffMember, data, currentMonth);
            return (
              <div
                key={staffMember.id}
                onClick={() => setSelectedStaffForDetails(staffMember)}
                className="glass-card"
                style={{
                  padding: '12px 14px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38,
                      height: 38,
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-main)' }}>{staffMember.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditStaff(staffMember);
                          }}
                          style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 2 }}
                          title="Edit Staff Info"
                        >
                          <Edit2 size={11} />
                        </button>
                      </div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginTop: 1 }}>
                        {staffMember.designation} • {staffMember.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Due Salary</div>
                    <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--primary)' }}>{formatCurrency(payroll.netPayableSalary)}</div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  backgroundColor: '#F8FAFC',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #E2E8F0',
                  marginTop: 10,
                  justifyContent: 'space-between',
                  fontSize: 10.5,
                }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Base Salary</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', marginTop: 1 }}>{formatCurrency(payroll.baseSalary)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Advances</div>
                    <div style={{ fontWeight: 800, color: 'var(--rose)', marginTop: 1 }}>-{formatCurrency(payroll.totalAdvancesThisMonth)}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)' }}>Status</div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', marginTop: 1 }}>
                      {payroll.isPaidOff ? 'Settled' : 'Pending'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 6,
                  borderTop: '1px solid #E2E8F0',
                  fontSize: 10.5,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{payroll.advancesList.length} advances this month</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: 'var(--cyan)', fontWeight: 800 }}>
                    <span>Open History</span>
                    <ChevronRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: PARTNER PROFILE & HISTORY */}
      {selectedOwnerForDetails && (() => {
        const owner = (data.owners || []).find(o => o.id === selectedOwnerForDetails.id) || selectedOwnerForDetails;
        const ownerStats = calculateOwnerLifetimeDrawings(owner.id, data);

        return (
          <CustomModal
            visible={!!selectedOwnerForDetails}
            onClose={() => setSelectedOwnerForDetails(null)}
            title={`${owner.name} Profile`}
            subtitle={`${owner.role} • Complete Drawing Ledger`}
          >
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: owner.color || 'var(--purple)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#FFF',
                    fontSize: 16,
                  }}>
                    {owner.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-main)' }}>{owner.name}</h3>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{owner.role}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleOpenEditOwner(owner)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-secondary)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget({
                      type: 'owner',
                      id: owner.id,
                      name: owner.name,
                    })}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(225, 29, 72, 0.3)',
                      backgroundColor: 'var(--rose-light)',
                      color: 'var(--rose)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>This Month Pocket Money</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--purple)', marginTop: 2 }}>
                    {formatCurrency(ownerStats.monthlyDrawings)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>All-Time Lifetime Total</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--primary)', marginTop: 2 }}>
                    {formatCurrency(ownerStats.totalDrawings)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setDrawingOwnerId(owner.id);
                setDrawingModalOpen(true);
              }}
              className="btn-primary"
              style={{
                width: '100%',
                marginBottom: 14,
                backgroundColor: 'var(--purple)',
              }}
            >
              <Plus size={13} />
              <span>+ Record Pocket Money for {owner.name}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h4 style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Withdrawal Ledger ({ownerStats.history.length})
              </h4>
            </div>

            {ownerStats.history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5 }}>
                No pocket money withdrawals recorded yet for {owner.name}.
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 8, border: '1px solid #E2E8F0' }}>
                {ownerStats.history.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{item.date} • {item.time || 'Daytime'}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{item.purpose}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--purple)' }}>{formatCurrency(item.amount)}</span>
                      <button
                        onClick={() => setDeleteTarget({
                          type: 'drawing',
                          id: item.id,
                          name: `${owner.name} - ${item.purpose}`,
                          amount: formatCurrency(item.amount),
                          date: item.date,
                        })}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                        title="Delete drawing entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CustomModal>
        );
      })()}

      {/* MODAL: STAFF PROFILE & ADVANCES */}
      {selectedStaffForDetails && (() => {
        const staffMember = (data.staff || []).find(s => s.id === selectedStaffForDetails.id) || selectedStaffForDetails;
        const currentMonth = selectedDate.slice(0, 7);
        const payroll = calculateStaffMonthlyStatus(staffMember, data, currentMonth);

        return (
          <CustomModal
            visible={!!selectedStaffForDetails}
            onClose={() => setSelectedStaffForDetails(null)}
            title={`${staffMember.name} Profile`}
            subtitle={`${staffMember.designation} • Salary & Advance Status`}
          >
            <div style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 14,
              padding: 12,
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'var(--cyan)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    color: '#FFF',
                    fontSize: 16,
                  }}>
                    {staffMember.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 900, color: 'var(--text-main)' }}>{staffMember.name}</h3>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      {staffMember.designation} • {staffMember.phone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleOpenEditStaff(staffMember)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      color: 'var(--text-secondary)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={11} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeleteTarget({
                      type: 'staff',
                      id: staffMember.id,
                      name: staffMember.name,
                    })}
                    style={{
                      padding: '5px 8px',
                      borderRadius: 8,
                      border: '1px solid rgba(225, 29, 72, 0.3)',
                      backgroundColor: 'var(--rose-light)',
                      color: 'var(--rose)',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Base Salary</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--text-main)', marginTop: 2 }}>
                    {formatCurrency(payroll.baseSalary)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Advances</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--rose)', marginTop: 2 }}>
                    -{formatCurrency(payroll.totalAdvancesThisMonth)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Net Due</div>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--primary)', marginTop: 2 }}>
                    {formatCurrency(payroll.netPayableSalary)}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setAdvanceStaffId(staffMember.id);
                setAdvanceModalOpen(true);
              }}
              className="btn-primary"
              style={{
                width: '100%',
                marginBottom: 14,
                backgroundColor: 'var(--cyan)',
                color: '#FFF',
              }}
            >
              <Plus size={13} />
              <span>+ Give Advance to {staffMember.name}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h4 style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Advance Logs ({payroll.advancesList.length})
              </h4>
            </div>

            {payroll.advancesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, backgroundColor: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', color: 'var(--text-muted)', fontSize: 11.5 }}>
                No advance payments recorded this month for {staffMember.name}.
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 8, border: '1px solid #E2E8F0' }}>
                {payroll.advancesList.map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{item.date} • {item.time || 'Daytime'}</div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>{item.note}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 900, color: 'var(--rose)' }}>-{formatCurrency(item.amount)}</span>
                      <button
                        onClick={() => setDeleteTarget({
                          type: 'advance',
                          id: item.id,
                          name: `${staffMember.name} - ${item.note}`,
                          amount: formatCurrency(item.amount),
                          date: item.date,
                        })}
                        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
                        title="Delete advance entry"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CustomModal>
        );
      })()}

      {/* MODAL: ADD / EDIT PARTNER */}
      <CustomModal
        visible={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
        title={editingOwnerId ? "Edit Partner Profile" : "Add New Family Partner"}
        subtitle="Manage partner name and role"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Partner Full Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Partner Full Name"
            value={ownerFormName}
            onChange={(e) => setOwnerFormName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Business Role / Designation
          </label>
          <input
            className="input-field"
            placeholder="e.g. Managing Partner"
            value={ownerFormRole}
            onChange={(e) => setOwnerFormRole(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Phone Number
          </label>
          <input
            className="input-field"
            placeholder="e.g. +880 1XXXXXXXXX"
            value={ownerFormPhone}
            onChange={(e) => setOwnerFormPhone(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Avatar Color
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['#059669', '#4F46E5', '#D97706', '#9333EA', '#E11D48', '#0891B2'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setOwnerFormColor(c)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
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
          style={{ width: '100%' }}
        >
          {editingOwnerId ? "Update Partner Info" : "Create Partner Profile"}
        </button>
      </CustomModal>

      {/* MODAL: ADD / EDIT STAFF */}
      <CustomModal
        visible={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title={editingStaffId ? "Edit Staff Profile" : "Add New Staff Member"}
        subtitle="Manage employee details and fixed salary"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Employee Full Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Employee Name"
            value={staffFormName}
            onChange={(e) => setStaffFormName(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Designation / Role
          </label>
          <input
            className="input-field"
            placeholder="e.g. Head Chef / Waiter / Cashier"
            value={staffFormRole}
            onChange={(e) => setStaffFormRole(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Monthly Fixed Salary (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="Enter salary amount"
            value={staffFormSalary}
            onChange={(e) => setStaffFormSalary(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
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
          style={{ width: '100%', backgroundColor: 'var(--cyan)' }}
        >
          {editingStaffId ? "Update Staff Profile" : "Register New Employee"}
        </button>
      </CustomModal>

      {/* MODAL: RECORD OWNER POCKET MONEY */}
      <CustomModal
        visible={drawingModalOpen}
        onClose={() => setDrawingModalOpen(false)}
        title="Record Partner Pocket Money"
        subtitle="Cash withdrawn from drawer for personal use"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Partner
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.owners || []).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDrawingOwnerId(o.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: drawingOwnerId === o.id ? 800 : 600,
                  backgroundColor: drawingOwnerId === o.id ? 'var(--purple-light)' : '#F1F5F9',
                  color: drawingOwnerId === o.id ? 'var(--purple)' : 'var(--text-secondary)',
                  border: `1px solid ${drawingOwnerId === o.id ? 'var(--purple)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Withdrawal Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 1000"
            value={drawingAmount}
            onChange={(e) => setDrawingAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Purpose / Note
          </label>
          <input
            className="input-field"
            placeholder="e.g. Personal Pocket Money, Family Grocery"
            value={drawingPurpose}
            onChange={(e) => setDrawingPurpose(e.target.value)}
          />
        </div>

        <button
          onClick={handleSaveDrawing}
          className="btn-primary"
          style={{ width: '100%', backgroundColor: 'var(--purple)', color: '#FFF' }}
        >
          Save Pocket Money Entry
        </button>
      </CustomModal>

      {/* MODAL: RECORD STAFF ADVANCE */}
      <CustomModal
        visible={advanceModalOpen}
        onClose={() => setAdvanceModalOpen(false)}
        title="Record Staff Cash Advance"
        subtitle="Petty cash given to staff, auto-deducted from salary"
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Select Staff Member
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(data.staff || []).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setAdvanceStaffId(s.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 18,
                  fontSize: 10.5,
                  fontWeight: advanceStaffId === s.id ? 800 : 600,
                  backgroundColor: advanceStaffId === s.id ? 'var(--cyan-light)' : '#F1F5F9',
                  color: advanceStaffId === s.id ? 'var(--cyan)' : 'var(--text-secondary)',
                  border: `1px solid ${advanceStaffId === s.id ? 'var(--cyan)' : '#E2E8F0'}`,
                  cursor: 'pointer',
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Advance Amount (৳)
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="e.g. 500"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
            Note / Reason
          </label>
          <input
            className="input-field"
            placeholder="e.g. Daily snack advance / Emergency"
            value={advanceNote}
            onChange={(e) => setAdvanceNote(e.target.value)}
          />
        </div>

        <button
          onClick={handleSaveAdvance}
          className="btn-primary"
          style={{ width: '100%', backgroundColor: 'var(--cyan)', color: '#FFF' }}
        >
          Save Staff Advance
        </button>
      </CustomModal>
    </div>
  );
};
