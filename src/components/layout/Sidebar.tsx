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
  Shield,
  Truck
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
  { id: 'inbounds', label: 'Inbounds', icon: Truck },
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
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-base">🦫</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 text-[15px]">Capy Inventory</h1>
            <p className="text-[11px] text-slate-500">Operations</p>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
              activeTab === item.id
                ? "bg-amber-50 text-amber-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-[18px] h-[18px]",
              activeTab === item.id ? "text-amber-600" : "text-slate-400"
            )} />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded",
                item.badge === 'PRO' 
                  ? "bg-violet-100 text-violet-700"
                  : "bg-emerald-100 text-emerald-700"
              )}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      {/* Bottom items */}
      <div className="px-3 py-3 border-t border-slate-100 space-y-0.5">
        {user?.role === 'admin' && (
          <button
            onClick={() => onTabChange('admin')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
              activeTab === 'admin'
                ? "bg-violet-50 text-violet-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Shield className={cn("w-[18px] h-[18px]", activeTab === 'admin' ? "text-violet-600" : "text-slate-400")} />
            Admin
          </button>
        )}
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
              activeTab === item.id
                ? "bg-amber-50 text-amber-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className="w-[18px] h-[18px] text-slate-400" />
            {item.label}
          </button>
        ))}
      </div>
      
      {/* User */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-medium text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </aside>
  );
}
