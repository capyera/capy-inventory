import { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Warehouses } from './pages/Warehouses';
import { Bundles } from './pages/Bundles';
import { Products } from './pages/Products';
import { COGS } from './pages/COGS';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { Suppliers } from './pages/Suppliers';
import { Forecasting } from './pages/Forecasting';
import { DemandPlanning } from './pages/DemandPlanning';
import { ReorderPoints } from './pages/ReorderPoints';
import { RevenueTargetPlanner } from './pages/RevenueTargetPlanner';
import { OpsCalendar } from './pages/OpsCalendar';
import { Analytics } from './pages/Analytics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />;
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
      case 'settings':
        return <SettingsPlaceholder />;
      case 'help':
        return <HelpPlaceholder />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </main>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚙️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
        <p className="text-gray-500 mt-2">Configure your inventory settings</p>
        <div className="mt-6 space-y-3 max-w-sm mx-auto text-left">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">Shopify Connection</h3>
            <p className="text-sm text-green-600 mt-1">✓ Connected to 152919-65.myshopify.com</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">Convex Database</h3>
            <p className="text-sm text-green-600 mt-1">✓ Connected</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">Google Sheets</h3>
            <p className="text-sm text-green-600 mt-1">✓ Synced with inventory sheet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HelpPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🦫</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Capy Inventory Help</h2>
        <p className="text-gray-500 mt-2">Need assistance? Here are some quick tips:</p>
        <div className="mt-6 space-y-3 text-left">
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">📦 Inventory Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">View all SKUs, stock levels, and velocity data in one place.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">🔗 Bundle Management</h3>
            <p className="text-sm text-gray-600 mt-1">Components are auto-deducted when bundles sell.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">📈 Velocity-Based Reordering</h3>
            <p className="text-sm text-gray-600 mt-1">Smart reorder points based on actual sales data.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-medium">🔄 Data Sync</h3>
            <p className="text-sm text-gray-600 mt-1">Click "Sync" to refresh data from Shopify and Mars warehouse.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
