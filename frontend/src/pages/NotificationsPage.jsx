import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { notificationApi } from '../services/api'
import './NotificationsPage.css'

const TYPE_ICON  = { BOOKING: '📅', TICKET: '🔧', COMMENT: '💬', SYSTEM: '📢' }
const TYPE_COLOR = { BOOKING: '#3D52A0', TICKET: '#7c3aed', COMMENT: '#0891b2', SYSTEM: '#d97706' }

const PREF_META = [
  { key: 'bookingApproved',    label: 'Booking Approved',      desc: 'When your booking request is approved' },
  { key: 'bookingRejected',    label: 'Booking Rejected',      desc: 'When your booking request is rejected' },
  { key: 'bookingCancelled',   label: 'Booking Cancelled',     desc: 'When a booking is cancelled' },
  { key: 'ticketStatusChange', label: 'Ticket Status Change',  desc: 'When your ticket status is updated' },
  { key: 'ticketComment',      label: 'New Comment',           desc: 'When someone comments on your ticket' },
  { key: 'ticketAssigned',     label: 'Ticket Assigned',       desc: 'When you are assigned to a ticket' },
]

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

export default function NotificationsPage() {
  const { user }  = useAuth()
  const { setUnreadCount } = useNotifications()

  const [tab, setTab]           = useState('all')
  const [notifications, setNotifications] = useState([])
  const [prefs, setPrefs]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [prefSaved, setPrefSaved] = useState(false)
  const [toast, setToast]       = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3800)
  }

  const load = useCallback(async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const data = await notificationApi.getAll(user.userId)
      setNotifications(data)
    } catch {
      showToast('Failed to load notifications.', 'error')
    } finally {
      setLoading(false)
    }
  }, [user?.userId])

  const loadPrefs = useCallback(async () => {
    if (!user?.userId) return
    try {
      const data = await notificationApi.getPreferences(user.userId)
      setPrefs(data)
    } catch {}
  }, [user?.userId])

  useEffect(() => { load(); loadPrefs() }, [load, loadPrefs])

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id, user.userId)
      setNotifications(prev => prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n))
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
  }

  const handleDelete = async (id) => {
    const wasUnread = !notifications.find(n => n.notificationId === id)?.isRead
    try {
      await notificationApi.deleteOne(id, user.userId)
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
      if (wasUnread) setUnreadCount(c => Math.max(0, c - 1))
    } catch { showToast('Failed to delete.', 'error') }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead(user.userId)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      showToast('All notifications marked as read.')
    } catch { showToast('Failed to mark all as read.', 'error') }
  }

  const handlePrefChange = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setPrefSaved(false)
  }

  const handleSavePrefs = async () => {
    try {
      await notificationApi.updatePreferences(prefs, user.userId)
      setPrefSaved(true)
      showToast('Preferences saved.')
      setTimeout(() => setPrefSaved(false), 3000)
    } catch { showToast('Failed to save preferences.', 'error') }
  }

  const unreadTotal = notifications.filter(n => !n.isRead).length
  const displayed   = tab === 'unread' ? notifications.filter(n => !n.isRead) : notifications

  return (
    <div className="notif-page">
      {/* Hero */}
      <div className="notif-hero">
        <div className="notif-hero-text">
          <h1>Notifications</h1>
          <p>{unreadTotal > 0 ? `${unreadTotal} unread notification${unreadTotal > 1 ? 's' : ''}` : 'You\'re all caught up!'}</p>
        </div>
      </div>

      <div className="notif-main">
        {/* Toolbar */}
        <div className="notif-toolbar">
          <div className="notif-tabs">
            {[
              { key: 'all',         label: `All (${notifications.length})` },
              { key: 'unread',      label: `Unread (${unreadTotal})` },
              { key: 'preferences', label: 'Preferences' },
            ].map(t => (
              <button
                key={t.key}
                className={`notif-tab ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {unreadTotal > 0 && tab !== 'preferences' && (
            <button className="notif-mark-all" onClick={handleMarkAllRead}>
              ✓ Mark all as read
            </button>
          )}
        </div>

        {/* Content */}
        {tab === 'preferences' ? (
          <PreferencesPanel
            prefs={prefs}
            saved={prefSaved}
            onChange={handlePrefChange}
            onSave={handleSavePrefs}
          />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Loading notifications…
          </div>
        ) : displayed.length === 0 ? (
          <div className="notif-empty">
            <div className="notif-empty-emoji">🔔</div>
            <h3>{tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notif-list">
            {displayed.map((n, i) => (
              <NotifCard
                key={n.notificationId}
                notif={n}
                delay={i * 0.04}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div
          className="notif-toast"
          style={{ background: toast.type === 'error' ? '#c62828' : toast.type === 'success' ? '#2d8653' : 'var(--clr-900)' }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}

function NotifCard({ notif, delay, onMarkRead, onDelete }) {
  const icon  = TYPE_ICON[notif.entityType]  || '🔔'

  return (
    <div
      className={`notif-card ${notif.isRead ? 'read' : 'unread'}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="notif-card-icon">{icon}</div>
      <div className="notif-card-body">
        <p className="notif-card-message">{notif.message}</p>
        <div className="notif-card-meta">
          {!notif.isRead && <span className="notif-unread-pill">New</span>}
          <span className="notif-card-time">{timeAgo(notif.createdAt)}</span>
        </div>
      </div>
      <div className="notif-card-actions">
        {!notif.isRead && (
          <button className="notif-action-btn" onClick={() => onMarkRead(notif.notificationId)}>
            Mark read
          </button>
        )}
        <button className="notif-action-btn del" onClick={() => onDelete(notif.notificationId)}>
          ✕
        </button>
      </div>
    </div>
  )
}

function PreferencesPanel({ prefs, saved, onChange, onSave }) {
  if (!prefs) return (
    <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
      Loading preferences…
    </div>
  )
  return (
    <div className="pref-panel">
      <div className="pref-panel-header">
        <h2>Notification Preferences</h2>
        <p>Choose which events you'd like to be notified about.</p>
      </div>
      <div className="pref-list">
        {PREF_META.map(({ key, label, desc }) => (
          <div className="pref-row" key={key}>
            <div className="pref-label-group">
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={prefs[key] ?? true}
                onChange={() => onChange(key)}
              />
              <span className="toggle-track" />
            </label>
          </div>
        ))}
      </div>
      <div className="pref-footer">
        <button className={`pref-save-btn ${saved ? 'saved' : ''}`} onClick={onSave}>
          {saved ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
