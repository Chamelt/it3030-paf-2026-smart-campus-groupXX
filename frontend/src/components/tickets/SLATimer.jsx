// src/components/tickets/SLATimer.jsx
import { useState, useEffect } from 'react'

function elapsedSecs(from, to) {
    if (!from) return null
    const start = new Date(from).getTime()
    const end = to ? new Date(to).getTime() : Date.now()
    return Math.max(0, Math.floor((end - start) / 1000))
}

function fmt(secs) {
    if (secs === null) return '—'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${h}h ${m}m ${s}s`
}

function getColor(secs) {
    if (secs === null) return 'var(--text-muted)'
    const hours = secs / 3600
    if (hours < 2) return '#15803d'
    if (hours < 4) return '#92400e'
    return '#dc2626'
}

function getBg(secs) {
    if (secs === null) return 'var(--gray50)'
    const hours = secs / 3600
    if (hours < 2) return '#f0fdf4'
    if (hours < 4) return '#fffbeb'
    return '#fef2f2'
}

function getBorder(secs) {
    if (secs === null) return 'var(--border)'
    const hours = secs / 3600
    if (hours < 2) return '#bbf7d0'
    if (hours < 4) return '#fde68a'
    return '#fecaca'
}

function TimerRow({ label, live, liveLabel, secs }) {
    return (
        <div style={{
            padding: '12px 16px', borderRadius: 'var(--r-md)',
            background: getBg(secs), border: `1px solid ${getBorder(secs)}`,
        }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: getColor(secs), fontFamily: 'var(--font-display)' }}>
                {live ? `${liveLabel}: ${fmt(secs)}` : fmt(secs)}
            </p>
        </div>
    )
}

export default function SLATimer({ createdAt, assignedAt, acceptedAt, resolvedAt }) {
    const [, setTick] = useState(0)

    const liveResponse = !assignedAt && !!createdAt
    const liveWork     = !resolvedAt && !!acceptedAt

    useEffect(() => {
        if (!liveResponse && !liveWork) return
        const id = setInterval(() => setTick(t => t + 1), 1000)
        return () => clearInterval(id)
    }, [liveResponse, liveWork])

    const responseSecs = elapsedSecs(createdAt, assignedAt)
    const workSecs     = elapsedSecs(acceptedAt, resolvedAt)

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <TimerRow
                label="Response Time"
                live={liveResponse}
                liveLabel="Waiting for assignment"
                secs={responseSecs}
            />
            {acceptedAt && (
                <>
                    <TimerRow
                        label="Work Duration"
                        live={liveWork}
                        liveLabel="Active work time"
                        secs={workSecs}
                    />
                    <TimerRow
                        label="Resource Downtime"
                        live={liveWork}
                        liveLabel="Resource downtime"
                        secs={workSecs}
                    />
                </>
            )}
        </div>
    )
}
