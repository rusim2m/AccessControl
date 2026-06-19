import React, { useState, useEffect } from 'react'
import { Building2, Search } from 'lucide-react'
import { format } from 'date-fns'
import Table from '../../components/Table'
import { getAdminOrganizations, getDealers } from '../../utils/api'

export default function ManageOrganizations() {
  const [organizations, setOrganizations] = useState([])
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDealer, setFilterDealer] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orgsRes, dealersRes] = await Promise.all([
        getAdminOrganizations(),
        getDealers(),
      ])
      setOrganizations(Array.isArray(orgsRes.data) ? orgsRes.data : [])
      setDealers(Array.isArray(dealersRes.data) ? dealersRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const filtered = organizations.filter((org) => {
    const matchSearch = search
      ? org.name?.toLowerCase().includes(search.toLowerCase())
      : true
    const matchDealer = filterDealer
      ? String(org.dealerId) === filterDealer || org.dealerName === filterDealer
      : true
    return matchSearch && matchDealer
  })

  const columns = [
    { key: 'name', label: 'Organization Name' },
    {
      key: 'dealerName',
      label: 'Dealer',
      render: (v, row) => v || dealers.find((d) => d.id === row.dealerId)?.name || '—',
    },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '—',
    },
    {
      key: 'cardCount',
      label: 'Cards',
      render: (v) => v ?? 0,
    },
    {
      key: 'readerCount',
      label: 'Readers',
      render: (v) => v ?? 0,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <Building2 size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">All Organizations</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <select
          value={filterDealer}
          onChange={(e) => setFilterDealer(e.target.value)}
          className="form-input w-full sm:w-52"
        >
          <option value="">All Dealers</option>
          {dealers.map((d) => (
            <option key={d.id} value={String(d.id)}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No organizations found."
        />
      </div>
    </div>
  )
}
