import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ navItems }) {
  const { logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <aside className="w-60 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
          <ShieldCheck size={18} className="text-primary-600" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">AccessControl</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors duration-100 ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'} />
                    {item.label}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <button
          onClick={logout}
          className="absolute top-3 right-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-100"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <main className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4 pt-14 lg:px-6 lg:pb-6 lg:pt-14">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
