const PRIMARY_DB_FILENAME = 'hotel-management-data.json';
const LEGACY_DB_FILENAMES = ['business-management-data.json', 'restaurant_master_db.json'];

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Scan & Find Database File on Google Drive
 * Checks primary name first, then checks legacy names for compatibility.
 */
async function findFileId(accessToken) {
  const filenamesToSearch = [PRIMARY_DB_FILENAME, ...LEGACY_DB_FILENAMES];

  for (const name of filenamesToSearch) {
    try {
      const query = encodeURIComponent(`name = '${name}' and trashed = false`);
      const res = await fetch(
        `${DRIVE_BASE_URL}/files?q=${query}&spaces=drive,appDataFolder&fields=files(id,name,modifiedTime,size)&pageSize=1`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.files && data.files.length > 0) {
          return data.files[0].id;
        }
      }
    } catch (err) {
      console.warn(`Drive search for ${name} failed:`, err);
    }
  }

  return null;
}

/**
 * Download Database File Content from Google Drive
 */
async function downloadFile(accessToken, fileId) {
  const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive download failed (${res.status}): ${errText}`);
  }

  const rawText = await res.text();
  try {
    const parsed = JSON.parse(rawText);
    return parsed;
  } catch (err) {
    throw new Error(`Corrupt JSON in Drive file: ${err.message}`);
  }
}

/**
 * Create New Database File on Google Drive (Multipart Upload)
 */
async function createFile(accessToken, data) {
  const fileContent = JSON.stringify(data, null, 2);
  const metadata = {
    name: PRIMARY_DB_FILENAME,
    mimeType: 'application/json',
    description: 'Hotel & Restaurant Management Master Database',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive createFile failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return result.id;
}

/**
 * Update (PATCH) Existing Database File on Google Drive
 */
async function updateFile(accessToken, fileId, data) {
  const fileContent = JSON.stringify(data, null, 2);
  const metadata = {
    name: PRIMARY_DB_FILENAME,
    mimeType: 'application/json',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/json\r\n\r\n' +
    fileContent +
    closeDelimiter;

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files/${fileId}?uploadType=multipart`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: multipartRequestBody,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive updateFile failed (${res.status}): ${errText}`);
  }

  const result = await res.json();
  return result.id;
}

/**
 * Fetch Google User Profile Information
 */
async function fetchUserProfile(accessToken) {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Failed to fetch user profile:', err);
  }
  return null;
}

module.exports = {
  PRIMARY_DB_FILENAME,
  findFileId,
  downloadFile,
  createFile,
  updateFile,
  fetchUserProfile,
};
