import { RESOURCE_TYPE_COLOR, RESOURCE_LABEL } from '../../utils/helpers.js'

export default function TypeBadge({ type }) {
    const c = RESOURCE_TYPE_COLOR[type] || { color: 'var(--text-sec)', bg: 'var(--gray100)', border: 'var(--gray200)' }
    return (
        <span
            className="type-badge-pill"
            style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
        >
            {RESOURCE_LABEL[type] || type}
        </span>
    )
}
