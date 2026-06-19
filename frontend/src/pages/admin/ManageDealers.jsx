import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getDealers, createDealer, updateDealer, deleteDealer } from '../../utils/api'

const emptyForm = { name: '', email: '', password: '' }

export default function ManageDealers() {
  const [dealers, setDealers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDealer, setEditingDealer] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchDealers()
  }, [])

  const fetchDealers = async () => {
    setLoading(true)
    try {
      const res = await getDealers()
      setDealers(Array.isArray(res.data) ? res.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditingDealer(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (dealer) => {
    setEditingDealer(dealer)
    setForm({ name: dealer.name || '', email: dealer.email || '', password: '' })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDealer(null)
    setForm(emptyForm)
    setErrors({})
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!editingDealer && !form.password) errs.password = 'Password is required'
    if (!editingDealer && form.password && form.password.length < 6)
      errs.password = 'Password must be at least 6 characters'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editingDealer) {
        const payload = { name: form.name, email: form.email }
        if (form.password) payload.password = form.password
        await updateDealer(editingDealer.id, payload)
        toast.success('Dealer updated successfully.')
      } else {
        await createDealer(form)
        toast.success('Dealer created successfully.')
      }
      closeModal()
      fetchDealers()
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed. Please try again.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await deleteDealer(confirmDelete.id)
      toast.success('Dealer deleted.')
      setDealers((prev) => prev.filter((d) => d.id !== confirmDelete.id))
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete dealer.'
      toast.error(msg)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'createdAt',
      label: 'Created At',
      render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '—',
    },
    {
      key: 'organizationCount',
      label: '# Organizations',
      render: (v) => v ?? 0,
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '120px',
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
            <UserCog size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Manage Dealers</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus size={16} />
          Add Dealer
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={dealers}
          loading={loading}
          emptyMessage="No dealers found. Create your first dealer."
        />
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <Modal
          title={editingDealer ? 'Edit Dealer' : 'Create Dealer'}
          onClose={closeModal}
          size="md"
          footer={
            <>
              <button onClick={closeModal} className="btn-secondary btn-sm" disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </span>
                ) : editingDealer ? 'Save Changes' : 'Create Dealer'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Dealer"
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>
            <div>
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className={`form-input ${errors.email ? 'border-red-400' : ''}`}
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="dealer@example.com"
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div>
              <label className="form-label">
                Password {editingDealer && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
              </label>
              <input
                type="password"
                className={`form-input ${errors.password ? 'border-red-400' : ''}`}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Dealer"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deletingId === confirmDelete.id}
        />
      )}
    </div>
  )
}
