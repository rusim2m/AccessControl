import React from 'react'

export default function StatsCard({ icon: Icon, title, value, loading = false }) {
  if (loading) {
    return (
      <div className="card p-4">
        <div className="skeleton w-16 h-7 rounded mb-1" />
        <div className="skeleton w-24 h-4 rounded" />
      </div>
    )
  }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {value !== undefined && value !== null ? value.toLocaleString() : '—'}
        </p>
        {Icon && <Icon size={18} className="text-gray-400 dark:text-gray-500" />}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
    </div>
  )
}
