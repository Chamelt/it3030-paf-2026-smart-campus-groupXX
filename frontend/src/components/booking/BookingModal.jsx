// src/components/booking/BookingModal.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { bookingApi } from '../../services/api.js'
import { Btn, Input, Textarea } from '../ui/index.jsx'
import { todayISO, getIcon, RESOURCE_LABEL, RESOURCE_TYPE_COLOR } from '../../utils/helpers.js'

/* ══════════════════════════════════════════════════════════════════
   DRAG-SCROLL DRUM-ROLL TIME PICKER
   Supports: mouse drag, touch drag, scroll wheel, click on item
   disabledItems: Set of string values that cannot be selected —
   visually dimmed and auto-skipped on snap.
   ══════════════════════════════════════════════════════════════════ */
const START_HOURS = Array.from({ length: 15 }, (_, i) => String(i + 7).padStart(2, '0'))  // 07–21
const END_HOURS = Array.from({ length: 16 }, (_, i) => String(i + 7).padStart(2, '0'))  // 07–22
const HOURS = END_HOURS  // alias used by computeDisabled
const MINUTES = ['00', '15', '30', '45']
const ITEM_H = 60

function DrumColumn({ items, value, onChange, disabledItems = new Set() }) {
    const trackRef = useRef()
    const isDragging = useRef(false)
    const startY = useRef(0)
    const startScroll = useRef(0)
    const snapTimer = useRef(null)

    // ── Initial scroll — jump to first non-disabled item if value is disabled ──
    useEffect(() => {
        let idx = items.indexOf(value)
        // If current value is disabled, find first enabled item
        if (disabledItems.has(value)) {
            idx = items.findIndex(i => !disabledItems.has(i))
            if (idx >= 0) onChange(items[idx])
        }
        if (trackRef.current && idx >= 0) {
            trackRef.current.scrollTop = idx * ITEM_H
        }
    }, []) // mount only

    // ── Sync scroll whenever value changes externally ─────────────
    // Fires when e.g. start time changes and end time is auto-pushed to start+30
    useEffect(() => {
        const idx = items.indexOf(value)
        if (idx < 0 || !trackRef.current) return
        if (isDragging.current) return  // don't interrupt an active drag
        trackRef.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    }, [value])

    // ── When disabledItems changes (date changes), push value to first valid slot ──
    useEffect(() => {
        if (!disabledItems.has(value)) return
        const firstValid = items.find(i => !disabledItems.has(i))
        if (!firstValid) return
        const idx = items.indexOf(firstValid)
        onChange(firstValid)
        if (trackRef.current) {
            trackRef.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
        }
    }, [disabledItems])

    // ── Snap to nearest ENABLED item ─────────────────────────────
    const scheduleSnap = useCallback(() => {
        clearTimeout(snapTimer.current)
        snapTimer.current = setTimeout(() => {
            if (!trackRef.current) return
            const raw = trackRef.current.scrollTop
            const rawIdx = Math.round(raw / ITEM_H)
            const clamped = Math.max(0, Math.min(rawIdx, items.length - 1))

            // Walk forward from clamped to find nearest enabled item
            let target = clamped
            for (let offset = 0; offset < items.length; offset++) {
                const fwd = clamped + offset
                const bwd = clamped - offset
                if (fwd < items.length && !disabledItems.has(items[fwd])) { target = fwd; break }
                if (bwd >= 0 && !disabledItems.has(items[bwd])) { target = bwd; break }
            }

            trackRef.current.scrollTo({ top: target * ITEM_H, behavior: 'smooth' })
            onChange(items[target])
        }, 80)
    }, [items, onChange, disabledItems])

    const handleScroll = () => scheduleSnap()

    const onMouseDown = (e) => {
        e.preventDefault()
        isDragging.current = true
        startY.current = e.clientY
        startScroll.current = trackRef.current.scrollTop
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
    }
    const onMouseMove = (e) => {
        if (!isDragging.current) return
        const delta = startY.current - e.clientY
        trackRef.current.scrollTop = startScroll.current + delta
        scheduleSnap()
    }
    const onMouseUp = () => {
        isDragging.current = false
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        scheduleSnap()
    }

    const onTouchStart = (e) => {
        startY.current = e.touches[0].clientY
        startScroll.current = trackRef.current.scrollTop
    }
    const onTouchMove = (e) => {
        const delta = startY.current - e.touches[0].clientY
        trackRef.current.scrollTop = startScroll.current + delta
        scheduleSnap()
    }

    const handleItemClick = (item) => {
        if (disabledItems.has(item)) return   // ignore clicks on disabled items
        const idx = items.indexOf(item)
        trackRef.current.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
        onChange(item)
    }

    return (
        <div style={{ position: 'relative', width: 120, flexShrink: 0, userSelect: 'none' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, white 40%, transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: 8, right: 8, height: ITEM_H, transform: 'translateY(-50%)', background: 'var(--g50)', border: '2px solid var(--g300)', borderRadius: 12, zIndex: 1, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, white 40%, transparent)', zIndex: 2, pointerEvents: 'none' }} />

            <div
                ref={trackRef}
                onScroll={handleScroll}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                style={{ height: ITEM_H * 3, overflowY: 'hidden', cursor: 'grab', position: 'relative' }}
            >
                <div style={{ height: ITEM_H }} />
                {items.map(item => {
                    const sel = item === value
                    const disabled = disabledItems.has(item)
                    return (
                        <div key={item} onClick={() => handleItemClick(item)} style={{
                            height: ITEM_H,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: sel ? 28 : 20,
                            fontWeight: sel ? 700 : 400,
                            color: disabled
                                ? 'var(--gray200)'                      // very light — clearly unavailable
                                : sel ? 'var(--g700)' : 'var(--gray400)',
                            position: 'relative', zIndex: 3,
                            transition: 'color 100ms, font-size 100ms',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            textDecoration: disabled ? 'line-through' : 'none',
                        }}>
                            {item}
                        </div>
                    )
                })}
                <div style={{ height: ITEM_H }} />
            </div>
        </div>
    )
}

// ── Compute which hours and minutes are in the 2-hour rejection zone ──
// Returns { disabledHours: Set<string>, getDisabledMinutes: (hh) => Set<string> }
function computeDisabled(date) {
    const isToday = date === todayISO()

    // Base 2-hour cutoff disabled sets (today only)
    let disabledHours = new Set()
    let cutoffH = -1, cutoffM = 0

    if (isToday) {
        const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000)
        cutoffH = cutoff.getHours()
        cutoffM = cutoff.getMinutes()
        for (let h = 7; h < cutoffH; h++) {
            disabledHours.add(String(h).padStart(2, '0'))
        }
    }

    // Minutes disabled for a given hour — combines 2h rule + 22:xx rule
    const getDisabledMinutes = (hh, isEndPicker = false) => {
        const h = parseInt(hh, 10)

        // End picker at hour 22: only :00 is valid, disable 15 / 30 / 45
        if (isEndPicker && h === 22) {
            return new Set(['15', '30', '45'])
        }

        if (!isToday) return new Set()

        if (h < cutoffH) return new Set(MINUTES)   // fully disabled hour
        if (h > cutoffH) return new Set()           // fully open hour
        // Same hour as cutoff — disable slots before cutoffM
        const disabled = new Set()
        for (const m of MINUTES) {
            if (parseInt(m, 10) < cutoffM) disabled.add(m)
        }
        return disabled
    }

    return { disabledHours, getDisabledMinutes }
}

