import React, { useState, useRef, useEffect, useCallback } from 'react'

const VIDEOS = [
  '/hero-video-1.mp4',
  '/hero-video-2.mp4',
  '/hero-video-3.mp4',
  '/hero-video-4.mp4',
]

const TRANSITION_DURATION = 1500 // ms for crossfade
const CLIP_DURATION = 7000 // ms before starting transition to next

const VideoCarousel: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState<number | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  const startTransition = useCallback(() => {
    const next = (activeIndex + 1) % VIDEOS.length
    setNextIndex(next)
    setTransitioning(true)

    // Play the next video from the start
    const nextVideo = videoRefs.current[next]
    if (nextVideo) {
      nextVideo.currentTime = 0
      nextVideo.play().catch(() => {})
    }

    // After crossfade completes, swap active
    setTimeout(() => {
      setActiveIndex(next)
      setNextIndex(null)
      setTransitioning(false)

      // Pause the old video
      const oldVideo = videoRefs.current[activeIndex]
      if (oldVideo) {
        oldVideo.pause()
      }
    }, TRANSITION_DURATION)
  }, [activeIndex])

  useEffect(() => {
    // Start the first video
    const firstVideo = videoRefs.current[0]
    if (firstVideo) {
      firstVideo.play().catch(() => {})
    }
  }, [])

  useEffect(() => {
    // Schedule next transition
    timerRef.current = setTimeout(startTransition, CLIP_DURATION)
    return () => clearTimeout(timerRef.current)
  }, [activeIndex, startTransition])

  return (
    <div className={`absolute inset-0 ${className}`}>
      {VIDEOS.map((src, i) => {
        const isActive = i === activeIndex
        const isNext = i === nextIndex
        const visible = isActive || isNext

        return (
          <video
            key={src}
            ref={(el) => { videoRefs.current[i] = el }}
            muted
            loop
            playsInline
            preload={i <= 1 ? 'auto' : 'metadata'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              opacity: isActive ? 1 : isNext && transitioning ? 1 : 0,
              zIndex: isNext ? 2 : isActive ? 1 : 0,
              transition: `opacity ${TRANSITION_DURATION}ms ease-in-out`,
              visibility: visible ? 'visible' : 'hidden',
            }}
          >
            <source src={src} type="video/mp4" />
          </video>
        )
      })}
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 z-[3] bg-background/50" />
    </div>
  )
}

export default VideoCarousel
