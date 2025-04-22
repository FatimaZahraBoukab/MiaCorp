"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import "../styles.css"

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  const testimonials = [
    {
      quote: "« J'avais besoin de créer mon entreprise rapidement. »",
      text: "J'ai été accompagné de bout en bout et le service client était très sympathique. Je recommande .",
      name: "Karim Fellaouine",
      title: "GM France Urban",
      image: "/images/per1.jpg",
    },
    {
      quote: "« Simple et efficace. »",
      text: "Captain Juridique c'était ce dont j'avais besoin : un site clair et des juristes compétents pour s'occuper de mon dossier.",
      name: "Sara Mennillo",
      title: "Fondateur de uTip",
      image: "/images/per3.jpg",
    },
    {
      quote: "« Je n'y connaissais rien, je voulais être accompagnée. »",
      text: "Captain Juridique c'était ce dont j'avais besoin : un site clair et des juristes compétents pour s'occuper de mon dossier.",
      name: "Ahmad Chamseddine",
      title: "Co-fondateur de ThalerTech",
      image: "/images/per2.jpg",
    },
    {
      quote: "« J'ai été surpris par la simplicité et rapidité du service. »",
      text: "Une fois le formulaire rempli, on fournit les justificatifs et l'équipe s'occupe de tout. Service de qualité, je recommande.",
      name: "Hajar Barrada",
      title: "CEO Alegria.tech",
      image: "/images/per4.jpg",
    },
  ]

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
  }

  // Calculer les indices des témoignages précédent et suivant
  const prevIndex = (currentIndex - 1 + testimonials.length) % testimonials.length
  const nextIndex = (currentIndex + 1) % testimonials.length

  return (
    <section className="testimonials-section">
       <div className="testimonials-title-container">
       <h2 className="testimonials-title">
          <span className="highlight-purple1">Nos clients</span> parlent de nous
        </h2>
      </div>
      <div className="testimonials-container">
        {/* Témoignage précédent (partiellement visible à gauche) */}
        <div className="testimonial-side testimonial-left">
          <div className="testimonial-side-content">
            <p className="testimonial-side-quote"></p>
            <div className="testimonial-side-author">
              <p className="testimonial-side-name"></p>
              <p className="testimonial-side-company"></p>
            </div>
          </div>
        </div>

        {/* Témoignage principal (au centre) */}
      
        <div className="testimonial-main">
          <div className="testimonial-image">
            <img src={testimonials[currentIndex].image || "/placeholder.svg"} alt={testimonials[currentIndex].name} />
          </div>
          <div className="testimonial-content">
            <p className="testimonial-quote">{testimonials[currentIndex].quote}</p>
            <p className="testimonial-text">{testimonials[currentIndex].text}</p>
            <div className="testimonial-author">
              <p className="testimonial-name">{testimonials[currentIndex].name}</p>
              <p className="testimonial-company">
                {testimonials[currentIndex].title.includes("de ") ? "Repreneuse des " : ""}
                <span className="company-name">
                  {testimonials[currentIndex].title.includes("de ")
                    ? testimonials[currentIndex].title.split("de ")[1]
                    : testimonials[currentIndex].title}
                </span>
              
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="testimonial-navigation">
            <button className="nav-button prev-button" onClick={prevSlide}>
              <ChevronLeft size={24} />
            </button>
            <button className="nav-button next-button" onClick={nextSlide}>
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        {/* Témoignage suivant (partiellement visible à droite) */}
        <div className="testimonial-side testimonial-right">
          <div className="testimonial-side-content">
            <p className="testimonial-side-quote"></p>
            <div className="testimonial-side-author">
              <p className="testimonial-side-name"></p>
              <p className="testimonial-side-company"></p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