function TimePicker({ label, value, onChange, date, isEndPicker = false }) {
    const [hh, mm] = (value || '09:00').split(':')
    const { disabledHours, getDisabledMinutes } = computeDisabled(date)
    const disabledMinutes = getDisabledMinutes(hh, isEndPicker)
    const hourItems = isEndPicker ? END_HOURS : START_HOURS

    return (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 12 }}>{label}</p>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'var(--white)', border: '1.5px solid var(--border)',
                borderRadius: 16, padding: '12px 20px', boxShadow: 'var(--shadow-sm)', flex: 1,
            }}>
                <DrumColumn
                    items={hourItems}
                    value={hh}
                    onChange={h => onChange(`${h}:${mm}`)}
                    disabledItems={disabledHours}
                />
                <span style={{ fontSize: 36, fontWeight: 700, color: 'var(--gray300)', lineHeight: 1, flexShrink: 0 }}>:</span>
                <DrumColumn
                    items={MINUTES}
                    value={mm}
                    onChange={m => onChange(`${hh}:${m}`)}
                    disabledItems={disabledMinutes}
                />
            </div>
        </div>
    )
}


/* ══════════════════════════════════════════════════════════════════
   MAIN BOOKING MODAL — 85% of screen
   ══════════════════════════════════════════════════════════════════ */

