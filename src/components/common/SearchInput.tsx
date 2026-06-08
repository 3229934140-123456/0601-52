import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = '搜索...', className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-10 pr-4 py-2 bg-dark-700/50 border border-dark-600 rounded-lg',
          'text-dark-100 placeholder-dark-500',
          'focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50',
          'transition-all duration-200'
        )}
      />
    </div>
  );
}
