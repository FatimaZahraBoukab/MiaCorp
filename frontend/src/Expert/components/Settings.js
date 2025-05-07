"use client"

const Settings = ({ theme, toggleTheme }) => {
  return (
    <div className="settings-container">
      <h2>Paramètres</h2>

      <div className="settings-section">
        <h3>Apparence</h3>
        <div className="setting-item">
          <label>Thème</label>
          <div className="theme-toggle">
            <button
              className={`theme-button ${theme === "light" ? "active" : ""}`}
              onClick={theme === "dark" ? toggleTheme : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              Clair
            </button>
            <button
              className={`theme-button ${theme === "dark" ? "active" : ""}`}
              onClick={theme === "light" ? toggleTheme : undefined}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              Sombre
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Compte</h3>
        <div className="setting-item">
          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("token")
              window.location.href = "/login"
            }}
          >
            Déconnexion
          </button>
        </div>
      </div>

      <div className="settings-section">
        <h3>À propos</h3>
        <div className="setting-item">
          <p>Version: 1.0.0</p>
          <p>© 2023 MiaCorp. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  )
}

export default Settings
