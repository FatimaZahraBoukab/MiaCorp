"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import "../styles.css"

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: "",
  })

  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      setFormStatus({
        submitted: false,
        error: true,
        message: "Veuillez remplir tous les champs.",
      })
      return
    }

    try {
      const res = await fetch("http://localhost:8000/contact/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Erreur lors de l'envoi")

      setFormStatus({
        submitted: true,
        error: false,
        message: "Votre message a été envoyé avec succès. Nous vous répondrons dans les plus brefs délais.",
      })

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        message: "",
      })
    } catch (err) {
      setFormStatus({
        submitted: false,
        error: true,
        message: "Une erreur est survenue. Veuillez réessayer plus tard.",
      })
    }
  }


  return (
    <section id="contact-section" className="contact-section">
      <div className="container">
        <div className="contact-container">
          <div className="contact-info">
            <h2 className="contact-title">
              <span className="highlight-purple">Contactez-nous</span> pour toute question
            </h2>
            <p className="contact-description">
              Notre équipe de juristes experts est à votre disposition pour répondre à toutes vos questions concernant
              la création ou la modification de votre entreprise.
            </p>

            <div className="contact-details">
              <div className="contact-detail-item">
                <div className="contact-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 6V12L16 14"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="contact-detail-title">Horaires</h3>
                  <p className="contact-detail-text">Du lundi au vendredi, de 9h à 18h</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M5 4H19C20.1046 4 21 4.89543 21 6V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3 6L12 13L21 6"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="contact-detail-title">Email</h3>
                  <p className="contact-detail-text">miacorps.tanger@gmail.com</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="contact-icon-circle">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M22 16.92V19.92C22 20.4704 21.7893 20.9996 21.4142 21.3747C21.0391 21.7498 20.5099 21.9605 19.96 21.96C16.4223 21.6505 13.0418 20.3452 10.17 18.18C7.54566 16.2208 5.39539 13.6155 4.09 10.58C2.97 7.58 1.87 4.08 2.05 0.42C2.05 0.42 2.05 0.42 2.05 0.42C2.05957 -0.129631 2.27033 -0.658721 2.64538 -1.03377C3.02042 -1.40882 3.54951 -1.61958 4.1 -1.63H7.1C8.11 -1.63 8.97 -0.89 9.13 0.09C9.33 1.44 9.67 2.77 10.14 4.03C10.4 4.71 10.18 5.5 9.64 5.97L8.4 7C9.69 9.74 11.92 12.04 14.58 13.38L15.82 12.14C16.29 11.6 17.08 11.38 17.76 11.64C19.0209 12.1116 20.3477 12.4322 21.7 12.6C22.68 12.75 23.42 13.54 23.42 14.47V16.92H22Z"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="contact-detail-title">Téléphone</h3>
                  <p className="contact-detail-text">06 11 95 58 23</p>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-container">
            <div className="contact-form-card">
              <h3 className="form-title">Envoyez-nous un message</h3>

              {formStatus.submitted ? (
                <div className="form-success-message">
                  <div className="success-icon-circle">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M22 4L12 14.01L9 11.01"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <p>{formStatus.message}</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  {formStatus.error && <div className="form-error-message">{formStatus.message}</div>}

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="firstName">Prénom</label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        placeholder="Votre prénom"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Nom</label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Votre adresse email"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Votre message"
                      rows={5}
                    ></textarea>
                  </div>

                  <button type="submit" className="submit-button">
                    <span>Envoyer</span>
                    <Send size={18} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact

