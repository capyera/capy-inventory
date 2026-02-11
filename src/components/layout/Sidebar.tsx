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
    <aside className="w-64 bg-[#1a1f2e] border-r border-[#2f3847] flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#2f3847]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center glow-sm">
            <span className="text-white font-bold text-sm">🦫</span>
          </div>
          <div>
            <h1 className="font-bold text-white">Capy Inventory</h1>
            <p className="text-xs text-[#8b98a5]">Operations Workspace</p>
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
                ? "bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30"
                : "text-[#8b98a5] hover:bg-[#242b3d] hover:text-white"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              activeTab === item.id ? "text-amber-400" : "text-[#8b98a5]"
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
      <div className="px-4 py-4 border-t border-[#2f3847] space-y-1">
        {/* Admin - only for admins */}
        {user?.role === 'admin' && (
          <button
            onClick={() => onTabChange('admin')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === 'admin'
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-[#8b98a5] hover:bg-[#242b3d] hover:text-white"
            )}
          >
            <Shield className="w-5 h-5 text-purple-400" />
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
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "text-[#8b98a5] hover:bg-[#242b3d] hover:text-white"
            )}
          >
            <item.icon className="w-5 h-5 text-[#8b98a5]" />
            {item.label}
          </button>
        ))}
      </div>
      
      {/* User */}
      <div className="px-4 py-4 border-t border-[#2f3847]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 font-medium text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-[#8b98a5] truncate">{user?.role === 'admin' ? 'Admin' : 'Member'}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-[#242b3d] rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4 text-[#8b98a5]" />
          </button>
        </div>
      </div>
    </aside>
  );
}
