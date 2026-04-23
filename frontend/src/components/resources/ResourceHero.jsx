export default function ResourceHero({ title, subtitle, imageSrc }) {
    return (
        <div className="resources-hero">
            <img src={imageSrc} className="resources-hero-img" alt="" />
            <div className="resources-hero-overlay">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
        </div>
    )
}
