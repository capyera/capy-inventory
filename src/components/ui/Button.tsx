import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link' | 'default';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className, 
  children, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0f1419] disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-amber-500 text-[#0f1419] hover:bg-amber-400 focus:ring-amber-500 glow-sm",
    secondary: "bg-[#242b3d] text-[#e7e9ea] hover:bg-[#2f3847] focus:ring-[#3b4a5e]",
    outline: "border border-[#3b4a5e] bg-transparent text-[#e7e9ea] hover:bg-[#242b3d] hover:border-[#8b98a5] focus:ring-[#3b4a5e]",
    ghost: "text-[#e7e9ea] hover:bg-[#242b3d] focus:ring-[#3b4a5e]",
    danger: "bg-red-500 text-white hover:bg-red-400 focus:ring-red-500",
    link: "text-amber-400 hover:text-amber-300 underline-offset-4 hover:underline focus:ring-amber-500",
    default: "bg-amber-500 text-[#0f1419] hover:bg-amber-400 focus:ring-amber-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
