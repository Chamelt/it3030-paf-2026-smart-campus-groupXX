import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../services/api'
import './BroadcastPage.css'

const MAX = 500

const TIPS = [
  { icon: '📢', title: 'Broadcast to All',    body: 'Sends to every registered user on the platform.' },
  { icon: '🔒', title: 'Admins Only',         body: 'Useful for internal alerts visible only to admin accounts.' },
  { icon: '⚡', title: 'Instant delivery',    body: 'Notifications appear immediately in the recipient\'s inbox.' },
  { icon: '📝', title: '500 character limit', body: 'Keep messages clear and concise for best readability.' },
]

export default function BroadcastPage() {
  const { user }  = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result,  setResult]  = useState(null)
  const [history, setHistory] = useState([])

  const over  = message.length > MAX
  const empty = message.trim().length === 0

  const send = async (target) => {
    if (empty || over || sending) return
    setSending(true)
    setResult(null)
    try {
      const res = target === 'all'
        ? await notificationApi.broadcast(message.trim(), user.userId)
        : await notificationApi.broadcastToAdmins(message.trim(), user.userId)
      const count = res.usersNotified ?? res.adminsNotified ?? 0
      setHistory(prev => [{
        id: Date.now(), message: message.trim(), target, count, sentAt: new Date().toISOString(),
      }, ...prev].slice(0, 8))
      setResult({ type: 'success', text: `✓ Sent to ${count} ${target === 'all' ? 'users' : 'admins'}.` })
      setMessage('')
    } catch (err) {
      setResult({ type: 'error', text: err.message || 'Failed to send broadcast.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-page">
      {/* Hero */}
      <div className="broadcast-hero">
        <div>
          <h1>Broadcast Center</h1>
          <p>Send system-wide messages to all users or administrators.</p>
        </div>
      </div>

      <div className="broadcast-main">
        {/* Compose — full width */}
        <div className="broadcast-card broadcast-compose">
          <div className="broadcast-card-header">
            <h2>Compose Message</h2>
            <p>Write your message below and choose who receives it.</p>
          </div>
          <div className="broadcast-card-body">
            <div className="broadcast-textarea-wrap">
              <textarea
                className="broadcast-textarea"
                placeholder="Type your broadcast message here…"
                value={message}
                onChange={e => { setMessage(e.target.value); setResult(null) }}
                rows={5}
              />
              <span className={`broadcast-char ${over ? 'over' : ''}`}>
                {message.length}/{MAX}
              </span>
            </div>
            <div className="broadcast-actions">
              <button
                className="broadcast-btn all"
                disabled={empty || over || sending}
                onClick={() => send('all')}
              >
                {sending ? '⏳ Sending…' : '📢 Broadcast to All'}
              </button>
              <button
                className="broadcast-btn admins"
                disabled={empty || over || sending}
                onClick={() => send('admins')}
              >
                {sending ? '⏳ Sending…' : '🔒 Notify Admins Only'}
              </button>
            </div>
            {result && (
              <div className={`broadcast-result ${result.type}`}>
                {result.text}
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div className="broadcast-card" style={{ animationDelay: '0.05s' }}>
          <div className="broadcast-card-header">
            <h2>Session History</h2>
            <p>Broadcasts sent this session.</p>
          </div>
          <div className="broadcast-card-body">
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No broadcasts sent yet.
              </div>
            ) : (
              <div className="broadcast-history-list">
                {history.map(item => (
                  <div className="broadcast-history-item" key={item.id}>
                    <p className="broadcast-history-msg">"{item.message}"</p>
                    <div className="broadcast-history-meta">
                      <span className={`broadcast-badge ${item.target}`}>
                        {item.target === 'all' ? 'All Users' : 'Admins'}
                      </span>
                      <span className="broadcast-history-time">
                        {new Date(item.sentAt).toLocaleTimeString()}
                      </span>
                      <span className="broadcast-history-count">{item.count} notified</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tips */}
        <div className="broadcast-card" style={{ animationDelay: '0.1s' }}>
          <div className="broadcast-card-header">
            <h2>How It Works</h2>
            <p>Broadcast guidelines and tips.</p>
          </div>
          <div className="broadcast-card-body">
            {TIPS.map((t, i) => (
              <div className="broadcast-tip" key={i}>
                <span className="broadcast-tip-icon">{t.icon}</span>
                <div className="broadcast-tip-text">
                  <strong>{t.title}</strong>
                  <span>{t.body}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
