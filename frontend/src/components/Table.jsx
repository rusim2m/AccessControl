import React from 'react'
import { Inbox, Loader2 } from 'lucide-react'

export default function Table({ columns, data, loading, emptyMessage = 'No data found', keyField = 'id' }) {
  if (loading) {
    return (
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <Loader2 className="animate-spin text-primary-500 mx-auto" size={28} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : {}}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
          {data && data.length > 0 ? (
            data.map((row, rowIndex) => (
              <tr key={row[keyField] || rowIndex}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center py-12">
                <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
                  <Inbox size={32} strokeWidth={1.5} />
                  <p className="text-sm">{emptyMessage}</p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
