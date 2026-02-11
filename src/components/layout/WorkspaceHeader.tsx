import { ChevronDown, Package, FileText } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WorkspaceHeaderProps {
  userName: string;
}

const workspaces = [
  { id: 'operations', name: 'Operations', icon: Package, available: true },
  { id: 'content', name: 'Content', icon: FileText, available: false },
];

export function WorkspaceHeader({ userName }: WorkspaceHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentWorkspace, setCurrentWorkspace, user } = useAuth();
  
  const currentWs = workspaces.find(w => w.id === currentWorkspace) || workspaces[0];
  const CurrentIcon = currentWs.icon;

  const handleSelect = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (ws?.available) {
      setCurrentWorkspace(wsId);
    }
    setIsOpen(false);
  };

  return (
    <header className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
      {/* Workspace Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <CurrentIcon className="w-4 h-4 text-amber-600" />
          <span className="font-medium text-gray-900">{currentWs.name} Workspace</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Workspaces
              </div>
              {workspaces.map((ws) => {
                const Icon = ws.icon;
                const hasAccess = user?.workspaces.includes(ws.id);
                return (
                  <button
                    key={ws.id}
                    onClick={() => handleSelect(ws.id)}
                    disabled={!ws.available || !hasAccess}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                      ws.id === currentWorkspace
                        ? 'bg-amber-50 text-amber-700'
                        : ws.available && hasAccess
                        ? 'hover:bg-gray-50 text-gray-700'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${
                      ws.id === currentWorkspace ? 'text-amber-600' : 'text-gray-400'
                    }`} />
                    <span className="flex-1">{ws.name}</span>
                    {!ws.available && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {ws.available && !hasAccess && (
                      <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                        No Access
                      </span>
                    )}
                    {ws.id === currentWorkspace && (
                      <span className="text-amber-600">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Right side - User greeting */}
      <div className="text-sm text-gray-500">
        Welcome back, <span className="font-medium text-gray-900">{userName}</span>
      </div>
    </header>
  );
}
