/**
 * Bidirectional Deep Merge Engine for Electron Desktop
 * Unifies local and remote (Google Drive) databases with granular,
 * item-level conflict resolution. Neither PC nor Mobile can erase each other.
 */

function mergeDailyRecord(localDay, remoteDay) {
  if (!remoteDay) return localDay;
  if (!localDay) return remoteDay;

  // 1. Morning Market / Bazar (Union by unique ID)
  const marketMap = new Map();
  (remoteDay.morning_market || []).forEach((item) => {
    if (item && item.id) marketMap.set(item.id, item);
  });
  (localDay.morning_market || []).forEach((item) => {
    if (item && item.id) {
      marketMap.set(item.id, { ...(marketMap.get(item.id) || {}), ...item });
    }
  });

  // 2. Sales (preserve non-zero or newer entry)
  const localSales = localDay.sales || { cash_sales: 0, digital_sales: 0, total_sales: 0 };
  const remoteSales = remoteDay.sales || { cash_sales: 0, digital_sales: 0, total_sales: 0 };
  const localTotal = Number(localSales.total_sales || (Number(localSales.cash_sales || 0) + Number(localSales.digital_sales || 0)));
  const remoteTotal = Number(remoteSales.total_sales || (Number(remoteSales.cash_sales || 0) + Number(remoteSales.digital_sales || 0)));
  
  let sales = localSales;
  if (remoteTotal > 0 && localTotal === 0) {
    sales = remoteSales;
  } else if (localTotal > 0 && remoteTotal === 0) {
    sales = localSales;
  } else if (remoteTotal > 0 && localTotal > 0) {
    const localTime = new Date(localDay.updatedAt || localDay.lastUpdated || 0).getTime();
    const remoteTime = new Date(remoteDay.updatedAt || remoteDay.lastUpdated || 0).getTime();
    sales = remoteTime > localTime ? remoteSales : localSales;
  }

  // 3. Owner Drawings (Union by unique ID)
  const drawingMap = new Map();
  (remoteDay.owner_drawings || []).forEach((d) => { if (d && d.id) drawingMap.set(d.id, d); });
  (localDay.owner_drawings || []).forEach((d) => { if (d && d.id) drawingMap.set(d.id, { ...(drawingMap.get(d.id) || {}), ...d }); });

  // 4. Staff Advances (Union by unique ID)
  const advanceMap = new Map();
  (remoteDay.staff_advances || []).forEach((a) => { if (a && a.id) advanceMap.set(a.id, a); });
  (localDay.staff_advances || []).forEach((a) => { if (a && a.id) advanceMap.set(a.id, { ...(advanceMap.get(a.id) || {}), ...a }); });

  // 5. Wastage / Demurrage (Union by unique ID)
  const wastageMap = new Map();
  (remoteDay.wastage_demurrage || []).forEach((w) => { if (w && w.id) wastageMap.set(w.id, w); });
  (localDay.wastage_demurrage || []).forEach((w) => { if (w && w.id) wastageMap.set(w.id, { ...(wastageMap.get(w.id) || {}), ...w }); });

  // 6. Night Closing (take closed state or newer)
  let night_closing = localDay.night_closing || remoteDay.night_closing || null;
  if (localDay.night_closing && remoteDay.night_closing) {
    const localTime = new Date(localDay.night_closing.timestamp || localDay.night_closing.closed_at || 0).getTime();
    const remoteTime = new Date(remoteDay.night_closing.timestamp || remoteDay.night_closing.closed_at || 0).getTime();
    night_closing = remoteTime > localTime ? remoteDay.night_closing : localDay.night_closing;
  }

  // 7. Opening float
  const opening_float = Number(localDay.opening_float || 0) > 0
    ? Number(localDay.opening_float)
    : Number(remoteDay.opening_float || 0);

  return {
    id: localDay.id || remoteDay.id || `rec_${localDay.date}`,
    date: localDay.date,
    opening_float,
    morning_market: Array.from(marketMap.values()),
    sales,
    owner_drawings: Array.from(drawingMap.values()),
    staff_advances: Array.from(advanceMap.values()),
    wastage_demurrage: Array.from(wastageMap.values()),
    night_closing,
    updatedAt: new Date().toISOString(),
  };
}

function mergeMasterData(localData, remoteData) {
  if (!remoteData) return localData;
  if (!localData) return remoteData;

  // 1. Restaurant Info
  const restaurant_info = {
    ...(remoteData.restaurant_info || {}),
    ...(localData.restaurant_info || {}),
    name: localData.restaurant_info?.name || remoteData.restaurant_info?.name || 'My Hotel & Restaurant',
    currency: localData.restaurant_info?.currency || remoteData.restaurant_info?.currency || '৳',
    google_drive_connected: true,
    google_account_email: localData.restaurant_info?.google_account_email || remoteData.restaurant_info?.google_account_email || '',
    last_synced_at: new Date().toISOString(),
  };

  // 2. Owners (Union by id or name)
  const ownerMap = new Map();
  (remoteData.owners || []).forEach((o) => { if (o) ownerMap.set(o.id || o.name, o); });
  (localData.owners || []).forEach((o) => {
    if (o) {
      const key = o.id || o.name;
      ownerMap.set(key, { ...(ownerMap.get(key) || {}), ...o });
    }
  });

  // 3. Staff (Union by id or name)
  const staffMap = new Map();
  (remoteData.staff || []).forEach((s) => { if (s) staffMap.set(s.id || s.name, s); });
  (localData.staff || []).forEach((s) => {
    if (s) {
      const key = s.id || s.name;
      staffMap.set(key, { ...(staffMap.get(key) || {}), ...s });
    }
  });

  // 4. Fixed Assets (Union by id)
  const assetMap = new Map();
  (remoteData.fixed_assets || []).forEach((a) => { if (a && a.id) assetMap.set(a.id, a); });
  (localData.fixed_assets || []).forEach((a) => {
    if (a && a.id) {
      assetMap.set(a.id, { ...(assetMap.get(a.id) || {}), ...a });
    }
  });

  // 5. Monthly Bills (Union by id)
  const billMap = new Map();
  (remoteData.monthly_bills || []).forEach((b) => { if (b && b.id) billMap.set(b.id, b); });
  (localData.monthly_bills || []).forEach((b) => {
    if (b && b.id) {
      billMap.set(b.id, { ...(billMap.get(b.id) || {}), ...b });
    }
  });

  // 6. Daily Records (Union by date with granular sub-item merge)
  const dayMap = new Map();
  (remoteData.daily_records || []).forEach((r) => { if (r && r.date) dayMap.set(r.date, r); });

  (localData.daily_records || []).forEach((localDay) => {
    if (!localDay || !localDay.date) return;
    const remoteDay = dayMap.get(localDay.date);
    if (!remoteDay) {
      dayMap.set(localDay.date, localDay);
    } else {
      dayMap.set(localDay.date, mergeDailyRecord(localDay, remoteDay));
    }
  });

  const mergedDailyRecords = Array.from(dayMap.values()).sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return {
    restaurant_info,
    owners: Array.from(ownerMap.values()),
    staff: Array.from(staffMap.values()),
    fixed_assets: Array.from(assetMap.values()),
    monthly_bills: Array.from(billMap.values()),
    daily_records: mergedDailyRecords,
    updatedAt: new Date().toISOString(),
  };
}

module.exports = {
  mergeDailyRecord,
  mergeMasterData,
};
