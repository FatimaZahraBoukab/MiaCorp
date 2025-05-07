const MetricsOverview = ({ stats }) => {
    return (
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Templates</span>
            <svg
              className="metric-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="metric-value">{stats.totalTemplates}</div>
          <div className="metric-subtitle">Templates disponibles</div>
        </div>
  
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">En attente</span>
            <svg
              className="metric-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="metric-value">{stats.pendingTemplates}</div>
          <div className="metric-subtitle">Templates à vérifier</div>
        </div>
  
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Validés</span>
            <svg
              className="metric-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div className="metric-value">{stats.validatedTemplates}</div>
          <div className="metric-subtitle">Templates validés</div>
        </div>
  
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Rejetés</span>
            <svg
              className="metric-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <div className="metric-value">{stats.rejectedTemplates}</div>
          <div className="metric-subtitle">Templates rejetés</div>
        </div>
      </div>
    )
  }
  
  export default MetricsOverview
  