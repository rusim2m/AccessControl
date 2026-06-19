import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getCards } from '../../utils/api'

const emptyForm = { name: '' }

export default function ManageEmployees() {
  const [employees, setEmployees] = useState([])
  const [cards, setCards] = useState([])
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
      const [empRes, cardsRes] = await Promise.all([getEmployees(), getCards()])
      setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const getEmployeeCard = (employeeId) =>
    cards.find((c) => c.assignedToEmployeeId === employeeId)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setErrors({})
    setShowModal(true)
  }

  const openEdit = (emp) => {
    setEditing(emp)
    setForm({ name: emp.name || '' })
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
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateEmployee(editing.id, form)
        toast.success('Employee updated.')
      } else {
        await createEmployee(form)
        toast.success('Employee created.')
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
      await deleteEmployee(confirmDelete.id)
      toast.success('Employee deleted.')
      setEmployees((prev) => prev.filter((e) => e.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Name' },
    {
      key: 'id',
      label: 'Card Assigned',
      render: (id) => {
        const card = getEmployeeCard(id)
        return card ? (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="font-mono text-xs">{card.uid || card.cardUID}</span>
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 text-xs italic">Unassigned</span>
        )
      },
    },
    {
      key: 'createdAt',
      label: 'Created At',
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
          <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
            <Users size={20} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Employees</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus size={16} />
          Add Employee
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={employees}
          loading={loading}
          emptyMessage="No employees found. Add your first employee."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Employee' : 'Add Employee'}
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
                ) : editing ? 'Save Changes' : 'Add Employee'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate>
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
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Employee"
          message={`Are you sure you want to delete "${confirmDelete.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
