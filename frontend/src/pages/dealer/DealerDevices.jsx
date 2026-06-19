import React, { useState, useEffect } from 'react'
import { Plus, Cpu, CreditCard, Send, Download, Radio } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import Badge from '../../components/Badge'
import { getDealerReaders, assignReaderToOrganization, downloadReaderConfig, getDealerCards, createDealerCard, provisionDealerCard, getDealerOrganizations } from '../../utils/api'

const emptyCardForm = { uid: '', organizationId: '' }

export default function DealerDevices() {
  const [activeTab, setActiveTab] = useState('readers')
  const [readers, setReaders] = useState([])
  const [cards, setCards] = useState([])
  const [orgs, setOrgs] = useState([])
  const [loadingReaders, setLoadingReaders] = useState(true)
  const [loadingCards, setLoadingCards] = useState(true)

  // Reader assign modal
  const [assigningReader, setAssigningReader] = useState(null)
  const [assignForm, setAssignForm] = useState({ organizationId: '', name: '' })
  const [submittingAssign, setSubmittingAssign] = useState(false)

  // Card modal
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardForm, setCardForm] = useState(emptyCardForm)
  const [cardErrors, setCardErrors] = useState({})
  const [submittingCard, setSubmittingCard] = useState(false)

  // Provisioning (tap to register) state
  const [showProvisionModal, setShowProvisionModal] = useState(false)
  const [provisionOrgId, setProvisionOrgId] = useState('')
  const [provisioning, setProvisioning] = useState(false)
  const [provisionError, setProvisionError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoadingReaders(true)
    setLoadingCards(true)
    try {
      const [readersRes, cardsRes, orgsRes] = await Promise.all([
        getDealerReaders(),
        getDealerCards(),
        getDealerOrganizations(),
      ])
      setReaders(Array.isArray(readersRes.data) ? readersRes.data : [])
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : [])
      setOrgs(Array.isArray(orgsRes.data) ? orgsRes.data : [])
    } catch {
      // ignore
    } finally {
      setLoadingReaders(false)
      setLoadingCards(false)
    }
  }

  const openAssign = (reader) => {
    setAssigningReader(reader)
    setAssignForm({ organizationId: '', name: reader.name || '' })
  }

  const handleAssignToOrg = async () => {
    if (!assignForm.organizationId) {
      toast.error('Please select an organization.')
      return
    }
    setSubmittingAssign(true)
    try {
      await assignReaderToOrganization(assigningReader.id, {
        organizationId: Number(assignForm.organizationId),
        name: assignForm.name.trim(),
      })
      toast.success('Device deployed to organization.')
      setAssigningReader(null)
      const res = await getDealerReaders()
      setReaders(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deploy device.')
    } finally {
      setSubmittingAssign(false)
    }
  }

  const handleDownloadConfig = async (reader) => {
    try {
      const res = await downloadReaderConfig(reader.id)
      const blob = new Blob([res.data], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bridge.${reader.serialNumber}.config.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Configuration downloaded.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to download configuration.')
    }
  }

  const validateCard = () => {
    const errs = {}
    if (!cardForm.uid.trim()) errs.uid = 'Card UID is required'
    if (!cardForm.organizationId) errs.organizationId = 'Organization is required'
    setCardErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleCreateCard = async (e) => {
    e.preventDefault()
    if (!validateCard()) return
    setSubmittingCard(true)
    try {
      await createDealerCard(cardForm)
      toast.success('Card created.')
      setShowCardModal(false)
      setCardForm(emptyCardForm)
      const res = await getDealerCards()
      setCards(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create card.')
    } finally {
      setSubmittingCard(false)
    }
  }

  const openProvision = () => {
    setProvisionOrgId('')
    setProvisionError('')
    setShowProvisionModal(true)
  }

  const handleProvision = async () => {
    if (!provisionOrgId) {
      setProvisionError('Please select an organization.')
      return
    }
    setProvisionError('')
    setProvisioning(true)
    try {
      const res = await provisionDealerCard({ organizationId: Number(provisionOrgId) })
      toast.success(`Card ${res.data.uid} registered.`)
      setShowProvisionModal(false)
      const cardsRes = await getDealerCards()
      setCards(Array.isArray(cardsRes.data) ? cardsRes.data : [])
    } catch (err) {
      setProvisionError(err.response?.data?.message || 'Provisioning failed.')
    } finally {
      setProvisioning(false)
    }
  }

  const renderStatus = (row) => {
    if (row.organizationId) return <Badge variant="success" label="Deployed" />
    return <Badge variant="warning" label="Awaiting Deployment" />
  }

  const readerColumns = [
    { key: 'serialNumber', label: 'Serial', render: (v) => <span className="font-mono text-xs">{v}</span> },
    { key: 'name', label: 'Name', render: (v) => v || <span className="text-gray-400">—</span> },
    { key: 'status', label: 'Status', render: (_, row) => renderStatus(row) },
    {
      key: 'organizationName',
      label: 'Organization',
      render: (v) => v || <span className="text-gray-400">—</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) =>
        !row.organizationId ? (
          <button
            onClick={() => openAssign(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30"
          >
            <Send size={14} />
            Deploy to Organization
          </button>
        ) : (
          <button
            onClick={() => handleDownloadConfig(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          >
            <Download size={14} />
            Download Configuration
          </button>
        ),
    },
  ]

  const cardColumns = [
    { key: 'uid', label: 'Card UID', render: (v) => <span className="font-mono text-xs">{v || '—'}</span> },
    {
      key: 'organizationName',
      label: 'Organization',
      render: (v, row) => v || orgs.find((o) => o.id === row.organizationId)?.name || '—',
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20">
          <Cpu size={20} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Devices</h2>
        </div>
      </div>

      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg w-fit">
        {[
          { key: 'readers', label: 'Readers', icon: Cpu, count: readers.length },
          { key: 'cards', label: 'Cards', icon: CreditCard, count: cards.length },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeTab === tab.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
              }`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'readers' && (
        <div className="card p-0 overflow-hidden">
          <Table
            columns={readerColumns}
            data={readers}
            loading={loadingReaders}
            emptyMessage="No devices assigned to you yet. The platform administrator must migrate a device to your dealer account first."
          />
        </div>
      )}

      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button onClick={openProvision} className="btn-primary btn-sm">
              <Radio size={16} />
              Provision via Reader
            </button>
            <button onClick={() => { setShowCardModal(true); setCardErrors({}) }} className="btn-secondary btn-sm">
              <Plus size={16} />
              Add Manually
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <Table
              columns={cardColumns}
              data={cards}
              loading={loadingCards}
              emptyMessage="No cards registered yet."
            />
          </div>
        </div>
      )}

      {assigningReader && (
        <Modal
          title={`Deploy ${assigningReader.serialNumber}`}
          onClose={() => setAssigningReader(null)}
          size="md"
          footer={
            <>
              <button onClick={() => setAssigningReader(null)} className="btn-secondary btn-sm" disabled={submittingAssign}>Cancel</button>
              <button onClick={handleAssignToOrg} className="btn-primary btn-sm" disabled={submittingAssign}>
                {submittingAssign ? 'Deploying...' : 'Deploy'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Once deployed, the device will appear in the client's organization view and can be assigned to a zone.
            </p>
            <div>
              <label className="form-label">Device Name (optional)</label>
              <input
                type="text"
                className="form-input"
                value={assignForm.name}
                onChange={(e) => setAssignForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Main Entrance Reader"
              />
            </div>
            <div>
              <label className="form-label">Organization</label>
              <select
                className="form-input"
                value={assignForm.organizationId}
                onChange={(e) => setAssignForm((p) => ({ ...p, organizationId: e.target.value }))}
              >
                <option value="">— Select Organization —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {showCardModal && (
        <Modal
          title="Add Card"
          onClose={() => setShowCardModal(false)}
          size="md"
          footer={
            <>
              <button onClick={() => setShowCardModal(false)} className="btn-secondary btn-sm" disabled={submittingCard}>Cancel</button>
              <button onClick={handleCreateCard} className="btn-primary btn-sm" disabled={submittingCard}>
                {submittingCard ? 'Saving...' : 'Add Card'}
              </button>
            </>
          }
        >
          <form onSubmit={handleCreateCard} noValidate className="space-y-4">
            <div>
              <label className="form-label">Card UID</label>
              <input
                type="text"
                className={`form-input font-mono ${cardErrors.uid ? 'border-red-400' : ''}`}
                value={cardForm.uid}
                onChange={(e) => setCardForm((p) => ({ ...p, uid: e.target.value }))}
                placeholder="e.g. A1B2C3D4"
              />
              {cardErrors.uid && <p className="form-error">{cardErrors.uid}</p>}
            </div>
            <div>
              <label className="form-label">Organization</label>
              <select
                className={`form-input ${cardErrors.organizationId ? 'border-red-400' : ''}`}
                value={cardForm.organizationId}
                onChange={(e) => setCardForm((p) => ({ ...p, organizationId: e.target.value }))}
              >
                <option value="">— Select Organization —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {cardErrors.organizationId && <p className="form-error">{cardErrors.organizationId}</p>}
            </div>
          </form>
        </Modal>
      )}

      {showProvisionModal && (
        <Modal
          title="Provision Card via Reader"
          onClose={() => !provisioning && setShowProvisionModal(false)}
          size="md"
          footer={
            <>
              <button onClick={() => setShowProvisionModal(false)} className="btn-secondary btn-sm" disabled={provisioning}>Cancel</button>
              <button onClick={handleProvision} className="btn-primary btn-sm" disabled={provisioning || !provisionOrgId}>
                {provisioning ? 'Waiting for tap...' : 'Start'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose an organization and click <strong>Start</strong>. You then have 30 seconds to tap a card on the reader connected to this PC.
            </p>
            <div>
              <label className="form-label">Organization</label>
              <select
                className="form-input"
                value={provisionOrgId}
                onChange={(e) => setProvisionOrgId(e.target.value)}
                disabled={provisioning}
              >
                <option value="">— Select Organization —</option>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            {provisioning && (
              <div className="flex items-center gap-2 p-3 rounded bg-primary-50 dark:bg-primary-900/20 text-sm text-primary-700 dark:text-primary-300">
                <Radio size={16} className="animate-pulse" />
                Waiting for a card tap on the reader...
              </div>
            )}
            {provisionError && <p className="form-error">{provisionError}</p>}
          </div>
        </Modal>
      )}
    </div>
  )
}
