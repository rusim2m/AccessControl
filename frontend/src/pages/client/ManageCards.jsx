import React, { useState, useEffect } from 'react'
import { CreditCard, UserCheck, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { getCards, getEmployees, assignCard } from '../../utils/api'

export default function ManageCards() {
  const [cards, setCards] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [assignModal, setAssignModal] = useState(null) // card being assigned
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [assignError, setAssignError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [cardsRes, empRes] = await Promise.all([getCards(), getEmployees()])
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : [])
      setEmployees(Array.isArray(empRes.data) ? empRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const openAssign = (card) => {
    setAssignModal(card)
    setSelectedEmployee('')
    setAssignError('')
  }

  const openUnassign = async (card) => {
    setAssigning(true)
    try {
      await assignCard(card.id, null)
      toast.success('Card unassigned.')
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unassign card.')
    } finally {
      setAssigning(false)
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    if (!selectedEmployee) {
      setAssignError('Please select an employee.')
      return
    }
    setAssigning(true)
    try {
      await assignCard(assignModal.id, selectedEmployee)
      toast.success('Card assigned successfully.')
      setAssignModal(null)
      fetchData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign card.')
    } finally {
      setAssigning(false)
    }
  }

  const assignedEmployeeIds = new Set(
    cards
      .filter((c) => c.assignedToEmployeeId)
      .map((c) => String(c.assignedToEmployeeId))
  )
  const availableEmployees = employees.filter(
    (emp) => !assignedEmployeeIds.has(String(emp.id))
  )

  const columns = [
    {
      key: 'uid',
      label: 'Card UID',
      render: (v, row) => (
        <span className="font-mono text-xs">{v || row.cardUID || '—'}</span>
      ),
    },
    {
      key: 'assignedToEmployeeName',
      label: 'Assigned To',
      render: (v) => v ? (
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span>{v}</span>
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
      render: (_, row) => {
        const isAssigned = Boolean(row.assignedToEmployeeId)
        return isAssigned ? (
          <button
            onClick={() => openUnassign(row)}
            disabled={assigning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <UserX size={13} />
            Unassign
          </button>
        ) : (
          <button
            onClick={() => openAssign(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <UserCheck size={13} />
            Assign
          </button>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <CreditCard size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cards</h2>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          columns={columns}
          data={cards}
          loading={loading}
          emptyMessage="No cards available. Cards are added by your dealer."
        />
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <Modal
          title="Assign Card to Employee"
          onClose={() => setAssignModal(null)}
          size="sm"
          footer={
            <>
              <button onClick={() => setAssignModal(null)} className="btn-secondary btn-sm" disabled={assigning}>
                Cancel
              </button>
              <button onClick={handleAssign} className="btn-primary btn-sm" disabled={assigning}>
                {assigning ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assigning...
                  </span>
                ) : 'Assign Card'}
              </button>
            </>
          }
        >
          <form onSubmit={handleAssign} noValidate className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Card UID: </span>
              <span className="font-mono font-medium text-gray-900 dark:text-white">
                {assignModal.uid || assignModal.cardUID}
              </span>
            </div>
            <div>
              <label className="form-label">Select Employee</label>
              <select
                className={`form-input ${assignError ? 'border-red-400' : ''}`}
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value)
                  setAssignError('')
                }}
              >
                <option value="">— Choose an employee —</option>
                {availableEmployees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
              {assignError && <p className="form-error">{assignError}</p>}
              {availableEmployees.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  All employees already have cards assigned.
                </p>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
