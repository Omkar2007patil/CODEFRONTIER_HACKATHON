import React, { useEffect, useRef } from 'react'

/**
 * CyberMatrixBackground
 * Active Theory-inspired interactive knowledge graph canvas animation.
 * Features:
 * - Drifting constellation nodes (Cerulean Cyan & Muted Slate)
 * - Occasional drifting Neon Rose conflict nodes with pulsating glow
 * - Dynamic alpha-blended distance connection lines
 * - Smooth cursor attraction physics
 * - High-DPI screen scaling & 60fps requestAnimationFrame loop with full teardown
 */
export default function CyberMatrixBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const handleResize = () => {
      if (!canvas) return
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Cursor tracking
    const mouse = { x: -1000, y: -1000, active: false }
    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.active = true
    }

    const handleMouseLeave = () => {
      mouse.active = false
      mouse.x = -1000
      mouse.y = -1000
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    // Particle pool setup
    const particleCount = Math.min(Math.floor((width * height) / 16000), 65)
    const particles = []

    for (let i = 0; i < particleCount; i++) {
      const isConflict = i % 8 === 0 // ~12% conflict nodes (Neon Rose)
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: isConflict ? Math.random() * 2 + 2 : Math.random() * 1.5 + 1.2,
        isConflict,
        baseColor: isConflict ? '#ff007f' : '#00f0ff',
        alpha: isConflict ? 0.8 : Math.random() * 0.4 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.03 + Math.random() * 0.02,
      })
    }

    const maxDistance = 140

    // Animation Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Position update
        p.x += p.vx
        p.y += p.vy

        // Screen boundary rebound
        if (p.x < 0) {
          p.x = 0
          p.vx *= -1
        } else if (p.x > width) {
          p.x = width
          p.vx *= -1
        }
        if (p.y < 0) {
          p.y = 0
          p.vy *= -1
        } else if (p.y > height) {
          p.y = height
          p.vy *= -1
        }

        // Mouse gentle attraction / perturbation
        if (mouse.active) {
          const dx = mouse.x - p.x
          const dy = mouse.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 180 && dist > 10) {
            const force = (180 - dist) / 180
            p.x += (dx / dist) * force * 0.6
            p.y += (dy / dist) * force * 0.6
          }
        }

        // Pulse glow
        p.pulsePhase += p.pulseSpeed
        const currentAlpha = p.alpha + Math.sin(p.pulsePhase) * 0.15

        // Draw particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        if (p.isConflict) {
          ctx.fillStyle = `rgba(255, 0, 127, ${Math.max(0.2, currentAlpha)})`
          ctx.shadowColor = '#ff007f'
          ctx.shadowBlur = 12
        } else {
          ctx.fillStyle = `rgba(0, 240, 255, ${Math.max(0.15, currentAlpha)})`
          ctx.shadowColor = '#00f0ff'
          ctx.shadowBlur = 8
        }
        ctx.fill()
        ctx.shadowBlur = 0 // Reset shadow for line performance

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < maxDistance) {
            const lineAlpha = (1 - dist / maxDistance) * 0.22

            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)

            if (p.isConflict || p2.isConflict) {
              ctx.strokeStyle = `rgba(255, 0, 127, ${lineAlpha * 1.3})`
            } else {
              ctx.strokeStyle = `rgba(0, 240, 255, ${lineAlpha})`
            }
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-55"
      style={{ background: 'transparent' }}
    />
  )
}

