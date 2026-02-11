import { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, Cloud, CloudUpload, CloudDownload, 
  Download, Upload, RefreshCw, CheckCircle, AlertCircle, Database,
  HardDrive, FileJson
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Header } from '../components/layout/Header';
import { useAuth } from '../contexts/AuthContext';
import { appBackup } from '../services/appBackup';
import { productRegistry } from '../services/productRegistry';

export function Settings() {
  const { user } = useAuth();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastAction, setLastAction] = useState<{ type: string; success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const backupStatus = appBackup.getBackupStatus();
  const productSyncStatus = productRegistry.getSyncStatus();
  const backupSummary = appBackup.getBackupSummary();

  async function handleBackupToCloud() {
    if (!user || isBackingUp) return;
    setIsBackingUp(true);
    setLastAction(null);
    
    try {
      const result = await appBackup.backupToCloud(user.email, 'Manual backup');
      if (result.success) {
        setLastAction({ type: 'backup', success: true, message: 'All data backed up to cloud!' });
      } else {
        setLastAction({ type: 'backup', success: false, message: result.error || 'Backup failed' });
      }
    } catch (error) {
      setLastAction({ type: 'backup', success: false, message: String(error) });
    } finally {
      setIsBackingUp(false);
    }
  }

  async function handleRestoreFromCloud() {
    if (!user || isRestoring) return;
    if (!confirm('This will replace all your local data with the cloud backup. Continue?')) return;
    
    setIsRestoring(true);
    setLastAction(null);
    
    try {
      const result = await appBackup.restoreFromCloud(user.email);
      if (result.success) {
        setLastAction({ 
          type: 'restore', 
          success: true, 
          message: `Restored ${result.restored} data items from cloud. Refresh to see changes.` 
        });
      } else {
        setLastAction({ type: 'restore', success: false, message: result.error || 'Restore failed' });
      }
    } catch (error) {
      setLastAction({ type: 'restore', success: false, message: String(error) });
    } finally {
      setIsRestoring(false);
    }
  }

  function handleExportFile() {
    appBackup.exportToFile();
    setLastAction({ type: 'export', success: true, message: 'Backup file downloaded!' });
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!confirm('This will replace all your local data with the backup file. Continue?')) {
      e.target.value = '';
      return;
    }
    
    setIsRestoring(true);
    setLastAction(null);
    
    try {
      const result = await appBackup.importFromFile(file);
      if (result.success) {
        setLastAction({ 
          type: 'import', 
          success: true, 
          message: `Restored ${result.restored} data items from file. Refresh to see changes.` 
        });
      } else {
        setLastAction({ type: 'import', success: false, message: result.error || 'Import failed' });
      }
    } catch (error) {
      setLastAction({ type: 'import', success: false, message: String(error) });
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  }

  async function handleSyncProducts() {
    setIsBackingUp(true);
    setLastAction(null);
    
    try {
      const result = await productRegistry.syncToCloud();
      if (result.error) {
        setLastAction({ type: 'sync', success: false, message: result.error });
      } else {
        setLastAction({ type: 'sync', success: true, message: `Synced ${result.synced} products to cloud!` });
      }
    } catch (error) {
      setLastAction({ type: 'sync', success: false, message: String(error) });
    } finally {
      setIsBackingUp(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header 
        title="Settings" 
        subtitle="Backup, sync, and manage your data"
      />
      
      <div className="flex-1 overflow-y-auto p-6">
        {/* Status Alert */}
        {lastAction && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            lastAction.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {lastAction.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span>{lastAction.message}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Cloud Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-600" />
                Cloud Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Backup all your app data to Convex cloud. Data is stored securely and can be restored on any device.
              </p>
              
              {backupStatus?.lastBackup && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span>Last backup: {new Date(backupStatus.lastBackup).toLocaleString()}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {backupStatus.status}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleBackupToCloud}
                  disabled={isBackingUp || isRestoring}
                  className="flex-1"
                >
                  {isBackingUp ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4 mr-2" />
                  )}
                  Backup to Cloud
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRestoreFromCloud}
                  disabled={isBackingUp || isRestoring}
                  className="flex-1"
                >
                  {isRestoring ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CloudDownload className="w-4 h-4 mr-2" />
                  )}
                  Restore from Cloud
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Local Backup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-amber-600" />
                Local Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Download your data as a JSON file or restore from a previous backup file.
              </p>
              
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  <span>{backupSummary.keys.length} data items</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Size: ~{(backupSummary.totalSize / 1024).toFixed(1)} KB
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleExportFile}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Restore from File
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Product Sync */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Product Data Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Sync product master data (SKUs, images, COGS) separately to Convex. Products sync automatically but you can force a sync here.
              </p>
              
              {productSyncStatus?.lastSync && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Last sync: {new Date(productSyncStatus.lastSync).toLocaleString()}</span>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleSyncProducts}
                disabled={isBackingUp}
                className="w-full"
              >
                {isBackingUp ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Sync Products Now
              </Button>
            </CardContent>
          </Card>

          {/* Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-gray-600" />
                Data Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {backupSummary.keys.map(key => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{key.replace('capy-', '')}</span>
                    <span className="text-gray-400">✓</span>
                  </div>
                ))}
                {backupSummary.keys.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No data stored yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-3">💡 How Backup Works</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-700">Cloud Backup (Recommended)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Syncs all data to Convex cloud</li>
                  <li>Access from any device/browser</li>
                  <li>Automatic restore on new sessions</li>
                  <li>Linked to your login email</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Local Backup (Additional Safety)</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Downloads JSON file to your device</li>
                  <li>Keep multiple backup versions</li>
                  <li>Works offline</li>
                  <li>Manual restore when needed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Settings;
