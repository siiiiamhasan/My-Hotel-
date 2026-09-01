import { DB_FILENAME } from './types';

const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

export class GoogleDriveService {
  /**
   * Search for database file on Google Drive (both appDataFolder and drive root/file space)
   */
  static async findDatabaseFile(accessToken) {
    const filenames = [DB_FILENAME, 'business-management-data.json', 'restaurant_master_db.json'];

    for (const name of filenames) {
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
            return data.files[0];
          }
        }
      } catch (e) {
        console.warn(`Drive search for ${name} failed:`, e);
      }
    }

    return null;
  }

  /**
   * Download database JSON file from Drive with corrupt JSON protection
   */
  static async downloadDatabase(fileId, accessToken) {
    const res = await fetch(`${DRIVE_BASE_URL}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Drive Download Error (${res.status}): ${errText}`);
    }

    const rawText = await res.text();
    try {
      const parsed = JSON.parse(rawText);
      return parsed;
    } catch (e) {
      throw new Error(`Invalid or corrupt JSON in remote Drive database: ${e.message}`);
    }
  }

  /**
   * Multipart Upload: Create new file or Update (PATCH) existing file on Drive
   */
  static async uploadDatabase(data, accessToken, existingFileId = null) {
    const fileContent = JSON.stringify(data, null, 2);
    const metadata = {
      name: DB_FILENAME,
      mimeType: 'application/json',
      description: 'Master Accounting Database for My Hotel & Restaurant Manager',
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

    const url = existingFileId
      ? `${DRIVE_UPLOAD_URL}/files/${existingFileId}?uploadType=multipart`
      : `${DRIVE_UPLOAD_URL}/files?uploadType=multipart`;

    const res = await fetch(url, {
      method: existingFileId ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Drive Upload Error (${res.status}): ${errText}`);
    }

    return await res.json();
  }

  /**
   * Fetch User Profile
   */
  static async fetchUserProfile(accessToken) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch user profile:', e);
    }
    return null;
  }
}
