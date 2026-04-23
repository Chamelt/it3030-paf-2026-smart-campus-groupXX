import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { notificationApi } from '../../services/api'
import './BroadcastPage.css'

const MAX_LEN = 500

export default function BroadcastPage() {
  const { user } = useAuth()
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [result, setResult]     = useState(null)
  const [history, setHistory]   = useState([])

  const over = message.length > MAX_LEN
  const empty = message.trim().length === 0

  const send = async (target) => {
    if (empty || over) return
    setSending(true)
    setResult(null)
    try {
      const res = target === 'all'
        ? await notificationApi.broadcast(message.trim(), user.userId)
        : await notificationApi.broadcastToAdmins(message.trim(), user.userId)

      const count = res.usersNotified ?? res.adminsNotified ?? 0
      const label = target === 'all' ? 'users' : 'admins'
      const entry = {
        id: Date.now(),
        message: message.trim(),
        target,
        count,
        sentAt: new Date().toISOString(),
      }
      setHistory(prev => [entry, ...prev].slice(0, 10))
      setResult({ type: 'success', text: `Sent to ${count} ${label}.` })
      setMessage('')
    } catch (err) {
      setResult({ type: 'error', text: err.message || 'Failed to send broadcast.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="broadcast-page">
      <div className="broadcast-header">
        <h1>📢 Broadcast</h1>
        <p>Send a system-wide message to all users or just admins.</p>
      </div>

      <div className="broadcast-card">
        <h2>Compose Message</h2>

        <div className="broadcast-textarea-wrap">
          <textarea
            className="broadcast-textarea"
            placeholder="Type your message here…"
            value={message}
            onChange={e => { setMessage(e.target.value); setResult(null) }}
            rows={5}
          />
          <span className={`broadcast-char-count ${over ? 'over' : ''}`}>
            {message.length}/{MAX_LEN}
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
            {result.type === 'success' ? '✓' : '✕'} {result.text}
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="broadcast-history">
          <h2>Recent Broadcasts (this session)</h2>
          <div className="broadcast-history-list">
            {history.map(item => (
              <div className="broadcast-history-item" key={item.id}>
                <p>"{item.message}"</p>
                <div className="broadcast-history-meta">
                  <span className={`broadcast-history-badge ${item.target}`}>
                    {item.target === 'all' ? 'All Users' : 'Admins Only'}
                  </span>
                  {item.count} notified · {new Date(item.sentAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
