import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#e7e9ea] mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b98a5]">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full px-3 py-2 bg-[#242b3d] border border-[#3b4a5e] rounded-lg text-sm text-[#e7e9ea]",
            "focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500",
            "placeholder:text-[#8b98a5]",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}

export function SearchInput(props: Omit<InputProps, 'icon'>) {
  return (
    <Input
      icon={<Search className="w-4 h-4" />}
      placeholder="Search..."
      {...props}
    />
  );
}
