import { cn } from '@/lib/utils';
import { useState, type ReactNode } from 'react';

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, activeTab, onChange, className }: TabsProps) {
  const [internalTab, setInternalTab] = useState(defaultTab || tabs[0]?.key);
  const current = activeTab || internalTab;

  const handleTabClick = (key: string) => {
    if (activeTab === undefined) {
      setInternalTab(key);
    }
    onChange?.(key);
  };

  return (
    <div className={cn('flex gap-1 bg-dark-800/50 p-1 rounded-lg', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
            current === tab.key
              ? 'bg-dark-700 text-white shadow-sm'
              : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
          )}
        >
          {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
