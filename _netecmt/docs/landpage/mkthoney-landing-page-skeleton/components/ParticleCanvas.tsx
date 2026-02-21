import React, { useRef, useEffect } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  color: string
  pulse: number
  pulseSpeed: number
}

type ParticleCanvasProps = {
  className?: string
  particleCount?: number
  colors?: string[]
}

const ParticleCanvas: React.FC<ParticleCanvasProps> = ({
  className = '',
  particleCount = 60,
  colors = ['#F5D060', '#E6B447', '#C99A30', '#AB8648'],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const mouseRef = useRef({ x: -1000, y: -1000 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const initParticles = () => {
      const rect = canvas.getBoundingClientRect()
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * rect.width,
        y: Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2 - 0.1,
        size: Math.random() * 2.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.02 + 0.005,
      }))
    }

    const drawConnections = (particles: Particle[], rect: DOMRect) => {
      const maxDist = 120
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.06
            ctx.strokeStyle = `rgba(230, 180, 71, ${alpha})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      const particles = particlesRef.current
      const mouse = mouseRef.current

      particles.forEach((p) => {
        // Mouse repulsion
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150 && dist > 0) {
          const force = (150 - dist) / 150 * 0.5
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }

        // Damping
        p.vx *= 0.995
        p.vy *= 0.995

        // Move
        p.x += p.vx
        p.y += p.vy

        // Wrap
        if (p.x < -10) p.x = rect.width + 10
        if (p.x > rect.width + 10) p.x = -10
        if (p.y < -10) p.y = rect.height + 10
        if (p.y > rect.height + 10) p.y = -10

        // Pulse opacity
        p.pulse += p.pulseSpeed
        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse))

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color.replace(')', `, ${currentOpacity})`).replace('rgb', 'rgba').replace('#', '')

        // Use hex to rgba conversion
        const hex = p.color
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${currentOpacity})`
        ctx.fill()

        // Glow
        if (p.size > 1.5) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${currentOpacity * 0.15})`)
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
          ctx.fillStyle = gradient
          ctx.fill()
        }
      })

      // Connection lines
      drawConnections(particles, rect)

      animationRef.current = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 }
    }

    resize()
    initParticles()
    animate()

    window.addEventListener('resize', () => {
      resize()
      initParticles()
    })
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationRef.current)
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [particleCount, colors])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ pointerEvents: 'auto' }}
    />
  )
}

export default ParticleCanvas
