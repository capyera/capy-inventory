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
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm",
            "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent",
            "placeholder:text-gray-400",
            icon && "pl-10",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
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
