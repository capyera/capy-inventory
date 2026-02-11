/**
 * App Backup Service
 * 
 * Handles backup and restore of all app data to/from Convex cloud.
 * This provides a single point for data persistence across all features.
 */

const CONVEX_URL = 'https://adventurous-fennec-839.convex.cloud';

// All localStorage keys used by the app
const APP_STORAGE_KEYS = [
  'capy-product-registry',
  'capy-product-sync-status',
  'capy-bundle-registry',
  'capy-suppliers',
  'capy-purchase-orders',
  'capy-inventory-adjustments',
  'capy-forecasting-settings',
  'capy-warehouse-settings',
  'capy-cogs-overrides',
];

// Keys to exclude from backup (auth-related, temporary)
const EXCLUDED_KEYS = [
  'capy-current-user',
  'capy-users',
  'capy-workspace',
];

interface BackupData {
  version: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Call a Convex mutation
 */
async function callMutation(name: string, args: Record<string, unknown>): Promise<unknown> {
  const response = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: name,
      args,
      format: 'json',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Convex mutation failed: ${error}`);
  }
  
  const result = await response.json();
  return result.value;
}

/**
 * Call a Convex query
 */
async function callQuery(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  const response = await fetch(`${CONVEX_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: name,
      args,
      format: 'json',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Convex query failed: ${error}`);
  }
  
  const result = await response.json();
  return result.value;
}

/**
 * Collect all app data from localStorage
 */
function collectAppData(): BackupData {
  const data: Record<string, unknown> = {};
  
  // Collect all capy-* keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('capy-') && !EXCLUDED_KEYS.includes(key)) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          data[key] = JSON.parse(value);
        }
      } catch {
        // Store as string if not valid JSON
        data[key] = localStorage.getItem(key);
      }
    }
  }
  
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Restore app data to localStorage
 */
function restoreAppData(backup: BackupData): { restored: number; keys: string[] } {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(backup.data)) {
    if (!EXCLUDED_KEYS.includes(key)) {
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        keys.push(key);
      } catch (error) {
        console.error(`Failed to restore ${key}:`, error);
      }
    }
  }
  
  return { restored: keys.length, keys };
}

export const appBackup = {
  /**
   * Backup all app data to Convex cloud
   */
  async backupToCloud(userId: string, description?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const backupData = collectAppData();
      const backupId = `backup-${userId}-${Date.now()}`;
      
      await callMutation('appBackup:save', {
        backupId,
        userId,
        data: JSON.stringify(backupData),
        description: description || `Auto backup - ${new Date().toLocaleString()}`,
      });
      
      // Update local sync status
      localStorage.setItem('capy-backup-status', JSON.stringify({
        lastBackup: new Date().toISOString(),
        backupId,
        status: 'success',
      }));
      
      return { success: true };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      localStorage.setItem('capy-backup-status', JSON.stringify({
        lastBackup: new Date().toISOString(),
        status: 'error',
        error: errorMsg,
      }));
      return { success: false, error: errorMsg };
    }
  },

  /**
   * Restore app data from Convex cloud
   */
  async restoreFromCloud(userId: string): Promise<{ success: boolean; restored?: number; error?: string }> {
    try {
      const backup = await callQuery('appBackup:getLatest', { userId }) as {
        data: string;
        createdAt: string;
      } | null;
      
      if (!backup) {
        return { success: false, error: 'No backup found in cloud' };
      }
      
      const backupData: BackupData = JSON.parse(backup.data);
      const result = restoreAppData(backupData);
      
      return { success: true, restored: result.restored };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  /**
   * Get backup status
   */
  getBackupStatus(): { lastBackup?: string; status: string; error?: string } | null {
    try {
      const stored = localStorage.getItem('capy-backup-status');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Export all app data as JSON file
   */
  exportToFile(): void {
    const backupData = collectAppData();
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capy-inventory-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import app data from JSON file
   */
  importFromFile(file: File): Promise<{ success: boolean; restored?: number; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const backupData: BackupData = JSON.parse(reader.result as string);
          
          if (!backupData.version || !backupData.data) {
            resolve({ success: false, error: 'Invalid backup file format' });
            return;
          }
          
          const result = restoreAppData(backupData);
          resolve({ success: true, restored: result.restored });
        } catch (error) {
          resolve({ success: false, error: 'Failed to parse backup file' });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  },

  /**
   * Get summary of what would be backed up
   */
  getBackupSummary(): { keys: string[]; totalSize: number } {
    const keys: string[] = [];
    let totalSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('capy-') && !EXCLUDED_KEYS.includes(key)) {
        keys.push(key);
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
    }
    
    return { keys, totalSize };
  },
};

export default appBackup;
