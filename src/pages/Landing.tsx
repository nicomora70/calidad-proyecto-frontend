import { Bento } from '../components/landing/Bento';
import { Faq } from '../components/landing/Faq';
import { FinalCta, Footer } from '../components/landing/FinalCta';
import { Hero } from '../components/landing/Hero';
import { Navbar } from '../components/landing/Navbar';
import { Steps } from '../components/landing/Steps';
import { useSmoothScroll } from '../lib/smooth-scroll';

export default function Landing() {
  useSmoothScroll();
  return (
    <>
      <Navbar />
      <main className="overflow-x-clip">
        <Hero />
        <Bento />
        <Steps />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
