import { Github, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative w-full py-12 border-t border-white/5" style={{ background: "#050507" }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00FFA3]/10 flex items-center justify-center">
              <span className="text-[#00FFA3] font-bold text-sm">H</span>
            </div>
            <span className="text-white/80 font-semibold">
              Harmonic<span className="text-[#00FFA3]">Scope</span>
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            <a
              href="#methodology"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#methodology")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Methodology
            </a>
            <a
              href="#console"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#console")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Console
            </a>
            <a
              href="#results"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#results")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Results
            </a>
            <a
              href="#citation"
              onClick={(e) => {
                e.preventDefault();
                document.querySelector("#citation")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Citation
            </a>
          </div>

          {/* Social */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <Github size={16} className="text-white/50" />
            </a>
            <a
              href="#"
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ExternalLink size={16} className="text-white/50" />
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30 mono">
            31-Order Harmonic Prediction System. Built with React + TypeScript.
          </p>
          <p className="text-xs text-white/30 flex items-center gap-1">
            Made with <Heart size={10} className="text-[#FF0055]" /> for signal processing research
          </p>
        </div>
      </div>
    </footer>
  );
}
