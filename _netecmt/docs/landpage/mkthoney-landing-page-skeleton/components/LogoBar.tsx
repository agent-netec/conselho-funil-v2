import React from 'react'
import { InfiniteSlider } from './ui/infinite-slider'
import { ProgressiveBlur } from './ui/progressive-blur'

/* Simple inline SVG logos — monochrome, inheriting currentColor */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const FirebaseIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M3.89 15.67L6.07 2.35a.46.46 0 01.88-.1l2.31 4.3L3.89 15.67zM20.11 18.36L17.89 5.44a.46.46 0 00-.79-.21L3.89 18.36l7.37 4.13a.93.93 0 00.91 0l7.94-4.13zM12.07 14.16l-2.72-4.9L13.19 2.8a.46.46 0 01.84 0l2.07 3.88-.09.05-3.94 7.43z" />
  </svg>
)

const PineconeIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <circle cx="12" cy="4" r="2.5" />
    <circle cx="7" cy="9" r="2.5" />
    <circle cx="17" cy="9" r="2.5" />
    <circle cx="5" cy="15" r="2.5" />
    <circle cx="12" cy="14" r="2.5" />
    <circle cx="19" cy="15" r="2.5" />
    <rect x="11" y="16" width="2" height="6" rx="1" />
  </svg>
)

const VercelIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M12 2L2 19.5h20L12 2z" />
  </svg>
)

const NextjsIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M11.57 0C5.17 0 0 5.17 0 11.57c0 5.1 3.29 9.43 7.86 10.97.58.1.79-.25.79-.56v-1.95c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.76 2.69 1.25 3.34.96.1-.74.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.18a10.94 10.94 0 015.72 0c2.19-1.49 3.15-1.18 3.15-1.18.63 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.79.56A11.57 11.57 0 0023.14 11.57C23.14 5.17 17.97 0 11.57 0z" />
  </svg>
)

const StripeIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M13.98 11.01c0-1.65-.8-2.27-2.22-2.27-.83 0-1.62.17-2.43.52L8.93 7.5c.97-.44 2.18-.75 3.56-.75 2.82 0 4.22 1.47 4.22 4.37v5.63h-2.45l-.2-1.2h-.07c-.83.9-1.93 1.44-3.16 1.44-1.97 0-3.25-1.35-3.25-3.16 0-2.28 1.99-3.46 5.4-3.46v-.36zm0 2.37c-2.14 0-3.03.54-3.03 1.57 0 .88.56 1.34 1.44 1.34.95 0 1.59-.7 1.59-1.59v-1.32z" />
  </svg>
)

const ReactIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <circle cx="12" cy="12" r="2.2" />
    <path fill="none" stroke="currentColor" strokeWidth="1" d="M12 7.5c3.87 0 7 1.34 7 3s-3.13 3-7 3-7-1.34-7-3 3.13-3 7-3z" />
    <path fill="none" stroke="currentColor" strokeWidth="1" d="M9.5 9.27c1.93-3.36 4.56-5.36 5.87-4.6 1.3.75.8 4.06-1.14 7.42s-4.56 5.36-5.87 4.6c-1.3-.75-.8-4.06 1.14-7.42z" />
    <path fill="none" stroke="currentColor" strokeWidth="1" d="M9.5 14.73c-1.93-3.36-2.44-6.67-1.14-7.42 1.3-.76 3.94 1.24 5.87 4.6s2.44 6.67 1.14 7.42c-1.3.76-3.94-1.24-5.87-4.6z" />
  </svg>
)

const TailwindIcon = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
    <path d="M12 6C9.33 6 7.67 7.33 7 10c1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C13.4 10.85 14.5 12 17 12c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.6 7.15 14.5 6 12 6zM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C8.4 16.85 9.5 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C10.6 13.15 9.5 12 7 12z" />
  </svg>
)

const logos = [
  { name: 'Google Gemini', Logo: GoogleIcon },
  { name: 'Firebase', Logo: FirebaseIcon },
  { name: 'Pinecone', Logo: PineconeIcon },
  { name: 'Vercel', Logo: VercelIcon },
  { name: 'Next.js', Logo: NextjsIcon },
  { name: 'Stripe', Logo: StripeIcon },
  { name: 'React', Logo: ReactIcon },
  { name: 'Tailwind CSS', Logo: TailwindIcon },
]

const LogoBar: React.FC = () => {
  return (
    <section
      id="logos"
      aria-label="Tecnologias"
      className="relative border-b border-bronze/20 py-10"
    >
      <p className="text-overline mb-8 text-center">
        Construído com tecnologia de
      </p>

      <div className="relative mx-auto max-w-7xl">
        <InfiniteSlider speed={30} gap={48}>
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2.5 px-2 text-sand/40 transition-all duration-300 hover:text-sand"
            >
              <logo.Logo />
              <span className="text-sm font-medium whitespace-nowrap">
                {logo.name}
              </span>
            </div>
          ))}
        </InfiniteSlider>

        {/* Progressive blur edges */}
        <ProgressiveBlur
          className="pointer-events-none absolute left-0 top-0 h-full w-[100px]"
          direction="left"
          blurLayers={6}
          blurIntensity={0.5}
        />
        <ProgressiveBlur
          className="pointer-events-none absolute right-0 top-0 h-full w-[100px]"
          direction="right"
          blurLayers={6}
          blurIntensity={0.5}
        />
      </div>
    </section>
  )
}

export default LogoBar
