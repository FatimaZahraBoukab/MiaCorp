import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerClient } from '../services/auth';
import '../styles/auth.css'; // Importez le fichier CSS

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    confirm_password: '',
    adresse: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Effet d'ondulation pour le bouton
  const createRipple = (event) => {
    const button = event.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.classList.add('ripple');
    
    const existingRipple = button.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    
    button.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérifier que les mots de passe correspondent
    if (formData.mot_de_passe !== formData.confirm_password) {
      setError('Les mots de passe ne correspondent pas');
      setLoading(false);
      return;
    }

    try {
      // Enlever confirm_password avant d'envoyer à l'API
      const { confirm_password, ...clientData } = formData;
      await registerClient(clientData);
      
      // Rediriger vers la page de connexion
      navigate('/login', { 
        state: { message: 'Inscription réussie ! Vous pouvez maintenant vous connecter.' } 
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Formes flottantes supplémentaires */}
      <div className="floating-shape-1"></div>
      <div className="floating-shape-2"></div>
      
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-text">Mia<span style={{ color: '#db5c7a' }}>Corp</span></div>
          </div>
          <h2>Créer un compte client</h2>
          {/*<p className="auth-subtitle">
            Ou{' '}
            <a href="/login">connectez-vous si vous avez déjà un compte</a>
          </p>*/}
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-input-group">
            <div className="auth-form-group">
              <label htmlFor="nom">Nom</label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                className="auth-input"
                placeholder="Votre nom"
                value={formData.nom}
                onChange={handleChange}
              />
            </div>
            
            <div className="auth-form-group">
              <label htmlFor="prenom">Prénom</label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                className="auth-input"
                placeholder="Votre prénom"
                value={formData.prenom}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="auth-input"
              placeholder="Votre adresse email"
              value={formData.email}
              onChange={handleChange}
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </div>
          
          {/*<div className="auth-form-group">
            <label htmlFor="telephone">Téléphone</label>
            <input
              id="telephone"
              name="telephone"
              type="tel"
              className="auth-input"
              placeholder="Votre numéro de téléphone"
              value={formData.telephone}
              onChange={handleChange}
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="adresse">Adresse</label>
            <input
              id="adresse"
              name="adresse"
              type="text"
              className="auth-input"
              placeholder="Votre adresse"
              value={formData.adresse}
              onChange={handleChange}
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>*/}
          
          <div className="auth-form-group">
            <label htmlFor="mot_de_passe">Mot de passe</label>
            <input
              id="mot_de_passe"
              name="mot_de_passe"
              type="password"
              required
              className="auth-input"
              placeholder="Votre mot de passe"
              value={formData.mot_de_passe}
              onChange={handleChange}
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          
          <div className="auth-form-group">
            <label htmlFor="confirm_password">Confirmer mot de passe</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              className="auth-input"
              placeholder="Confirmez votre mot de passe"
              value={formData.confirm_password}
              onChange={handleChange}
            />
            <svg className="input-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="auth-button-container">
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
              onClick={createRipple}
            >
              {loading ? 'Inscription en cours...' : 'S\'inscrire'}
            </button>
          </div>
        </form>
        
        <div className="auth-footer">
          <a href="/login">Déjà inscrit ? Connectez-vous ici</a>
        </div>
      </div>
    </div>
  );
};

export default Register;