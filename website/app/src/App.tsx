import Navigation from "./components/Navigation";
import HeroSection from "./sections/HeroSection";
import MethodologySection from "./sections/MethodologySection";
import ControlDeck from "./sections/ControlDeck";
import ResultsSection from "./sections/ResultsSection";
import CitationSection from "./sections/CitationSection";
import Footer from "./sections/Footer";

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "#050507" }}>
      <Navigation />
      <HeroSection />
      <MethodologySection />
      <ControlDeck />
      <ResultsSection />
      <CitationSection />
      <Footer />
    </div>
  );
}
