
import React from 'react';
import Navbar from './Navbar';
import Hero from './Hero';
import About from './About';
import HowItWorks from './HowItWorks';
import Domains from './Domains';
import CommunityFeatures from './CommunityFeatures';
import Events from './Events';
import Team from './Team';
import CallToAction from './CallToAction';
import Footer from './Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <About />
        <HowItWorks />
        <Domains />
        <CommunityFeatures />
        <Events />
        <Team />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
