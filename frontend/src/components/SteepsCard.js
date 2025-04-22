import "../styles.css"

const SteepsCard = ({ icon, number, title, description, showArrow }) => {
  return (
    <div className="service-card">
      <div className="card-content">
        {icon}
        <h3 className="card-title">{title}</h3>
        <p className="card-description">{description}</p>
      </div>
     
    </div>
  )
}

export default SteepsCard
