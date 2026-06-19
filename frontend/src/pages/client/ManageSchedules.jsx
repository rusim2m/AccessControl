import React, { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule } from '../../utils/api'

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
]

const emptyForm = {
  name: '',
  timeFrom: '08:00',
  timeTo: '18:00',
  daysOfWeek: [],
}

const dayPillColors = {
  monday:    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  tuesday:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  wednesday: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  thursday:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  friday:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  saturday:  'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  sunday:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const dayAbbreviation = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}

const fullDayName = {
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
  sun: 'sunday',
  monday: 'monday',
  tuesday: 'tuesday',
  wednesday: 'wednesday',
  thursday: 'thursday',
  friday: 'friday',
  saturday: 'saturday',
  sunday: 'sunday',
}

function normalizeDays(raw) {
  if (!raw) return []
  const parts = Array.isArray(raw) ? raw : raw.toString().split(',')
  return parts
    .map((d) => d.toString().trim().toLowerCase())
    .map((d) => fullDayName[d])
    .filter(Boolean)
}

function formatDaysForApi(days) {
  return days.map((d) => dayAbbreviation[d.toLowerCase()] || d).join(',')
}

export default function ManageSchedules() {
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
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const res = await getSchedules()
      setSchedules(Array.isArray(res.data) ? res.data : [])
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

  const openEdit = (sched) => {
    setEditing(sched)
    setForm({
      name: sched.name || '',
      timeFrom: sched.timeFrom || sched.startTime || '08:00',
      timeTo: sched.timeTo || sched.endTime || '18:00',
      daysOfWeek: normalizeDays(sched.daysOfWeek),
    })
    setErrors({})
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setErrors({})
  }

  const toggleDay = (day) => {
    setForm((p) => ({
      ...p,
      daysOfWeek: p.daysOfWeek.includes(day)
        ? p.daysOfWeek.filter((d) => d !== day)
        : [...p.daysOfWeek, day],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Schedule name is required'
    if (!form.timeFrom) errs.timeFrom = 'Start time is required'
    if (!form.timeTo) errs.timeTo = 'End time is required'
    if (form.timeFrom && form.timeTo && form.timeFrom === form.timeTo)
      errs.timeTo = 'Start and end time cannot be identical'
    if (form.daysOfWeek.length === 0) errs.days = 'Select at least one day'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const payload = { ...form, daysOfWeek: formatDaysForApi(form.daysOfWeek) }
    try {
      if (editing) {
        await updateSchedule(editing.id, payload)
        toast.success('Schedule updated.')
      } else {
        await createSchedule(payload)
        toast.success('Schedule created.')
      }
      closeModal()
      fetchSchedules()
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
      await deleteSchedule(confirmDelete.id)
      toast.success('Schedule deleted.')
      setSchedules((prev) => prev.filter((s) => s.id !== confirmDelete.id))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete schedule.')
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'name', label: 'Schedule Name' },
    {
      key: 'daysOfWeek',
      label: 'Days',
      render: (v) => {
        const days = normalizeDays(v)
        if (!days.length) return <span className="text-gray-400 italic text-xs">No days</span>
        return (
          <div className="flex flex-wrap gap-1">
            {DAYS.filter((d) => days.includes(d.key)).map((d) => (
              <span
                key={d.key}
                className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${dayPillColors[d.key]}`}
              >
                {d.label}
              </span>
            ))}
          </div>
        )
      },
    },
    {
      key: 'timeFrom',
      label: 'Time Range',
      render: (v, row) => {
        const from = v || row.startTime || '—'
        const to = row.timeTo || row.endTime || '—'
        return (
          <span className="text-sm font-mono">
            {from} – {to}
          </span>
        )
      },
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
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Clock size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Schedules</h2>
          </div>
        </div>
        <button onClick={openCreate} className="btn-primary btn-sm">
          <Plus size={16} />
          Add Schedule
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={schedules}
          loading={loading}
          emptyMessage="No schedules defined. Create time windows for access control."
        />
      </div>

      {showModal && (
        <Modal
          title={editing ? 'Edit Schedule' : 'Create Schedule'}
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
                ) : editing ? 'Save Changes' : 'Create Schedule'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="form-label">Schedule Name</label>
              <input
                type="text"
                className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Business Hours, Night Shift..."
                autoFocus
              />
              {errors.name && <p className="form-error">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  className={`form-input ${errors.timeFrom ? 'border-red-400' : ''}`}
                  value={form.timeFrom}
                  onChange={(e) => setForm((p) => ({ ...p, timeFrom: e.target.value }))}
                />
                {errors.timeFrom && <p className="form-error">{errors.timeFrom}</p>}
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  className={`form-input ${errors.timeTo ? 'border-red-400' : ''}`}
                  value={form.timeTo}
                  onChange={(e) => setForm((p) => ({ ...p, timeTo: e.target.value }))}
                />
                {errors.timeTo && <p className="form-error">{errors.timeTo}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">
                Days of Week
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(choose at least one)</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {DAYS.map((day) => {
                  const active = form.daysOfWeek.includes(day.key)
                  return (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        active
                          ? `${dayPillColors[day.key]} border-current`
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
              {errors.days && <p className="form-error">{errors.days}</p>}
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Schedule"
          message={`Are you sure you want to delete "${confirmDelete.name}"? Access rules using this schedule may be affected.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
