import { Bell, RefreshCw, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { SearchInput } from '../ui/Input';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function Header({ title, subtitle, onRefresh, isLoading }: HeaderProps) {
  const [notifications] = useState(3);
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3">
        <div className="w-64">
          <SearchInput placeholder="Search SKUs, products..." />
        </div>
        
        {onRefresh && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            isLoading={isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync
          </Button>
        )}
        
        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
        
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
