export default function ResourceTableRow({ resource, onEdit, onStatusChange, onDelete }) {
    const features = resource.features || []
    const visibleFeatures = features.slice(0, 3)
    const extraCount = features.length - 3

    return (
        <tr className={resource.status === 'DECOMMISSIONED' ? 'decommissioned' : ''}>
            {/* Image */}
            <td>
                {resource.imageUrl
                    ? <img src={resource.imageUrl} className="resource-thumb" alt={resource.name} />
                    : <div className="resource-thumb-placeholder">🏛️</div>
                }
            </td>

            {/* Name */}
            <td><strong>{resource.name}</strong></td>

            {/* Type */}
            <td>
                <span className={`type-badge type-${resource.type}`}>
                    {resource.type.replace(/_/g, ' ')}
                </span>
            </td>

            {/* Floor */}
            <td>{resource.floor}</td>

            {/* Capacity */}
            <td>{resource.capacity ?? '—'}</td>

            {/* Features */}
            <td>
                {visibleFeatures.map(f => (
                    <span key={f} className="feature-pill">{f.replace(/_/g, ' ')}</span>
                ))}
                {extraCount > 0 && (
                    <span className="feature-pill">+{extraCount} more</span>
                )}
            </td>

            {/* Status */}
            <td>
                <span className={`status-badge status-${resource.status}`}>
                    {resource.status.replace(/_/g, ' ')}
                </span>
            </td>

            {/* Actions */}
            <td>
                <div className="actions-cell">
                    <button
                        className="btn-secondary"
                        onClick={() => onEdit(resource)}
                    >
                        Edit
                    </button>

                    {resource.status !== 'DECOMMISSIONED' && (
                        resource.status === 'ACTIVE'
                            ? (
                                <button
                                    className="btn-warning"
                                    onClick={() => onStatusChange(resource.resourceId, 'OUT_OF_SERVICE')}
                                >
                                    Out of Service
                                </button>
                            ) : (
                                <button
                                    className="btn-success"
                                    onClick={() => onStatusChange(resource.resourceId, 'ACTIVE')}
                                >
                                    Set Active
                                </button>
                            )
                    )}

                    <button
                        className="btn-danger"
                        onClick={() => onDelete(resource.resourceId)}
                        disabled={resource.status === 'DECOMMISSIONED'}
                    >
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    )
}
