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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
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
        
        <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
