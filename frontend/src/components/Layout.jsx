import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'

export default function Layout({ navItems }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuth()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar
        navItems={navItems}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

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
