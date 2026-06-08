import { Bell, Search, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-16 bg-dark-900/50 backdrop-blur-xl border-b border-dark-700/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-white">持续集成平台</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="搜索项目、构建..."
            className="w-full pl-10 pr-4 py-2 bg-dark-800/50 border border-dark-700 rounded-lg text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-800 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
        </button>

        <div className="flex items-center gap-3 pl-4 border-l border-dark-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-white">张明</p>
            <p className="text-xs text-dark-400">前端工程师</p>
          </div>
        </div>
      </div>
    </header>
  );
}
