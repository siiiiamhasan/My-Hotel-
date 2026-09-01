import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loadStoredData, saveStoredData, resetToCleanData, importDataFromJSON } from '../utils/storage';
import { 
  getGoogleConfig, 
  saveGoogleConfig, 
  getStoredTokens, 
  clearStoredTokens, 
  getValidAccessToken, 
  startGoogleSignIn
} from '../utils/googleDrive';
import { getSyncEngine, SYNC_STATUS } from '../sync';
import { INITIAL_DATA } from '../utils/initialData';

const AppDataContext = createContext();

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

export const AppDataProvider = ({ children }) => {
  const [data, setData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SYNC_STATUS.IDLE);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // 'day' | 'week' | 'month' | 'year' | 'all'

  const isElectron = typeof window !== 'undefined' && !!window.api;
  const syncing = syncStatus === 'syncing' || syncStatus === SYNC_STATUS.SYNCING;

  // Web/Mobile fallback SyncEngine
  const syncEngineRef = useRef(null);
  if (!syncEngineRef.current && !isElectron) {
    syncEngineRef.current = getSyncEngine(({ status, lastSyncedAt: syncedTime }) => {
      setSyncStatus(status);
      if (syncedTime) setLastSyncedAt(syncedTime);
    });
  }

  // Startup data initialization and IPC event listeners
  useEffect(() => {
    let unlistenStatus = null;
    let unlistenData = null;

    const init = async () => {
      if (isElectron) {
        try {
          const res = await window.api.loadState();
          if (res?.data) {
            setData(res.data);
          } else {
            setData(INITIAL_DATA);
          }

          if (res?.syncStatus) setSyncStatus(res.syncStatus);
          if (res?.lastSyncedAt) setLastSyncedAt(res.lastSyncedAt);

          if (res?.isCloudConnected && res?.userEmail) {
            setData((prev) => ({
              ...prev,
              restaurant_info: {
                ...(prev.restaurant_info || {}),
                google_drive_connected: true,
                google_account_email: res.userEmail,
              }
            }));
          }
        } catch (err) {
          console.warn('Failed to load state from Electron IPC:', err);
          setData(INITIAL_DATA);
        }

        // Listen for background sync status and remote data updates from Electron main process
        if (window.api?.onSyncStatusChange) {
          unlistenStatus = window.api.onSyncStatusChange(({ status, lastSyncedAt: syncTime }) => {
            setSyncStatus(status);
            if (syncTime) setLastSyncedAt(syncTime);
          });
        }

        if (window.api?.onDataUpdated) {
          unlistenData = window.api.onDataUpdated((remoteData) => {
            if (remoteData) {
              setData(remoteData);
            }
          });
        }
      } else {
        // Fallback for Web browser & Mobile Capacitor
        const stored = await loadStoredData();
        const currentData = stored || INITIAL_DATA;
        setData(currentData);

        if (syncEngineRef.current) {
          try {
            const driveResult = await syncEngineRef.current.pullInitial(currentData);
            if (driveResult?.success && driveResult?.data) {
              setData(driveResult.data);
              await saveStoredData(driveResult.data);
            }
          } catch (e) {
            console.warn('Web fallback startup pull skipped:', e);
          }
        }
      }

      setLoading(false);
    };

    init();

    return () => {
      if (unlistenStatus) unlistenStatus();
      if (unlistenData) unlistenData();
    };
  }, [isElectron]);

  const createBlankDayRecord = (date, records = []) => {
    let defaultFloat = 0;
    if (records.length > 0) {
      const sorted = [...records].sort((a, b) => (a.date < b.date ? -1 : 1));
      const prevRecord = sorted.filter((r) => r.date < date).pop();
      if (prevRecord?.night_closing?.next_day_opening_float !== undefined) {
        defaultFloat = Number(prevRecord.night_closing.next_day_opening_float || 0);
      }
    }

    return {
      id: `rec_${date}`,
      date: date,
      opening_float: defaultFloat,
      morning_market: [],
      sales: { cash_sales: 0, digital_sales: 0, total_sales: 0 },
      owner_drawings: [],
      staff_advances: [],
      wastage_demurrage: [],
      night_closing: null,
    };
  };

  /**
   * Universal State Updater
   * 1. Updates React state immediately with fresh updatedAt timestamp
   * 2. Saves to local offline cache immediately
   * 3. Schedules debounced background push to Google Drive (1500ms)
   */
  const updateDataState = (updater) => {
    setData((prev) => {
      let nextData = typeof updater === 'function' ? updater(prev) : updater;
      
      nextData = {
        ...nextData,
        updatedAt: new Date().toISOString(),
      };

      if (isElectron) {
        window.api.saveState(nextData);
      } else {
        Promise.resolve().then(() => saveStoredData(nextData));
        if (syncEngineRef.current) {
          syncEngineRef.current.schedulePush(nextData);
        }
      }

      return nextData;
    });
  };

  const getDayRecord = (date = selectedDate) => {
    const records = data?.daily_records || [];
    const found = records.find((r) => r.date === date);
    if (found) return found;
    return createBlankDayRecord(date, records);
  };

  const goToPreviousDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    const str = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    setSelectedDate(str);
  };

  const goToNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    const str = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    setSelectedDate(str);
  };

  const goToToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // --- ACTIONS: MORNING MARKET ---
  const addMorningMarketItem = (date, item) => {
    updateDataState((prev) => {
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const newItem = {
        id: `mm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        item_name: item.item_name,
        category: item.category || 'GROCERY',
        amount: Number(item.amount || 0),
        paid_from: item.paid_from || 'CASH_DRAWER',
        buyer: item.buyer || prev?.owners?.[0]?.name || 'Owner',
      };

      if (dayIdx >= 0) {
        records[dayIdx] = {
          ...records[dayIdx],
          morning_market: [...(records[dayIdx].morning_market || []), newItem]
        };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          morning_market: [newItem]
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  const updateMorningMarketItem = (date, itemId, updatedItem) => {
    updateDataState((prev) => {
      const records = [...(prev.daily_records || [])];
      const dayIdx = records.findIndex((r) => r.date === date);
      if (dayIdx >= 0) {
        const market = (records[dayIdx].morning_market || []).map((i) =>
          i.id === itemId ? { ...i, ...updatedItem, amount: Number(updatedItem.amount || i.amount) } : i
        );
        records[dayIdx] = { ...records[dayIdx], morning_market: market };
      }
      return { ...prev, daily_records: records };
    });
  };

  const deleteMorningMarketItem = (date, itemId) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.morning_market && rec.morning_market.some((i) => i.id === itemId)) {
          return {
            ...rec,
            morning_market: rec.morning_market.filter((i) => i.id !== itemId),
          };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  // --- ACTIONS: SALES ---
  const updateDailySales = (date, cash, digital) => {
    updateDataState((prev) => {
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const cashNum = Number(cash || 0);
      const digNum = Number(digital || 0);
      const salesObj = {
        cash_sales: cashNum,
        digital_sales: digNum,
        total_sales: cashNum + digNum,
      };

      if (dayIdx >= 0) {
        records[dayIdx] = { ...records[dayIdx], sales: salesObj };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          sales: salesObj
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  // --- ACTIONS: OWNER DRAWINGS ---
  const addOwnerDrawing = (date, ownerId, amount, purpose) => {
    updateDataState((prev) => {
      const owner = (prev.owners || []).find((o) => o.id === ownerId);
      const ownerName = owner ? owner.name : 'Partner';
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const newDrawing = {
        id: `od_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        owner_id: ownerId,
        owner_name: ownerName,
        amount: Number(amount || 0),
        purpose: purpose || 'Personal Pocket Money',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (dayIdx >= 0) {
        records[dayIdx] = {
          ...records[dayIdx],
          owner_drawings: [...(records[dayIdx].owner_drawings || []), newDrawing]
        };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          owner_drawings: [newDrawing]
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  const deleteOwnerDrawing = (date, drawingId) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.owner_drawings && rec.owner_drawings.some((d) => d.id === drawingId)) {
          return {
            ...rec,
            owner_drawings: rec.owner_drawings.filter((d) => d.id !== drawingId),
          };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  // Partner Management CRUD
  const addOwner = (ownerObj) => {
    updateDataState((prev) => {
      const newOwner = {
        id: `owner_${Date.now()}`,
        name: ownerObj.name || 'New Partner',
        role: ownerObj.role || 'Managing Partner',
        phone: ownerObj.phone || '',
        color: ownerObj.color || '#111827',
      };
      return {
        ...prev,
        owners: [...(prev.owners || []), newOwner],
      };
    });
  };

  const updateOwner = (ownerId, updatedFields) => {
    updateDataState((prev) => {
      const updatedOwners = (prev.owners || []).map((o) =>
        o.id === ownerId ? { ...o, ...updatedFields } : o
      );
      const updatedRecords = (prev.daily_records || []).map((rec) => {
        if (!rec.owner_drawings) return rec;
        return {
          ...rec,
          owner_drawings: rec.owner_drawings.map((d) =>
            d.owner_id === ownerId && updatedFields.name
              ? { ...d, owner_name: updatedFields.name }
              : d
          )
        };
      });
      return {
        ...prev,
        owners: updatedOwners,
        daily_records: updatedRecords,
      };
    });
  };

  const deleteOwner = (ownerId) => {
    updateDataState((prev) => ({
      ...prev,
      owners: (prev.owners || []).filter((o) => o.id !== ownerId),
    }));
  };

  // --- ACTIONS: STAFF & ADVANCES ---
  const addStaffAdvance = (date, staffId, amount, note) => {
    updateDataState((prev) => {
      const staffMember = (prev.staff || []).find((s) => s.id === staffId);
      const staffName = staffMember ? staffMember.name : 'Staff';
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const newAdvance = {
        id: `sa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        staff_id: staffId,
        staff_name: staffName,
        amount: Number(amount || 0),
        note: note || 'Daily Advance',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      if (dayIdx >= 0) {
        records[dayIdx] = {
          ...records[dayIdx],
          staff_advances: [...(records[dayIdx].staff_advances || []), newAdvance]
        };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          staff_advances: [newAdvance]
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  const deleteStaffAdvance = (date, advanceId) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.staff_advances && rec.staff_advances.some((s) => s.id === advanceId)) {
          return {
            ...rec,
            staff_advances: rec.staff_advances.filter((s) => s.id !== advanceId),
          };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  // Staff Management CRUD
  const addStaffMember = (staffObj) => {
    updateDataState((prev) => {
      const newStaff = {
        id: `staff_${Date.now()}`,
        name: staffObj.name,
        designation: staffObj.designation || 'Staff',
        monthly_salary: Number(staffObj.monthly_salary || 0),
        phone: staffObj.phone || '',
        joining_date: staffObj.joining_date || new Date().toISOString().split('T')[0],
        status: 'ACTIVE'
      };
      return {
        ...prev,
        staff: [...(prev.staff || []), newStaff]
      };
    });
  };

  const updateStaffMember = (staffId, updatedFields) => {
    updateDataState((prev) => {
      const updatedStaff = (prev.staff || []).map((s) =>
        s.id === staffId ? { ...s, ...updatedFields } : s
      );
      return {
        ...prev,
        staff: updatedStaff,
      };
    });
  };

  const deleteStaffMember = (staffId) => {
    updateDataState((prev) => ({
      ...prev,
      staff: (prev.staff || []).filter((s) => s.id !== staffId),
    }));
  };

  // --- ACTIONS: WASTAGE ---
  const addWastageItem = (date, description, amount, reason) => {
    updateDataState((prev) => {
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const newWastage = {
        id: `wd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        item_description: description,
        amount: Number(amount || 0),
        reason: reason || 'Accidental breakage / Spoilage',
      };

      if (dayIdx >= 0) {
        records[dayIdx] = {
          ...records[dayIdx],
          wastage_demurrage: [...(records[dayIdx].wastage_demurrage || []), newWastage]
        };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          wastage_demurrage: [newWastage]
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  const deleteWastageItem = (date, wastageId) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.wastage_demurrage && rec.wastage_demurrage.some((w) => w.id === wastageId)) {
          return {
            ...rec,
            wastage_demurrage: rec.wastage_demurrage.filter((w) => w.id !== wastageId),
          };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  const updateWastageItem = (date, wastageId, updatedFields) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.wastage_demurrage && rec.wastage_demurrage.some((w) => w.id === wastageId)) {
          return {
            ...rec,
            wastage_demurrage: rec.wastage_demurrage.map((w) =>
              w.id === wastageId
                ? {
                    ...w,
                    ...updatedFields,
                    amount: updatedFields.amount !== undefined ? Number(updatedFields.amount || 0) : w.amount,
                  }
                : w
            ),
          };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  // --- ACTIONS: NIGHT CLOSING ---
  const submitNightClosing = (date, closingDetails) => {
    updateDataState((prev) => {
      const records = [...(prev.daily_records || [])];
      let dayIdx = records.findIndex((r) => r.date === date);

      const closingObj = {
        completed: true,
        closed_by: closingDetails.closed_by || prev?.owners?.[0]?.name || 'Manager',
        timestamp: new Date().toISOString(),
        actual_drawer_cash: Number(closingDetails.actual_drawer_cash || 0),
        expected_cash: Number(closingDetails.expected_cash || 0),
        variance: Number(closingDetails.variance || 0),
        next_day_opening_float: Number(closingDetails.next_day_opening_float || 0),
        bank_deposit: Number(closingDetails.bank_deposit || 0),
        bank_note: closingDetails.bank_note || '',
        retained_vault_reserve: Number(closingDetails.retained_vault_reserve || 0),
        notes: closingDetails.notes || '',
      };

      if (dayIdx >= 0) {
        records[dayIdx] = { ...records[dayIdx], night_closing: closingObj };
      } else {
        const newRecord = {
          ...createBlankDayRecord(date, records),
          night_closing: closingObj
        };
        records.unshift(newRecord);
      }

      return { ...prev, daily_records: records };
    });
  };

  const resetNightClosing = (date) => {
    updateDataState((prev) => {
      const records = (prev.daily_records || []).map((rec) => {
        if (rec.date === date) {
          return { ...rec, night_closing: null };
        }
        return rec;
      });
      return { ...prev, daily_records: records };
    });
  };

  // --- ACTIONS: FIXED ASSETS & BILLS ---
  const addFixedAsset = (assetObj) => {
    updateDataState((prev) => {
      const newAsset = {
        id: `fa_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        item_name: assetObj.item_name,
        amount: Number(assetObj.amount || 0),
        date: assetObj.date || new Date().toISOString().split('T')[0],
        category: assetObj.category || 'EQUIPMENT'
      };
      return {
        ...prev,
        fixed_assets: [...(prev.fixed_assets || []), newAsset]
      };
    });
  };

  const updateFixedAsset = (assetId, updatedFields) => {
    updateDataState((prev) => {
      const updated = (prev.fixed_assets || []).map((a) =>
        a.id === assetId
          ? {
              ...a,
              ...updatedFields,
              amount: updatedFields.amount !== undefined ? Number(updatedFields.amount || 0) : a.amount,
            }
          : a
      );
      return { ...prev, fixed_assets: updated };
    });
  };

  const deleteFixedAsset = (assetId) => {
    updateDataState((prev) => ({
      ...prev,
      fixed_assets: (prev.fixed_assets || []).filter(a => a.id !== assetId)
    }));
  };

  const addMonthlyBill = (billObj) => {
    updateDataState((prev) => {
      const newBill = {
        id: `mb_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        month_year: billObj.month_year || new Date().toISOString().slice(0, 7),
        bill_type: billObj.bill_type,
        amount: Number(billObj.amount || 0),
        payment_date: billObj.payment_date || new Date().toISOString().split('T')[0],
        status: billObj.status || 'PAID'
      };
      return {
        ...prev,
        monthly_bills: [...(prev.monthly_bills || []), newBill]
      };
    });
  };

  const updateMonthlyBill = (billId, updatedFields) => {
    updateDataState((prev) => {
      const updated = (prev.monthly_bills || []).map((b) =>
        b.id === billId
          ? {
              ...b,
              ...updatedFields,
              amount: updatedFields.amount !== undefined ? Number(updatedFields.amount || 0) : b.amount,
            }
          : b
      );
      return { ...prev, monthly_bills: updated };
    });
  };

  const deleteMonthlyBill = (billId) => {
    updateDataState((prev) => ({
      ...prev,
      monthly_bills: (prev.monthly_bills || []).filter(b => b.id !== billId)
    }));
  };

  const toggleMonthlyBillPaid = (billId) => {
    updateDataState((prev) => {
      const bills = (prev.monthly_bills || []).map((b) => {
        if (b.id === billId) {
          return { ...b, status: b.status === 'PAID' ? 'PENDING' : 'PAID' };
        }
        return b;
      });
      return { ...prev, monthly_bills: bills };
    });
  };

  const updateInitialCapital = (amount) => {
    updateDataState((prev) => ({
      ...prev,
      restaurant_info: {
        ...(prev.restaurant_info || {}),
        initial_capital_investment: Number(amount || 0),
      },
    }));
  };

  // --- ACTIONS: RESTAURANT SETTINGS & GOOGLE CLOUD SYNC ---
  const updateRestaurantInfo = (fields) => {
    updateDataState((prev) => ({
      ...prev,
      restaurant_info: {
        ...(prev.restaurant_info || {}),
        ...fields,
      },
    }));
  };

  /**
   * Universal Sign-In with Google Drive OAuth:
   * Immediately searches Drive for hotel-management-data.json, attaches to it, and pulls cloud database.
   */
  const signInWithGoogle = async () => {
    if (isElectron && window.api?.signIn) {
      setSyncStatus('syncing');
      const res = await window.api.signIn();
      if (res?.success) {
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toISOString());
        if (res.data) {
          setData(res.data);
        } else {
          updateRestaurantInfo({
            google_drive_connected: true,
            google_account_email: res.userEmail || 'Connected',
            last_synced_at: new Date().toISOString(),
          });
        }
      }
      return res;
    } else {
      // Mobile / Web flow
      return new Promise((resolve) => {
        const config = getGoogleConfig();
        startGoogleSignIn(
          config.clientId,
          async (token, profile) => {
            setSyncStatus('syncing');
            let finalData = data;
            
            // 1. Immediately search Google Drive, find master JSON file, attach and pull
            if (syncEngineRef.current) {
              try {
                const pullResult = await syncEngineRef.current.pullInitial(data);
                if (pullResult?.success && pullResult?.data) {
                  finalData = pullResult.data;
                }
              } catch (e) {
                console.warn('Initial drive pull on signin failed:', e);
              }
            }

            finalData = {
              ...finalData,
              restaurant_info: {
                ...(finalData.restaurant_info || {}),
                google_drive_connected: true,
                google_account_email: profile?.email || 'Connected',
                last_synced_at: new Date().toISOString(),
              },
            };

            setData(finalData);
            await saveStoredData(finalData);
            setSyncStatus('synced');
            setLastSyncedAt(new Date().toISOString());

            resolve({ success: true, userEmail: profile?.email, data: finalData });
          },
          (err) => {
            setSyncStatus('error');
            resolve({ success: false, error: err?.message || err });
          }
        );
      });
    }
  };

  /**
   * Manual Google Drive Sync (Pull & Push)
   */
  const triggerGoogleDriveSync = async () => {
    if (isElectron && window.api?.syncNow) {
      setSyncStatus('syncing');
      try {
        const res = await window.api.syncNow();
        if (res?.data) {
          setData(res.data);
        }
        if (res?.status) setSyncStatus(res.status);
        if (res?.lastSyncedAt) setLastSyncedAt(res.lastSyncedAt);
        return res;
      } catch (err) {
        setSyncStatus('error');
        return { success: false, error: err.message };
      }
    } else if (syncEngineRef.current) {
      // Fallback for Web / Mobile
      try {
        const pullResult = await syncEngineRef.current.pullInitial(data);
        if (pullResult?.success && pullResult?.data) {
          setData(pullResult.data);
          await saveStoredData(pullResult.data);
          return pullResult;
        }
        const pushResult = await syncEngineRef.current.pushNow(data);
        if (pushResult?.success && pushResult?.data) {
          setData(pushResult.data);
          await saveStoredData(pushResult.data);
        }
        return pushResult;
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
    return { success: true };
  };

  const disconnectGoogleDrive = async () => {
    if (isElectron && window.api?.signOut) {
      await window.api.signOut();
    } else {
      await clearStoredTokens();
      if (syncEngineRef.current) {
        syncEngineRef.current.setStatus(SYNC_STATUS.UNAUTHENTICATED);
      }
    }
    setSyncStatus('unauthenticated');
    updateRestaurantInfo({
      google_drive_connected: false,
    });
  };

  const resetData = async () => {
    setLoading(true);
    const reset = await resetToCleanData();
    updateDataState(reset);
    setLoading(false);
  };

  const importData = async (jsonString) => {
    setLoading(true);
    const result = await importDataFromJSON(jsonString);
    if (result.success) {
      updateDataState(result.data);
    }
    setLoading(false);
    return result;
  };

  return (
    <AppDataContext.Provider
      value={{
        data,
        loading,
        syncing,
        syncStatus,
        lastSyncedAt,
        selectedDate,
        setSelectedDate,
        selectedPeriod,
        setSelectedPeriod,
        getDayRecord,
        goToPreviousDay,
        goToNextDay,
        goToToday,
        addMorningMarketItem,
        updateMorningMarketItem,
        deleteMorningMarketItem,
        updateDailySales,
        addOwnerDrawing,
        deleteOwnerDrawing,
        addOwner,
        updateOwner,
        deleteOwner,
        addStaffAdvance,
        deleteStaffAdvance,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        addWastageItem,
        updateWastageItem,
        deleteWastageItem,
        submitNightClosing,
        resetNightClosing,
        addFixedAsset,
        updateFixedAsset,
        deleteFixedAsset,
        addMonthlyBill,
        updateMonthlyBill,
        deleteMonthlyBill,
        toggleMonthlyBillPaid,
        updateInitialCapital,
        updateRestaurantInfo,
        signInWithGoogle,
        triggerGoogleDriveSync,
        disconnectGoogleDrive,
        resetData,
        importData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};
