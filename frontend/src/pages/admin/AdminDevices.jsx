import React, { useState, useEffect } from 'react'
import { Plus, Cpu, Send } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import { getAdminDevices, manufactureDevice, assignDeviceToDealer, getDealers } from '../../utils/api'

export default function AdminDevices() {
  const [devices, setDevices] = useState([])
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [manufacturing, setManufacturing] = useState(false)
  const [assigning, setAssigning] = useState(null) // device object being assigned
  const [selectedDealer, setSelectedDealer] = useState('')
  const [submittingAssign, setSubmittingAssign] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [devicesRes, dealersRes] = await Promise.all([getAdminDevices(), getDealers()])
      setDevices(Array.isArray(devicesRes.data) ? devicesRes.data : [])
      setDealers(Array.isArray(dealersRes.data) ? dealersRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleManufacture = async () => {
    setManufacturing(true)
    try {
      await manufactureDevice()
      toast.success('Device manufactured.')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to manufacture device.')
    } finally {
      setManufacturing(false)
    }
  }

  const handleAssignDealer = async () => {
    if (!selectedDealer) return
    setSubmittingAssign(true)
    try {
      await assignDeviceToDealer(assigning.id, { dealerId: Number(selectedDealer) })
      toast.success('Device assigned to dealer.')
      setAssigning(null)
      setSelectedDealer('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign device.')
    } finally {
      setSubmittingAssign(false)
    }
  }

  const renderStatus = (row) => {
    if (row.organizationId) return 'Deployed'
    if (row.dealerId) return 'With Dealer'
    return 'In Inventory'
  }

  const columns = [
    { key: 'serialNumber', label: 'Serial Number', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'status', label: 'Status', render: (_, row) => renderStatus(row) },
    { key: 'dealerName', label: 'Dealer', render: (v) => v || <span className="text-gray-400">—</span> },
    { key: 'organizationName', label: 'Organization', render: (v) => v || <span className="text-gray-400">—</span> },
    {
      key: 'createdAt',
      label: 'Manufactured',
      render: (v) => v ? format(new Date(v), 'MMM d, HH:mm') : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) =>
        !row.dealerId ? (
          <button
            onClick={() => { setAssigning(row); setSelectedDealer('') }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
          >
            <Send size={14} />
            Migrate to Dealer
          </button>
        ) : <span className="text-gray-400 text-xs">—</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <Cpu size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Device Inventory</h2>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleManufacture} disabled={manufacturing} className="btn-primary btn-sm">
          <Plus size={16} />
          {manufacturing ? 'Manufacturing...' : 'Manufacture New Device'}
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={devices}
          loading={loading}
          emptyMessage="No devices manufactured yet."
        />
      </div>

      {assigning && (
        <Modal
          title={`Migrate ${assigning.serialNumber} to Dealer`}
          onClose={() => setAssigning(null)}
          size="md"
          footer={
            <>
              <button onClick={() => setAssigning(null)} className="btn-secondary btn-sm" disabled={submittingAssign}>Cancel</button>
              <button onClick={handleAssignDealer} className="btn-primary btn-sm" disabled={submittingAssign || !selectedDealer}>
                {submittingAssign ? 'Assigning...' : 'Assign'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The selected dealer will receive ownership of this device and can then deploy it to one of their client organizations.
            </p>
            <div>
              <label className="form-label">Dealer</label>
              <select
                className="form-input"
                value={selectedDealer}
                onChange={(e) => setSelectedDealer(e.target.value)}
              >
                <option value="">— Select Dealer —</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name} ({d.email})</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
