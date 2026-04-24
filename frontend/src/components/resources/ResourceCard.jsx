import { getIcon } from '../../utils/helpers.js'
import TypeBadge from './TypeBadge.jsx'
import FeatureTag from './FeatureTag.jsx'

export default function ResourceCard({ resource, onBook }) {
    const active = resource.status === 'ACTIVE'
    return (
        <div
            onClick={active ? () => onBook(resource) : undefined}
            className={`resource-card scale-in${active ? ' active' : ''}`}
        >
            <div style={{ position: 'relative' }}>
                {resource.imageUrl ? (
                    <img
                        src={resource.imageUrl}
                        alt={resource.name}
                        className="resource-card-img"
                    />
                ) : (
                    <div className={`resource-card-placeholder ${active ? 'active-bg' : 'inactive-bg'}`}>
                        {getIcon(resource.type)}
                    </div>
                )}

                {!active && (
                    <span className="resource-card-status-pill">
                        {resource.status.replace(/_/g, ' ')}
                    </span>
                )}
            </div>

            <div className="resource-card-body">
                <div className="resource-card-title-row">
                    <h3 className="resource-card-name">{resource.name}</h3>
                    <TypeBadge type={resource.type} />
                </div>
                <p className="resource-card-meta">
                    Floor {resource.floor}{resource.capacity ? ` · ${resource.capacity} seats` : ''}
                </p>
                <p className="resource-card-hours">
                    🕐 {resource.availabilityStart?.slice(0, 5)} – {resource.availabilityEnd?.slice(0, 5)}
                </p>
                {resource.features?.length > 0 && (
                    <div className="resource-card-features">
                        {resource.features.slice(0, 4).map(f => <FeatureTag key={f} label={f} />)}
                        {resource.features.length > 4 && <FeatureTag label={`+${resource.features.length - 4} more`} />}
                    </div>
                )}
                {active && (
                    <div className="resource-card-book-cta">
                        <span>Click to book →</span>
                    </div>
                )}
            </div>
        </div>
    )
}
