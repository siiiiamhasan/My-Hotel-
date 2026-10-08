import { Preferences } from '@capacitor/preferences';
import { INITIAL_DATA, createInitialData } from './initialData';
// Note: Google Drive sync is handled by Electron (electron/drive.cjs) and Web (syncEngine.js)

const STORAGE_KEY = 'my_hotel_master_db_v1';

export const loadStoredData = async () => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    if (value) {
      return JSON.parse(value);
    }
    // Fallback to localStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }
    // Seed initial data with current timestamp
    const cleanData = createInitialData();
    await saveStoredData(cleanData);
    return cleanData;
  } catch (error) {
    console.error('Error loading stored data:', error);
    return createInitialData();
  }
};

export const saveStoredData = async (data) => {
  try {
    const serialized = JSON.stringify(data);
    await Preferences.set({ key: STORAGE_KEY, value: serialized });
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
};

export const resetToCleanData = async () => {
  try {
    const cleanData = createInitialData();
    await saveStoredData(cleanData);
    return cleanData;
  } catch (error) {
    console.error('Error resetting to clean baseline data:', error);
    return INITIAL_DATA;
  }
};

export const exportDataAsJSON = (data) => {
  return JSON.stringify(data, null, 2);
};

export const importDataFromJSON = async (jsonString) => {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON format');
    }
    if (!parsed.restaurant_info) {
      throw new Error('Invalid hotel database format: missing restaurant_info');
    }
    // FIX M-09: Validate required array fields to prevent corrupt partial imports
    if (parsed.daily_records !== undefined && !Array.isArray(parsed.daily_records)) {
      throw new Error('daily_records must be an array');
    }
    if (parsed.staff !== undefined && !Array.isArray(parsed.staff)) {
      throw new Error('staff must be an array');
    }
    if (parsed.owners !== undefined && !Array.isArray(parsed.owners)) {
      throw new Error('owners must be an array');
    }
    if (parsed.fixed_assets !== undefined && !Array.isArray(parsed.fixed_assets)) {
      throw new Error('fixed_assets must be an array');
    }
    if (parsed.monthly_bills !== undefined && !Array.isArray(parsed.monthly_bills)) {
      throw new Error('monthly_bills must be an array');
    }
    if (Array.isArray(parsed.monthly_bills)) {
      const monthYearRegex = /^\d{4}-\d{2}$/;
      parsed.monthly_bills.forEach((bill, i) => {
        if (!bill || typeof bill !== 'object') {
          throw new Error(`monthly_bills[${i}] must be an object`);
        }
        if (bill.month_year && !monthYearRegex.test(bill.month_year)) {
          throw new Error(`monthly_bills[${i}].month_year must be in YYYY-MM format`);
        }
        if (bill.amount !== undefined && !isFinite(Number(bill.amount))) {
          throw new Error(`monthly_bills[${i}].amount must be a valid number`);
        }
      });
    }

    // FIX M-02: Deduplicate daily_records by date to prevent duplicate date entries upon import
    if (Array.isArray(parsed.daily_records)) {
      const recordMap = new Map();
      parsed.daily_records.forEach((rec) => {
        if (rec && rec.date) {
          if (!recordMap.has(rec.date)) {
            recordMap.set(rec.date, rec);
          } else {
            // Keep the record with night closing or more data
            const existing = recordMap.get(rec.date);
            if (rec.night_closing && !existing.night_closing) {
              recordMap.set(rec.date, rec);
            }
          }
        }
      });
      parsed.daily_records = Array.from(recordMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }

    await saveStoredData(parsed);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Failed to import JSON data:', error);
    return { success: false, error: error.message };
  }
};

// FIX L-02: syncWithGoogleCloud was dead code (never imported or called)
// Google Drive sync is now handled exclusively via:
// - Electron: electron/main.cjs pushToDrive / pullFromDrive
// - Web/Mobile: src/utils/syncEngine.js via AppDataContext