// Add 30 minutes to a HH:MM string, capped at 22:00
function addThirtyMins(timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    let newM = m + 30
    let newH = h
    if (newM >= 60) { newM -= 60; newH += 1 }
    if (newH > 22 || (newH === 22 && newM > 0)) { newH = 22; newM = 0 }
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

// Compute the first valid start time — now + 2h rounded up to next 15-min slot
function getInitialStartTime() {
    const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000)
    const h = cutoff.getHours()
    const m = cutoff.getMinutes()
    // Round up to next 15-min slot
    const roundedM = Math.ceil(m / 15) * 15
    let finalH = h
    let finalM = roundedM
    if (roundedM >= 60) { finalH += 1; finalM = 0 }
    // Cap at 21:30 (latest valid start)
    if (finalH > 21 || (finalH === 21 && finalM > 30)) { finalH = 21; finalM = 30 }
    // If before 09:00 (morning, not yet past cutoff) use 09:00
    if (finalH < 9 || (finalH === 9 && finalM === 0 && h < 7)) return '09:00'
    return `${String(finalH).padStart(2, '0')}:${String(finalM).padStart(2, '0')}`
}

export default function BookingModal({ resource, userId, onClose, onSuccess }) {
    const initialStart = getInitialStartTime()
    const [form, setForm] = useState({
        date: todayISO(),
        startTime: initialStart,
        endTime: addThirtyMins(initialStart),
        purpose: '',
        expectedAttendees: '',
        isPriority: false,
        priorityReason: '',
    })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [avail, setAvail] = useState(null)
    const [checking, setChecking] = useState(false)

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    // Too late only when selected date is TODAY and cutoff is past 21:30
    const isTooLateForDate = (date) => {
        if (date !== todayISO()) return false
        const cutoff = new Date(Date.now() + 2 * 60 * 60 * 1000)
        return cutoff.getHours() > 21 || (cutoff.getHours() === 21 && cutoff.getMinutes() >= 30)
    }
    const tooLate = isTooLateForDate(form.date)

    // When startTime changes, push endTime to start + 30 min automatically
    const setStartTime = (v) => {
        setForm(f => ({
            ...f,
            startTime: v,
            endTime: addThirtyMins(v),
        }))
    }

    // Live availability check
    useEffect(() => {
        if (!form.date || !form.startTime || !form.endTime) return
        setChecking(true); setAvail(null)
        const t = setTimeout(() => {
            bookingApi.checkAvailability(
                resource.resourceId, form.date,
                form.startTime + ':00', form.endTime + ':00'
            )
                .then(r => { setAvail(r); setChecking(false) })
                .catch(() => setChecking(false))
        }, 500)
        return () => clearTimeout(t)
    }, [form.date, form.startTime, form.endTime, resource.resourceId])

    useEffect(() => {
        const h = e => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        document.body.style.overflow = 'hidden'
        return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
    }, [onClose])

    const validate = () => {
        const e = {}

        if (!form.date) e.date = 'Date is required'
        if (!form.purpose.trim()) e.purpose = 'Purpose is required'
        if (form.startTime >= form.endTime) e.endTime = 'End time must be after start time'
        if (form.isPriority && !form.priorityReason.trim()) e.priorityReason = 'Priority reason is required'
        if (resource.capacity && form.expectedAttendees && Number(form.expectedAttendees) > resource.capacity)
            e.expectedAttendees = `Exceeds capacity of ${resource.capacity}`

        // Must be at least 2 hours from now
        if (form.date && form.startTime) {
            const bookingStart = new Date(`${form.date}T${form.startTime}:00`)
            const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000)
            if (bookingStart < twoHoursFromNow) {
                // Calculate what the earliest valid time would be
                const earliest = new Date(twoHoursFromNow)
                // Round up to next 15-min slot
                const mins = earliest.getMinutes()
                const roundedMins = Math.ceil(mins / 15) * 15
                earliest.setMinutes(roundedMins, 0, 0)
                if (roundedMins === 60) { earliest.setHours(earliest.getHours() + 1); earliest.setMinutes(0) }
                const hh = String(earliest.getHours()).padStart(2, '0')
                const mm = String(earliest.getMinutes()).padStart(2, '0')
                const dateStr = earliest.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                e.date = `Bookings must be made at least 2 hours in advance. Earliest available: ${dateStr} at ${hh}:${mm}.`
            }
        }

        setErrors(e)
        return Object.keys(e).length === 0
    }

    const handleSubmit = async () => {
        if (!validate()) return
        setLoading(true)
        try {
            await bookingApi.create({
                resourceId: resource.resourceId,
                date: form.date,
                startTime: form.startTime + ':00',
                endTime: form.endTime + ':00',
                purpose: form.purpose,
                expectedAttendees: form.expectedAttendees ? Number(form.expectedAttendees) : undefined,
                isPriority: form.isPriority,
                priorityReason: form.priorityReason || undefined,
            }, userId)
            onSuccess('Booking request submitted — awaiting admin review.')
        } catch (err) {
            setErrors({ _global: err.message })
        } finally {
            setLoading(false)
        }
    }

    const typeC = RESOURCE_TYPE_COLOR[resource.type] || { color: 'var(--text-sec)', bg: 'var(--gray100)', border: 'var(--gray200)' }

    // ── Too late to book today — show clean message instead of broken dial ──
    if (tooLate) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        const tomorrowISO = tomorrow.toISOString().split('T')[0]
        const tomorrowStr = tomorrow.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

        return (
            <div
                className="fade-in"
                onClick={e => { if (e.target === e.currentTarget) onClose() }}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgb(0 0 0 / 0.45)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '2vh 2vw',
                }}
            >
                <div className="scale-in" style={{
                    background: 'var(--white)', borderRadius: 20,
                    boxShadow: '0 32px 64px rgb(0 0 0/0.18)',
                    width: 480, padding: '40px 40px 36px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 20, textAlign: 'center',
                }}>
                    {/* X button */}
                    <div style={{ alignSelf: 'flex-end', marginBottom: -8 }}>
                        <button onClick={onClose} style={{
                            width: 36, height: 36, borderRadius: '50%', border: '1.5px solid var(--border)',
                            background: 'var(--white)', cursor: 'pointer', fontSize: 18, color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                        >✕</button>
                    </div>

                    {/* Icon */}
                    <div style={{ fontSize: 56 }}>🌙</div>

                    {/* Resource name */}
                    <div>
                        <span style={{
                            fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
                            color: typeC.color, background: typeC.bg, border: `1px solid ${typeC.border}`,
                        }}>
                            {RESOURCE_LABEL[resource.type] || resource.type}
                        </span>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, marginTop: 10 }}>
                            {resource.name}
                        </h2>
                    </div>

                    {/* Message */}
                    <div style={{
                        background: '#fffbeb', border: '1px solid #fde68a',
                        borderRadius: 12, padding: '18px 22px', width: '100%',
                    }}>
                        <p style={{ fontSize: 16, fontWeight: 600, color: '#92400e', marginBottom: 6 }}>
                            Too late to book today
                        </p>
                        <p style={{ fontSize: 14, color: '#92400e', lineHeight: 1.6 }}>
                            Bookings must be made at least <strong>2 hours in advance</strong>.
                            There are no available time slots left for today.
                        </p>
                    </div>

                    {/* Date picker — pick a future date to open the full form */}
                    <div style={{ width: '100%', textAlign: 'left' }}>
                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>
                            Book for a different date
                        </label>
                        <input
                            type="date"
                            defaultValue={tomorrowISO}
                            min={tomorrowISO}
                            onChange={e => set('date', e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: 10,
                                border: '1.5px solid var(--border)', fontSize: 15,
                                fontFamily: 'var(--font-body)', outline: 'none',
                                background: 'var(--white)', cursor: 'pointer',
                            }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--border)'}
                        />
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                            Next available: <strong>{tomorrowStr}</strong>
                        </p>
                    </div>

                    {/* Book tomorrow button */}
                    <button
                        onClick={() => set('date', tomorrowISO)}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                            background: 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 600,
                            fontFamily: 'var(--font-body)', cursor: 'pointer',
                        }}
                        onMouseEnter={e => e.currentTarget.style.filter = 'brightness(0.92)'}
                        onMouseLeave={e => e.currentTarget.style.filter = ''}
                    >
                        Book for {tomorrowStr}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fade-in"
            onClick={e => { if (e.target === e.currentTarget) onClose() }}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgb(0 0 0 / 0.45)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '2vh 2vw',
            }}
        >
            <div className="scale-in" style={{
                background: 'var(--white)', borderRadius: 20,
                boxShadow: '0 32px 64px rgb(0 0 0/0.18)',
                width: '85vw', maxWidth: 1200,
                height: '85vh',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>

                {/* ── Top bar ─────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '22px 32px',
                    borderBottom: '1px solid var(--border-subtle)', flexShrink: 0,
                }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400 }}>
                        Request a Booking
                    </h2>
                    <button onClick={onClose} style={{
                        width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)',
                        background: 'var(--white)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 20, color: 'var(--text-muted)', transition: 'all 150ms',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    >✕</button>
                </div>

                {/* ── Body ─────────────────────────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', flex: 1, overflow: 'hidden' }}>

                    {/* Left — resource summary */}
                    <div style={{
                        borderRight: '1px solid var(--border-subtle)',
                        overflowY: 'auto', padding: '28px 28px',
                        display: 'flex', flexDirection: 'column', gap: 18, background: 'var(--gray50)',
                    }}>
                        {/* Icon */}
                        <div style={{
                            height: 160, background: 'linear-gradient(135deg, var(--g50), var(--g100))',
                            borderRadius: 16, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 72, border: '1px solid var(--g200)',
                        }}>
                            {getIcon(resource.type)}
                        </div>

                        {/* Name + type */}
                        <div>
                            <div style={{ marginBottom: 8 }}>
                                <span style={{
                                    fontSize: 12, fontWeight: 700, padding: '3px 10px',
                                    borderRadius: 999, color: typeC.color,
                                    background: typeC.bg, border: `1px solid ${typeC.border}`,
                                    letterSpacing: '0.04em',
                                }}>
                                    {RESOURCE_LABEL[resource.type] || resource.type}
                                </span>
                            </div>
                            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, lineHeight: 1.3 }}>
                                {resource.name}
                            </h3>
                        </div>

                        {/* Meta */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, color: 'var(--text-sec)' }}>
                            <p>📍 Floor {resource.floor}</p>
                            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{resource.locationDescription}</p>
                            {resource.capacity && <p>👥 Up to {resource.capacity} people</p>}
                            <p>🕐 {resource.availabilityStart?.slice(0, 5)} – {resource.availabilityEnd?.slice(0, 5)}</p>
                        </div>

                        {/* Features */}
                        {resource.features?.length > 0 && (
                            <div>
                                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Features</p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {resource.features.map(f => (
                                        <span key={f} style={{
                                            fontSize: 12, padding: '4px 10px', borderRadius: 999,
                                            background: 'var(--g50)', color: 'var(--g700)', border: '1px solid var(--g200)',
                                        }}>{f.replace(/_/g, ' ')}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right — form */}
                    <div style={{ overflowY: 'auto', padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>

                        {/* Date */}
                        <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>
                                Date *
                            </label>
                            <input type="date" value={form.date} min={todayISO()}
                                onChange={e => set('date', e.target.value)}
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 10,
                                    border: `1.5px solid ${errors.date ? '#dc2626' : 'var(--border)'}`,
                                    fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                                    background: 'var(--white)',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = errors.date ? '#dc2626' : 'var(--border)'}
                            />
                            {errors.date && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 5 }}>{errors.date}</p>}
                        </div>

                        {/* Time pickers */}
                        <div>
                            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 14 }}>Time slot *</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'stretch' }}>
                                <TimePicker label="Start time" value={form.startTime} date={form.date} onChange={setStartTime} />
                                <TimePicker label="End time" value={form.endTime} date={form.date} onChange={v => set('endTime', v)} isEndPicker />
                            </div>
                            {errors.endTime && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 8 }}>{errors.endTime}</p>}
                        </div>

                        {/* Availability pill */}
                        {checking && (
                            <div style={{ padding: '11px 16px', borderRadius: 10, background: 'var(--gray50)', border: '1px solid var(--border)', fontSize: 14, color: 'var(--text-muted)' }}>
                                Checking availability…
                            </div>
                        )}
                        {!checking && avail && (
                            <div style={{
                                padding: '11px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                                background: avail.available ? 'var(--g50)' : '#fef2f2',
                                color: avail.available ? 'var(--g700)' : '#dc2626',
                                border: `1px solid ${avail.available ? 'var(--g200)' : '#fecaca'}`,
                            }}>
                                {avail.available ? '✓ This slot is available' : '✕ ' + avail.message}
                            </div>
                        )}

                        {/* Purpose */}
                        <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>
                                Purpose *
                            </label>
                            <textarea rows={3} value={form.purpose}
                                onChange={e => set('purpose', e.target.value)}
                                placeholder="Briefly describe why you need this resource"
                                style={{
                                    width: '100%', padding: '12px 16px', borderRadius: 10,
                                    border: `1.5px solid ${errors.purpose ? '#dc2626' : 'var(--border)'}`,
                                    fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                                    resize: 'vertical', background: 'var(--white)',
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                onBlur={e => e.target.style.borderColor = errors.purpose ? '#dc2626' : 'var(--border)'}
                            />
                            {errors.purpose && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 5 }}>{errors.purpose}</p>}
                        </div>

                        {/* Attendees */}
                        {resource.capacity && (
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', marginBottom: 8 }}>
                                    Expected Attendees
                                </label>
                                {(() => {
                                    const overCapacity = form.expectedAttendees && Number(form.expectedAttendees) > resource.capacity
                                    const borderColor = overCapacity ? '#dc2626' : errors.expectedAttendees ? '#dc2626' : 'var(--border)'
                                    return (
                                        <>
                                            <input type="number" min={1} max={resource.capacity}
                                                value={form.expectedAttendees}
                                                onChange={e => set('expectedAttendees', e.target.value)}
                                                placeholder={`Max ${resource.capacity}`}
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: 10,
                                                    border: `1.5px solid ${borderColor}`,
                                                    fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                                                    background: overCapacity ? '#fef2f2' : 'var(--white)',
                                                    transition: 'border-color 150ms, background 150ms',
                                                }}
                                                onFocus={e => { if (!overCapacity) e.target.style.borderColor = 'var(--primary)' }}
                                                onBlur={e => { e.target.style.borderColor = borderColor }}
                                            />
                                            {overCapacity ? (
                                                <p style={{ fontSize: 13, color: '#dc2626', marginTop: 6, fontWeight: 500 }}>
                                                    ✕ {form.expectedAttendees} exceeds the capacity of {resource.capacity} — please enter a lower number.
                                                </p>
                                            ) : (
                                                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 5 }}>
                                                    This resource holds up to {resource.capacity} people
                                                </p>
                                            )}
                                        </>
                                    )
                                })()}
                            </div>
                        )}

                        {/* Priority toggle */}
                        <div style={{ padding: '16px 18px', background: 'var(--gray50)', borderRadius: 12, border: '1px solid var(--border)' }}>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer' }}>
                                <div onClick={() => set('isPriority', !form.isPriority)} style={{
                                    width: 44, height: 24, borderRadius: 999, flexShrink: 0, marginTop: 2,
                                    background: form.isPriority ? 'var(--primary)' : 'var(--gray300)',
                                    position: 'relative', transition: 'background 200ms',
                                }}>
                                    <div style={{
                                        position: 'absolute', top: 3, width: 18, height: 18,
                                        left: form.isPriority ? 23 : 3,
                                        borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgb(0 0 0/0.2)',
                                        transition: 'left 200ms',
                                    }} />
                                </div>
                                <div>
                                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>⚡ Priority Booking</span>
                                    <span style={{ display: 'block', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                                        Mark if this booking requires urgent or special consideration
                                    </span>
                                </div>
                            </label>
                            {form.isPriority && (
                                <div style={{ marginTop: 14 }}>
                                    <textarea rows={2} value={form.priorityReason}
                                        onChange={e => set('priorityReason', e.target.value)}
                                        placeholder="Explain why this needs priority status"
                                        style={{
                                            width: '100%', padding: '10px 14px', borderRadius: 8,
                                            border: `1.5px solid ${errors.priorityReason ? '#dc2626' : 'var(--g300)'}`,
                                            fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical',
                                            background: 'var(--white)',
                                        }}
                                    />
                                    {errors.priorityReason && <p style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}>{errors.priorityReason}</p>}
                                </div>
                            )}
                        </div>

                        {errors._global && (
                            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, fontSize: 14, color: '#dc2626' }}>
                                {errors._global}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !!(avail && !avail.available) || !!(resource.capacity && form.expectedAttendees && Number(form.expectedAttendees) > resource.capacity)}
                            style={{
                                padding: '14px 32px', borderRadius: 12, border: 'none',
                                background: (loading || (avail && !avail.available)) ? 'var(--gray300)' : 'var(--primary)',
                                color: '#fff', fontSize: 16, fontWeight: 600,
                                fontFamily: 'var(--font-body)', cursor: (loading || (avail && !avail.available)) ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                                transition: 'filter 150ms',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(0.92)' }}
                            onMouseLeave={e => { e.currentTarget.style.filter = '' }}
                        >
                            {loading && <span style={{ width: 16, height: 16, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
                            Submit Booking Request
                        </button>

                        {avail && !avail.available && (
                            <p style={{ fontSize: 13, color: '#dc2626', textAlign: 'center' }}>
                                This slot is not available. Please choose a different time.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}