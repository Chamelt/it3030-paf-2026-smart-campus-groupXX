export default function FeatureTag({ label }) {
    return (
        <span className="feature-tag-pill">
            {label.replace(/_/g, ' ')}
        </span>
    )
}
