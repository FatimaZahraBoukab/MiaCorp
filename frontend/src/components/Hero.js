"use client"

import { useState, useEffect } from "react"
import "../styles.css"

const Hero = () => {
  const [currentWord, setCurrentWord] = useState(0)
  const words = ["Démarrez", "Organisez", "Optimisez", "Sécurisez"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="hero">
      <div className="container">
        <h1 className="hero-title">
         <p> <span className="animated-word">{words[currentWord]}</span></p>
          <span className="static-text"> votre entreprise sans effort</span>
        </h1>
        <div className="hero-underline"></div>
        <p className="hero-subtitle">
        Créez et gérez votre entreprise grâce au n° 1 du marché 
        </p>
      </div>
    </section>
  )
}

export default Hero
