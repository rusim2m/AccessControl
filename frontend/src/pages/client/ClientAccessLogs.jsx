import React, { useState, useEffect, useRef } from 'react'
import { FileText, RefreshCw, Filter } from 'lucide-react'
import { format } from 'date-fns'
import Badge from '../../components/Badge'
import { getClientAccessLogs } from '../../utils/api'

export default function ClientAccessLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    decision: '',
  })
  const intervalRef = useRef(null)

  useEffect(() => {
    fetchLogs()
  }, [filters])

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchLogs(), 30000)
    }
    return () => clearInterval(intervalRef.current)
  }, [autoRefresh, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filters.dateFrom) params.dateFrom = filters.dateFrom
      if (filters.dateTo) params.dateTo = filters.dateTo
      if (filters.decision) params.decision = filters.decision
      const res = await getClientAccessLogs(params)
      const data = res.data
      setLogs(Array.isArray(data) ? data : data.items || data.logs || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, val) => {
    setFilters((p) => ({ ...p, [key]: val }))
  }

  const clearFilters = () => {
    setFilters({ dateFrom: '', dateTo: '', decision: '' })
  }

  const decisionBadge = (decision) => {
    if (decision === 'Granted' || decision === true)
      return <Badge variant="success" label="Granted" />
    if (decision === 'Denied' || decision === false)
      return <Badge variant="danger" label="Denied" />
    return <Badge variant="default" label={String(decision || '—')} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <FileText size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Logs</h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchLogs} className="btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="form-label">Date From</label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Date To</label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Decision</label>
            <select
              className="form-input"
              value={filters.decision}
              onChange={(e) => handleFilterChange('decision', e.target.value)}
            >
              <option value="">All Decisions</option>
              <option value="Granted">Granted</option>
              <option value="Denied">Denied</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={clearFilters} className="btn-secondary btn-sm w-full justify-center">
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">Loading access logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400 dark:text-gray-500">
            No access events match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Card UID</th>
                  <th>Employee</th>
                  <th>Reader</th>
                  <th>Zone</th>
                  <th>Decision</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log, i) => (
                  <tr key={log.id || i}>
                    <td className="whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {log.timestamp ? format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss') : '—'}
                    </td>
                    <td className="font-mono text-xs">{log.cardUID || log.cardUid || '—'}</td>
                    <td className="text-sm">{log.employeeName || log.employee || '—'}</td>
                    <td className="text-sm">{log.readerName || log.reader || '—'}</td>
                    <td className="text-sm">{log.zoneName || log.zone || '—'}</td>
                    <td>{decisionBadge(log.decision)}</td>
                    <td className="text-xs text-gray-500 dark:text-gray-400 max-w-[180px] truncate">
                      {log.reason || log.denialReason || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
