import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getDealerOrganizations, createOrganization, updateOrganization, deleteOrganization } from '../../utils/api'

const emptyForm = { name: '' }

export default function DealerOrganizations() {
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchOrgs()
  }, [])

  const fetchOrgs = async () => {
    setLoading(true)
    try {
      const res = await getDealerOrganizations()
      setOrgs(Array.isArray(res.data) ? res.data : [])
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

  const openEdit = (org) => {
    setEditing(org)
    setForm({ name: org.name || '' })
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
    if (!form.name.trim()) errs.name = 'Organization name is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateOrganization(editing.id, form)
        toast.success('Organization updated.')
      } else {
        await createOrganization(form)
        toast.success('Organization created.')
      }
      closeModal()
      fetchOrgs()
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
      await deleteOrganization(confirmDelete.id)
      toast.success('Organization deleted.')
      setOrgs((prev) => prev.filter((o) => o.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Organization Name' },
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
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Delete"
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
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <Building2 size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Organizations</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus size={16} />
          Add Organization
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={orgs}
          loading={loading}
          emptyMessage="No organizations yet. Create your first one."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Organization' : 'Create Organization'}
          onClose={closeModal}
          size="sm"
          footer={
            <>
              <button onClick={closeModal} className="btn-secondary btn-sm" disabled={submitting}>Cancel</button>
              <button onClick={handleSubmit} className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editing ? 'Save Changes' : 'Create'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate>
            <label className="form-label">Organization Name</label>
            <input
              type="text"
              className={`form-input ${errors.name ? 'border-red-400' : ''}`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Acme Corp"
              autoFocus
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Organization"
          message={`Are you sure you want to delete "${confirmDelete.name}"? All associated data will be lost.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
