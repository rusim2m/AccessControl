import React, { useState, useEffect } from 'react'
import { Cpu, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getClientReaders, assignReaderToZone, getZones } from '../../utils/api'

export default function ManageReaders() {
  const [readers, setReaders] = useState([])
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(null) // reader being assigned
  const [selectedZone, setSelectedZone] = useState('')
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [readersRes, zonesRes] = await Promise.all([getClientReaders(), getZones()])
      setReaders(Array.isArray(readersRes.data) ? readersRes.data : [])
      setZones(Array.isArray(zonesRes.data) ? zonesRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openAssign = (reader) => {
    setAssignModal(reader)
    setSelectedZone(reader.zoneId ? String(reader.zoneId) : '')
  }

  const handleAssignZone = async (e) => {
    e.preventDefault()
    setAssigning(true)
    try {
      await assignReaderToZone(assignModal.id, { zoneId: selectedZone ? Number(selectedZone) : null })
      toast.success(selectedZone ? 'Reader assigned to zone.' : 'Reader unassigned from zone.')
      setAssignModal(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update reader zone.')
    } finally {
      setAssigning(false)
    }
  }

  const columns = [
    { key: 'serialNumber', label: 'Serial', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    { key: 'name', label: 'Name', render: (v) => v || <span className="text-gray-400">—</span> },
    {
      key: 'zoneName',
      label: 'Zone',
      render: (v, row) => row.zoneId ? (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span>{v || '—'}</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-gray-400">
          <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
          <span className="italic text-xs">Unassigned</span>
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '160px',
      render: (_, row) => row.zoneId ? (
        <button
          onClick={() => openAssign(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <MapPin size={13} />
          Change Zone
        </button>
      ) : (
        <button
          onClick={() => openAssign(row)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          <MapPin size={13} />
          Assign Zone
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <Cpu size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Readers</h2>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={readers}
          loading={loading}
          emptyMessage="No readers available. Readers are added by your dealer."
        />
      </div>

      {/* Assign Zone Modal */}
      {assignModal && (
        <Modal
          title="Assign Reader to Zone"
          onClose={() => setAssignModal(null)}
          size="sm"
          footer={
            <>
              <button onClick={() => setAssignModal(null)} className="btn-secondary btn-sm" disabled={assigning}>
                Cancel
              </button>
              <button onClick={handleAssignZone} className="btn-primary btn-sm" disabled={assigning}>
                {assigning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : 'Save'}
              </button>
            </>
          }
        >
          <form onSubmit={handleAssignZone} noValidate className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Reader: </span>
              <span className="font-medium text-gray-900 dark:text-white">{assignModal.name}</span>
            </div>
            <div>
              <label className="form-label">Zone</label>
              <select
                className="form-input"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="">— Unassign from zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              {zones.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  No zones yet. Create zones first in the Zones section.
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
