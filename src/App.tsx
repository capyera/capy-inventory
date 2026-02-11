import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
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
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { Settings } from './pages/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';

// Valid tabs for URL routing
const VALID_TABS = [
  'dashboard', 'products', 'inventory', 'warehouses', 'bundles', 'cogs',
  'purchase-orders', 'inbounds', 'suppliers', 'forecasting', 'demand-planning',
  'reorder', 'revenue-planner', 'ops-calendar', 'analytics', 'admin', 'settings', 'help'
];

function getTabFromHash(): string {
  const hash = window.location.hash.replace('#', '');
  return VALID_TABS.includes(hash) ? hash : 'dashboard';
}

function AuthenticatedApp() {
  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const { user } = useAuth();

  // Sync tab changes to URL hash
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  }, []);

  // Listen for browser back/forward
  useEffect(() => {
    const handleHashChange = () => {
      setActiveTab(getTabFromHash());
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
        return <Inventory />;
      case 'warehouses':
        return <Warehouses />;
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
