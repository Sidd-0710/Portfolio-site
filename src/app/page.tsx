import Hero       from '@/components/sections/Hero'
import Projects   from '@/components/sections/Projects'
import Experience from '@/components/sections/Experience'
import Skills     from '@/components/sections/Skills'
import About      from '@/components/sections/About'
import Contact    from '@/components/sections/Contact'
import Footer     from '@/components/Footer'

export default function Home() {
  return (
    <>
      {/* tabIndex lets the "Skip to content" link move focus here */}
      <main id="main" tabIndex={-1}>
        <Hero />
        <Projects />
        <Experience />
        <Skills />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
