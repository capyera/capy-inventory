import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';

// ============ MIGRATION: Feb 11, 2026 Fresh Start ============
// Clears POs, inbounds, and inventory data for clean reset
// Only runs once per browser
const MIGRATION_KEY = 'capy-migration-version';
const CURRENT_MIGRATION = 1;

function runMigrations() {
  const lastMigration = parseInt(localStorage.getItem(MIGRATION_KEY) || '0', 10);
  
  if (lastMigration < 1) {
    console.log('[Migration 1] Fresh Start - Clearing POs, inbounds, inventory...');
    
    // Clear Purchase Orders
    localStorage.removeItem('capy-purchase-orders');
    
    // Clear Inbounds
    localStorage.removeItem('capy-inbounds');
    localStorage.removeItem('capy-inbound-history');
    
    // Clear inventory data (separate from product master data)
    localStorage.removeItem('capy-inventory');
    localStorage.removeItem('capy-inventory-snapshots');
    
    // Clear warehouse transfers
    localStorage.removeItem('capy-warehouse-transfers');
    
    // Keep: product registry, suppliers, bundles, velocity data
    console.log('[Migration 1] Complete. Ready for fresh data.');
  }
  
  localStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION));
}

// Run migrations immediately on module load
runMigrations();
import { Inventory } from './pages/Inventory';
import { Warehouses } from './pages/Warehouses';
import { Bundles } from './pages/Bundles';
import { Products } from './pages/Products';
import { COGS } from './pages/COGS';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Inbounds } from './pages/Inbounds';
import { Suppliers } from './pages/Suppliers';
import { Forecasting } from './pages/Forecasting';
import { DemandPlanning } from './pages/DemandPlanning';
import { ReorderPoints } from './pages/ReorderPoints';
import { RevenueTargetPlanner } from './pages/RevenueTargetPlanner';
import { OpsCalendar } from './pages/OpsCalendar';
import { Analytics } from './pages/Analytics';
import { SalesAnalytics } from './pages/SalesAnalytics';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';

// Valid tabs for URL routing
const VALID_TABS = [
  'dashboard', 'products', 'inventory', 'warehouses', 'bundles', 'cogs',
  'purchase-orders', 'inbounds', 'suppliers', 'forecasting', 'demand-planning',
  'reorder', 'revenue-planner', 'ops-calendar', 'analytics', 'sales-analytics', 'admin', 'settings', 'help'
];

interface HashState {
  tab: string;
  params: Record<string, string>;
}

function parseHash(): HashState {
  const hash = window.location.hash.replace('#', '');
  const [tab, queryString] = hash.split('?');
  const params: Record<string, string> = {};
  
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }
  
  return {
    tab: VALID_TABS.includes(tab) ? tab : 'dashboard',
    params,
  };
}

function getTabFromHash(): string {
  return parseHash().tab;
}

function AuthenticatedApp() {
  const [hashState, setHashState] = useState<HashState>(parseHash);
  const { user } = useAuth();
  
  const activeTab = hashState.tab;
  const hashParams = hashState.params;

  // Sync tab changes to URL hash
  const handleTabChange = useCallback((tab: string, params?: Record<string, string>) => {
    let hash = tab;
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.entries(params)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join('&');
      hash = `${tab}?${queryString}`;
    }
    window.location.hash = hash;
    setHashState({ tab, params: params || {} });
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setHashState(parseHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={handleTabChange} />;
      case 'products':
        return <Products />;
      case 'inventory':
        return <Inventory initialWarehouse={hashParams.warehouse} />;
      case 'warehouses':
        return <Warehouses onNavigate={handleTabChange} />;
      case 'bundles':
        return <Bundles />;
      case 'cogs':
        return <COGS />;
      case 'purchase-orders':
        return <PurchaseOrders />;
      case 'inbounds':
        return <Inbounds />;
      case 'suppliers':
        return <Suppliers />;
      case 'forecasting':
        return <Forecasting />;
      case 'demand-planning':
        return <DemandPlanning />;
      case 'reorder':
        return <ReorderPoints />;
      case 'revenue-planner':
        return <RevenueTargetPlanner />;
      case 'ops-calendar':
        return <OpsCalendar />;
      case 'analytics':
        return <Analytics />;
      case 'sales-analytics':
        return <SalesAnalytics />;
      case 'admin':
        return <Admin onBack={() => handleTabChange('dashboard')} />;
      case 'settings':
        return <Settings />;
      case 'help':
        return <HelpPlaceholder />;
      default:
        return <Dashboard onNavigate={handleTabChange} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <WorkspaceHeader userName={user?.name || 'User'} />
        {renderPage()}
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function HelpPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🦫</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Capy Inventory Help</h2>
        <p className="text-gray-500 mt-2">Need assistance? Here are some quick tips:</p>
        <div className="mt-6 space-y-3 text-left">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-medium">📦 Inventory Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">View all SKUs, stock levels, and velocity data in one place.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-medium">🔗 Bundle Management</h3>
            <p className="text-sm text-gray-600 mt-1">Components are auto-deducted when bundles sell.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-medium">📈 Velocity-Based Reordering</h3>
            <p className="text-sm text-gray-600 mt-1">Smart reorder points based on actual sales data.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-medium">🔄 Data Sync</h3>
            <p className="text-sm text-gray-600 mt-1">Click "Sync" to refresh data from Shopify and Mars warehouse.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
