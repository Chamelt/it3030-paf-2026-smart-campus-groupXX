import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { notificationApi } from '../services/api'
import './NotificationsPage.css'

const TYPE_ICON = { BOOKING: '📅', TICKET: '🔧', COMMENT: '💬', SYSTEM: '📢' }

const PREF_META = [
  { key: 'bookingApproved',   label: 'Booking Approved',     desc: 'When your booking request is approved' },
  { key: 'bookingRejected',   label: 'Booking Rejected',     desc: 'When your booking request is rejected' },
  { key: 'bookingCancelled',  label: 'Booking Cancelled',    desc: 'When a booking is cancelled' },
  { key: 'ticketStatusChange',label: 'Ticket Status Change', desc: 'When your ticket status is updated' },
  { key: 'ticketComment',     label: 'New Comment',          desc: 'When someone comments on your ticket' },
  { key: 'ticketAssigned',    label: 'Ticket Assigned',      desc: 'When you are assigned to a ticket' },
]

function formatTime(iso) {
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now - d) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString()
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const { setUnreadCount, refreshCount } = useNotifications()

  const [tab, setTab]           = useState('all')
  const [notifications, setNotifications] = useState([])
  const [prefs, setPrefs]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [prefSaved, setPrefSaved] = useState(false)
  const [toast, setToast]       = useState(null)

  const load = useCallback(async () => {
    if (!user?.userId) return
    setLoading(true)
    try {
      const data = await notificationApi.getAll(user.userId)
      setNotifications(data)
    } catch {
      setToast({ message: 'Failed to load notifications.', type: 'error' })
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

  useEffect(() => {
    load()
    loadPrefs()
  }, [load, loadPrefs])

  const handleMarkRead = async (id) => {
    try {
      await notificationApi.markAsRead(id, user.userId)
      setNotifications(prev =>
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(c => Math.max(0, c - 1))
    } catch {}
  }

  const handleDelete = async (id) => {
    const wasUnread = notifications.find(n => n.notificationId === id)?.isRead === false
    try {
      await notificationApi.deleteOne(id, user.userId)
      setNotifications(prev => prev.filter(n => n.notificationId !== id))
      if (wasUnread) setUnreadCount(c => Math.max(0, c - 1))
    } catch {
      setToast({ message: 'Failed to delete notification.', type: 'error' })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead(user.userId)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
      setToast({ message: 'All notifications marked as read.', type: 'success' })
    } catch {
      setToast({ message: 'Failed to mark all as read.', type: 'error' })
    }
  }

  const handlePrefChange = (key) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }))
    setPrefSaved(false)
  }

  const handleSavePrefs = async () => {
    try {
      await notificationApi.updatePreferences(prefs, user.userId)
      setPrefSaved(true)
      setToast({ message: 'Preferences saved.', type: 'success' })
      setTimeout(() => setPrefSaved(false), 3000)
    } catch {
      setToast({ message: 'Failed to save preferences.', type: 'error' })
    }
  }

  const displayed = tab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications

  const unreadTotal = notifications.filter(n => !n.isRead).length

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>🔔 Notifications</h1>
          <p>{unreadTotal > 0 ? `${unreadTotal} unread` : 'All caught up!'}</p>
        </div>
        {unreadTotal > 0 && tab !== 'preferences' && (
          <button className="mark-all-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </div>

      <div className="notif-tabs">
        <button className={`notif-tab ${tab === 'all' ? 'active' : ''}`} onClick={() => setTab('all')}>
          All ({notifications.length})
        </button>
        <button className={`notif-tab ${tab === 'unread' ? 'active' : ''}`} onClick={() => setTab('unread')}>
          Unread ({unreadTotal})
        </button>
        <button className={`notif-tab ${tab === 'preferences' ? 'active' : ''}`} onClick={() => setTab('preferences')}>
          Preferences
        </button>
      </div>

      {tab === 'preferences' ? (
        <PreferencesPanel
          prefs={prefs}
          saved={prefSaved}
          onChange={handlePrefChange}
          onSave={handleSavePrefs}
        />
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading…
        </div>
      ) : displayed.length === 0 ? (
        <div className="notif-empty">
          <div className="notif-empty-icon">🔔</div>
          <h3>{tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notif-list">
          {displayed.map(n => (
            <NotificationItem
              key={n.notificationId}
              notif={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {toast && (
        <ToastMsg
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

function NotificationItem({ notif, onMarkRead, onDelete }) {
  const icon = TYPE_ICON[notif.entityType] || '🔔'
  return (
    <div className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}>
      <span className="notif-icon">{icon}</span>
      <div className="notif-body">
        <p className="notif-message">{notif.message}</p>
        <div className="notif-meta">
          {!notif.isRead && <span className="notif-unread-dot" />}
          <span className="notif-time">{formatTime(notif.createdAt)}</span>
        </div>
      </div>
      <div className="notif-actions">
        {!notif.isRead && (
          <button className="notif-btn" onClick={() => onMarkRead(notif.notificationId)}>
            Mark read
          </button>
        )}
        <button className="notif-btn delete" onClick={() => onDelete(notif.notificationId)}>
          ✕
        </button>
      </div>
    </div>
  )
}

function PreferencesPanel({ prefs, saved, onChange, onSave }) {
  if (!prefs) return (
    <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
      Loading preferences…
    </div>
  )
  return (
    <div className="pref-section">
      <h2>Notification Preferences</h2>
      <p>Choose which events you'd like to be notified about.</p>
      <div className="pref-list">
        {PREF_META.map(({ key, label, desc }) => (
          <div className="pref-row" key={key}>
            <div className="pref-label">
              <strong>{label}</strong>
              <span>{desc}</span>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={prefs[key] ?? true}
                onChange={() => onChange(key)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>
      <div className="pref-save-row">
        <button
          onClick={onSave}
          style={{
            background: saved ? '#2d8653' : 'var(--clr-900)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 24px',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'background var(--transition)',
          }}
        >
          {saved ? '✓ Saved' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}

function ToastMsg({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3800)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'success' ? '#2d8653' : type === 'error' ? '#c62828' : '#3D52A0'

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 3000,
      background: bg, color: 'white',
      padding: '14px 20px', borderRadius: 'var(--radius-sm)',
      boxShadow: 'var(--shadow-md)', fontSize: '0.9rem', fontWeight: 600,
      maxWidth: 340,
    }}>
      {message}
    </div>
  )
}
