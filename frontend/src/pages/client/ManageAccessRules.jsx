import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getAccessRules, createAccessRule, updateAccessRule, deleteAccessRule, getEmployees, getZones, getSchedules } from '../../utils/api'

const emptyForm = { employeeId: '', zoneId: '', scheduleId: '' }

export default function ManageAccessRules() {
  const [rules, setRules] = useState([])
  const [employees, setEmployees] = useState([])
  const [zones, setZones] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [rulesRes, empRes, zonesRes, schedsRes] = await Promise.all([
        getAccessRules(),
        getEmployees(),
        getZones(),
        getSchedules(),
      ])
      setRules(Array.isArray(rulesRes.data) ? rulesRes.data : [])
      setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
      setZones(Array.isArray(zonesRes.data) ? zonesRes.data : [])
      setSchedules(Array.isArray(schedsRes.data) ? schedsRes.data : [])
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

  const openEdit = (rule) => {
    setEditing(rule)
    setForm({
      employeeId: String(rule.employeeId),
      zoneId: String(rule.zoneId),
      scheduleId: String(rule.scheduleId),
    })
    setErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const errs = {}
    if (!form.employeeId) errs.employeeId = 'Employee is required'
    if (!form.zoneId) errs.zoneId = 'Zone is required'
    if (!form.scheduleId) errs.scheduleId = 'Schedule is required'

    const duplicate = rules.find(
      (r) =>
        String(r.employeeId) === String(form.employeeId) &&
        String(r.zoneId) === String(form.zoneId) &&
        String(r.scheduleId) === String(form.scheduleId) &&
        (!editing || r.id !== editing.id)
    )
    if (duplicate) errs.general = 'An access rule with this combination already exists.'

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      if (editing) {
        await updateAccessRule(editing.id, form)
        toast.success('Access rule updated.')
      } else {
        await createAccessRule(form)
        toast.success('Access rule created.')
      }
      setShowModal(false)
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create access rule.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await deleteAccessRule(confirmDelete.id)
      toast.success('Access rule deleted.')
      setRules((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const getName = (list, id) => list.find((item) => String(item.id) === String(id))?.name || '—'

  const columns = [
    {
      key: 'employeeId',
      label: 'Employee',
      render: (v, row) => row.employeeName || getName(employees, v),
    },
    {
      key: 'zoneId',
      label: 'Zone',
      render: (v, row) => row.zoneName || getName(zones, v),
    },
    {
      key: 'scheduleId',
      label: 'Schedule',
      render: (v, row) => row.scheduleName || getName(schedules, v),
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
            title="Edit rule"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={() => setConfirmDelete(row)}
            className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors"
            title="Delete rule"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ]

  const hasPrerequisites = employees.length > 0 && zones.length > 0 && schedules.length > 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <Shield size={20} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Rules</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm" disabled={!hasPrerequisites}>
          <Plus size={16} />
          Add Rule
        </button>
      </div>

      {!loading && !hasPrerequisites && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium">Prerequisites needed</p>
            <p className="text-amber-600 dark:text-amber-400 mt-0.5">
              You need at least one employee, one zone, and one schedule before creating access rules.
            </p>
          </div>
        </div>
      )}

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={rules}
          loading={loading}
          emptyMessage="No access rules configured. Define who can access which zones and when."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Access Rule' : 'Create Access Rule'}
          onClose={() => setShowModal(false)}
          size="md"
          footer={
            <>
              <button onClick={() => setShowModal(false)} className="btn-secondary btn-sm" disabled={submitting}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn-primary btn-sm" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : editing ? 'Save Changes' : 'Create Rule'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {errors.general && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                <AlertCircle size={15} />
                {errors.general}
              </div>
            )}

            <div>
              <label className="form-label">Employee</label>
              <select
                className={`form-input ${errors.employeeId ? 'border-red-400' : ''}`}
                value={form.employeeId}
                onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
              >
                <option value="">— Select Employee —</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {errors.employeeId && <p className="form-error">{errors.employeeId}</p>}
            </div>

            <div>
              <label className="form-label">Zone</label>
              <select
                className={`form-input ${errors.zoneId ? 'border-red-400' : ''}`}
                value={form.zoneId}
                onChange={(e) => setForm((p) => ({ ...p, zoneId: e.target.value }))}
              >
                <option value="">— Select Zone —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
              {errors.zoneId && <p className="form-error">{errors.zoneId}</p>}
            </div>

            <div>
              <label className="form-label">Schedule</label>
              <select
                className={`form-input ${errors.scheduleId ? 'border-red-400' : ''}`}
                value={form.scheduleId}
                onChange={(e) => setForm((p) => ({ ...p, scheduleId: e.target.value }))}
              >
                <option value="">— Select Schedule —</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.scheduleId && <p className="form-error">{errors.scheduleId}</p>}
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Access Rule"
          message="Are you sure you want to delete this access rule? The employee will lose access to the specified zone during the schedule."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
