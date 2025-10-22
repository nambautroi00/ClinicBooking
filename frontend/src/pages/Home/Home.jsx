import React, { useEffect } from 'react';
import HeroSection from '../../components/home/HeroSection';
import SpecialtiesSection from '../../components/home/SpecialtiesSection';
import ArticlesSection from '../../components/home/ArticlesSection';

const Home = () => {
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
	<div>
	  <HeroSection />
	  <SpecialtiesSection />
	  <ArticlesSection />
	</div>
  );
};

export default Home;
