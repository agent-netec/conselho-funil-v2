import React from 'react'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'
import { useScroll, motion } from 'framer-motion'
import Logo from './Logo'

const menuItems = [
  { name: 'Funcionalidades', href: '#funcionalidades' },
  { name: 'Como Funciona', href: '#como-funciona' },
  { name: 'O Conselho', href: '#conselho' },
  { name: 'Preços', href: '#precos' },
  { name: 'FAQ', href: '#faq' },
]

const Navbar: React.FC = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const { scrollYProgress } = useScroll()

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setScrolled(latest > 0.05)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  return (
    <header>
      <nav
        data-state={menuState && 'active'}
        className="group fixed z-20 w-full pt-2"
      >
        <div
          className={cn(
            'mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12',
            scrolled && 'bg-background/50 backdrop-blur-2xl'
          )}
        >
          <motion.div
            className={cn(
              'relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6',
              scrolled && 'lg:py-4'
            )}
          >
            {/* Logo + Hamburger */}
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <a href="/" aria-label="MktHoney home" className="flex items-center">
                {/* Icon only on mobile, full logo on desktop */}
                <Logo showText={false} className="h-8 w-auto lg:hidden" />
                <Logo showText={true} className="hidden lg:block h-10 w-auto" />
              </a>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Fechar Menu' : 'Abrir Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 text-cream duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 text-cream opacity-0 duration-200" />
              </button>

              {/* Desktop nav links */}
              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="text-sand hover:text-gold block font-medium duration-150"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Mobile menu + CTA buttons */}
            <div className="bg-surface group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-bronze/30 p-6 shadow-2xl shadow-black/40 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none">
              {/* Mobile nav links */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        onClick={() => setMenuState(false)}
                        className="text-sand hover:text-gold block font-medium duration-150"
                      >
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auth buttons */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <a
                  href="#login"
                  className="btn-outline inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm"
                >
                  Login
                </a>
                <a
                  href="#signup"
                  className="btn-gold inline-flex items-center justify-center whitespace-nowrap px-5 py-2.5 text-sm"
                >
                  Criar Conta Grátis
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
