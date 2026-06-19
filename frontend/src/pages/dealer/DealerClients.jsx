import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getDealerClients, createDealerClient, updateDealerClient, deleteDealerClient, getDealerOrganizations } from '../../utils/api'

const emptyForm = { name: '', email: '', password: '', organizationId: '' }

export default function DealerClients() {
  const [clients, setClients] = useState([])
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
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [clientsRes, orgsRes] = await Promise.all([getDealerClients(), getDealerOrganizations()])
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : [])
      setOrgs(Array.isArray(orgsRes.data) ? orgsRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, organizationId: orgs[0]?.id?.toString() || '' })
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (client) => {
    setEditing(client)
    setForm({ name: client.name || '', email: client.email || '', password: '', organizationId: client.organizationId || '' })
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
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!editing && !form.password) errs.password = 'Password is required'
    if (!editing && form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (!form.organizationId) errs.organizationId = 'Organization is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, organizationId: parseInt(form.organizationId) }
        if (form.password) payload.password = form.password
        await updateDealerClient(editing.id, payload)
        toast.success('Client updated.')
      } else {
        await createDealerClient({
          name: form.name,
          email: form.email,
          password: form.password,
          organizationId: parseInt(form.organizationId),
        })
        toast.success('Client created.')
      }
      closeModal()
      fetchData()
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
      await deleteDealerClient(confirmDelete.id)
      toast.success('Client deleted.')
      setClients((prev) => prev.filter((c) => c.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete client.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const orgName = (id) => orgs.find((o) => o.id === id)?.name || '—'

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'organizationId',
      label: 'Organization',
      render: (v) => orgName(v),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (v) => v ? format(new Date(v), 'MMM d, yyyy') : '—',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 rounded text-gray-400 hover:text-primary-600 hover:bg-gray-100 transition-colors"
            title="Edit"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
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
        <h2 className="text-base font-semibold text-gray-900">{clients.length} client(s)</h2>
        <button onClick={openCreate} className="btn-primary btn-sm" disabled={orgs.length === 0}>
          <Plus size={15} />
          Add Client
        </button>
      </div>

      {orgs.length === 0 && !loading && (
        <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-700">
          You need at least one organization before creating clients.
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={clients}
          loading={loading}
          emptyMessage="No clients yet. Add your first client."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Client' : 'Create Client'}
          onClose={closeModal}
          size="md"
          footer={
            <>
              <button onClick={closeModal} className="btn-secondary btn-sm" disabled={submitting}>Cancel</button>
              <button onClick={handleSubmit} className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Client'}
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
                placeholder="Jane Smith"
                autoFocus
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
                placeholder="client@example.com"
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>
            <div>
              <label className="form-label">
                Password {editing && <span className="text-gray-400 font-normal">(leave blank to keep current)</span>}
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
            <div>
              <label className="form-label">Organization</label>
              <select
                className={`form-input ${errors.organizationId ? 'border-red-400' : ''}`}
                value={form.organizationId}
                onChange={(e) => setForm((p) => ({ ...p, organizationId: e.target.value }))}
              >
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
              </select>
              {errors.organizationId && <p className="form-error">{errors.organizationId}</p>}
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Client"
          message={`Are you sure you want to delete "${confirmDelete.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
