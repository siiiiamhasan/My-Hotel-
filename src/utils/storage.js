import { Preferences } from '@capacitor/preferences';
import { INITIAL_DATA } from './initialData';
import { pullFromGoogleDrive, pushToGoogleDrive } from './googleDrive';

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
    // Seed initial data
    await saveStoredData(INITIAL_DATA);
    return INITIAL_DATA;
  } catch (error) {
    console.error('Error loading stored data:', error);
    return INITIAL_DATA;
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
    await saveStoredData(INITIAL_DATA);
    return INITIAL_DATA;
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
    if (!parsed || typeof parsed !== 'object' || !parsed.restaurant_info) {
      throw new Error('Invalid restaurant database format');
    }
    await saveStoredData(parsed);
    return { success: true, data: parsed };
  } catch (error) {
    console.error('Failed to import JSON data:', error);
    return { success: false, error: error.message };
  }
};

export const syncWithGoogleCloud = async (localData) => {
  const pullRes = await pullFromGoogleDrive(localData);
  if (pullRes.success && pullRes.data) {
    await saveStoredData(pullRes.data);
    return pullRes;
  }
  const pushRes = await pushToGoogleDrive(localData);
  if (pushRes.success && pushRes.data) {
    await saveStoredData(pushRes.data);
    return pushRes;
  }
  return pullRes.error ? pullRes : pushRes;
};
