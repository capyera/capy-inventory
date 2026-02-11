import { ChevronDown, Package, FileText, Palette, Users, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface WorkspaceHeaderProps {
  userName: string;
}

const workspaces = [
  { id: 'operations', name: 'Operations', icon: Package, available: true, url: null },
  { id: 'content', name: 'Content', icon: FileText, available: true, url: 'https://capy-content-dashboard-production.up.railway.app' },
  { id: 'creative', name: 'Creative', icon: Palette, available: false, url: null },
  { id: 'influencer', name: 'Influencer', icon: Users, available: false, url: null },
];

export function WorkspaceHeader({ userName }: WorkspaceHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { currentWorkspace, setCurrentWorkspace, user } = useAuth();
  
  const currentWs = workspaces.find(w => w.id === currentWorkspace) || workspaces[0];
  const CurrentIcon = currentWs.icon;

  const handleSelect = (wsId: string) => {
    const ws = workspaces.find(w => w.id === wsId);
    if (ws?.available) {
      // External workspace - open in new tab
      if (ws.url) {
        window.open(ws.url, '_blank');
        setIsOpen(false);
        return;
      }
      setCurrentWorkspace(wsId);
    }
    setIsOpen(false);
  };

  return (
    <header className="h-14 bg-[#1a1f2e] border-b border-[#2f3847] px-6 flex items-center justify-between shrink-0">
      {/* Workspace Selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#242b3d] transition-colors"
        >
          <CurrentIcon className="w-4 h-4 text-amber-400" />
          <span className="font-medium text-white">{currentWs.name} Workspace</span>
          <ChevronDown className="w-4 h-4 text-[#8b98a5]" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 mt-1 w-56 bg-[#242b3d] rounded-lg shadow-xl border border-[#2f3847] py-1 z-20">
              <div className="px-3 py-2 text-xs font-medium text-[#8b98a5] uppercase tracking-wider">
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
                        ? 'bg-amber-500/20 text-amber-400'
                        : ws.available && hasAccess
                        ? 'hover:bg-[#2f3847] text-[#e7e9ea]'
                        : 'text-[#8b98a5] cursor-not-allowed opacity-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${
                      ws.id === currentWorkspace ? 'text-amber-400' : 'text-[#8b98a5]'
                    }`} />
                    <span className="flex-1">{ws.name}</span>
                    {ws.url && ws.available && (
                      <ExternalLink className="w-3 h-3 text-[#8b98a5]" />
                    )}
                    {!ws.available && (
                      <span className="text-xs bg-[#2f3847] text-[#8b98a5] px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    )}
                    {ws.available && !hasAccess && !ws.url && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        No Access
                      </span>
                    )}
                    {ws.id === currentWorkspace && !ws.url && (
                      <span className="text-amber-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Right side - User greeting */}
      <div className="text-sm text-[#8b98a5]">
        Welcome back, <span className="font-medium text-white">{userName}</span>
      </div>
    </header>
  );
}
