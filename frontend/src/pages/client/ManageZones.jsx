import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getZones, createZone, updateZone, deleteZone } from '../../utils/api'

const emptyForm = { name: '' }

export default function ManageZones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchZones()
  }, [])

  const fetchZones = async () => {
    setLoading(true)
    try {
      const res = await getZones()
      setZones(Array.isArray(res.data) ? res.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (zone) => {
    setEditing(zone)
    setForm({ name: zone.name || '' })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setErrors({})
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Zone name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateZone(editing.id, form)
        toast.success('Zone updated.')
      } else {
        await createZone(form)
        toast.success('Zone created.')
      }
      closeModal()
      fetchZones()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteZone(confirmDelete.id)
      toast.success('Zone deleted.')
      setZones((prev) => prev.filter((z) => z.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete zone.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Zone Name' },
    {
      key: 'readerCount',
      label: 'Readers',
      render: (v) => v ?? 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <MapPin size={20} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Zones</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus size={16} />
          Add Zone
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={zones}
          loading={loading}
          emptyMessage="No zones configured. Create your first zone."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Zone' : 'Create Zone'}
          onClose={closeModal}
          size="md"
          footer={
            <>
              <button onClick={closeModal} className="btn-secondary btn-sm" disabled={submitting}>Cancel</button>
              <button onClick={handleSubmit} className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editing ? 'Save Changes' : 'Create Zone'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Zone Name</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Main Entrance, Server Room, etc."
                autoFocus
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Zone"
          message={`Are you sure you want to delete "${confirmDelete.name}"? Access rules for this zone will also be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
