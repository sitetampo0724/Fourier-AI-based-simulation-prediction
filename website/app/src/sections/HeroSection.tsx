import ParticleField from "../components/ParticleField";
import { Github, ExternalLink, BookOpen } from "lucide-react";

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ height: "100vh", background: "#050507" }}
    >
      <ParticleField />

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        {/* Main glass card */}
        <div className="liquid-glass rounded-3xl p-8 md:p-12 max-w-3xl w-full text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/20 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00FFA3] text-sm font-medium mono">
              ML-Powered Harmonic Analysis
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            Harmonic
            <span className="neon-glow-green text-[#00FFA3]">Scope</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-white/70 mb-2 font-light">
            31-Order Harmonic Prediction System
          </p>
          <p className="text-sm md:text-base text-white/50 mb-8 max-w-xl mx-auto">
            Based on machine learning ideal square wave harmonic analysis.
            Input parameters to obtain harmonic predictions with support for 1~31 orders.
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="#console"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#console")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00FFA3] text-[#050507] font-semibold text-sm hover:bg-[#00FFA3]/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,163,0.3)]"
            >
              <ExternalLink size={16} />
              Launch Console
            </a>
            <a
              href="#methodology"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#methodology")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-all duration-300"
            >
              <BookOpen size={16} />
              Methodology
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 text-white/80 font-medium text-sm hover:bg-white/5 transition-all duration-300"
            >
              <Github size={16} />
              Code
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
          <span className="text-xs mono">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </div>
    </section>
  );
}
