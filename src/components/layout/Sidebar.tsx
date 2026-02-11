import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  DollarSign, 
  ClipboardList, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Settings,
  HelpCircle,
  BarChart3,
  Warehouse,
  Brain,
  Target,
  Calendar,
  Database,
  LogOut,
  Shield
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'revenue-planner', label: 'Revenue Planner', icon: Target, badge: 'PRO' },
  { id: 'ops-calendar', label: 'Ops Calendar', icon: Calendar, badge: 'NEW' },
  { id: 'products', label: 'Products', icon: Database },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'warehouses', label: 'Warehouses', icon: Warehouse },
  { id: 'bundles', label: 'Bundles', icon: Layers },
  { id: 'cogs', label: 'COGS & Margins', icon: DollarSign },
  { id: 'purchase-orders', label: 'Purchase Orders', icon: ClipboardList },
  { id: 'suppliers', label: 'Suppliers', icon: Users },
  { id: 'forecasting', label: 'Forecasting', icon: TrendingUp },
  { id: 'demand-planning', label: 'Demand Planning', icon: Brain },
  { id: 'reorder', label: 'Reorder Points', icon: AlertTriangle },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const bottomItems = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-sm">🦫</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900">Capy Inventory</h1>
            <p className="text-xs text-gray-500">Operations Workspace</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id
                ? "bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 shadow-sm"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-amber-600" : "text-gray-400"
            )} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                item.badge === 'PRO' 
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              )}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      {/* Bottom items */}
      <div className="px-4 py-4 border-t border-gray-200 space-y-1">
        {/* Admin - only for admins */}
        {user?.role === 'admin' && (
          <button
            onClick={() => onTabChange('admin')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'admin'
                ? "bg-purple-50 text-purple-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <Shield className="w-5 h-5 text-purple-500" />
            Admin
          </button>
        )}
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-amber-50 text-amber-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <item.icon className="w-5 h-5 text-gray-400" />
            {item.label}
          </button>
        ))}
      </div>
      
      {/* User */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-medium text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 truncate">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
