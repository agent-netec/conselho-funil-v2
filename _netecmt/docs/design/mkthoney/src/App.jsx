import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/ui/glassmorphism-trust-hero';
import Features from './components/Features';
import Philosophy from './components/Philosophy';
import Protocol from './components/Protocol';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import StackedCircularFooter from './components/ui/stacked-circular-footer';

function App() {
  return (
    <div className="relative min-h-screen text-[#2A2A35] selection:bg-[#C9A84C] selection:text-[#0D0D12] overflow-x-hidden font-heading">
      <div className="noise-overlay" />
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Philosophy />
        <Protocol />
        <Pricing />
        <FAQ />
      </main>
      <StackedCircularFooter />
    </div>
  );
}

export default App;
