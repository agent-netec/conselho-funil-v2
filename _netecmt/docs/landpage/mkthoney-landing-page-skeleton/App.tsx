import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import LogoBar from './components/LogoBar';
import Metrics from './components/Metrics';
import Problem from './components/Problem';
import Solution from './components/Solution';
import HowItWorks from './components/HowItWorks';
import Council from './components/Council';
import Features from './components/Features';
import Personas from './components/Personas';
import Comparison from './components/Comparison';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTAFinal from './components/CTAFinal';
import Footer from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <LogoBar />
        <Metrics />
        <Problem />
        <Solution />
        <HowItWorks />
        <Council />
        <Features />
        <Personas />
        <Comparison />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTAFinal />
      </main>

      <Footer />
    </div>
  );
};

export default App;