import { useEffect, useRef } from "react";
import { Database, Settings, Cpu, Layers } from "lucide-react";

const methodologyCards = [
  {
    title: "Signal Generation",
    icon: Database,
    frontImage: "/images/hero-wave.jpg",
    description:
      "Generate ideal square wave signals using scipy.signal.square with configurable frequency (1-1000Hz), amplitude (0.1-10.0), and duty cycle (0.1-0.9). Each signal is sampled at 1000 points per cycle.",
    details: [
      "Frequency range: 1 ~ 1000 Hz",
      "Amplitude range: 0.1 ~ 10.0",
      "Duty cycle: 0.1 ~ 0.9 (step 0.05)",
      "Sampling: 100 ~ 2000 points/cycle",
      "FFT-based spectral analysis",
    ],
    color: "#00FFA3",
  },
  {
    title: "Feature Extraction",
    icon: Settings,
    frontImage: "/images/data-viz.jpg",
    description:
      "Extract 10-dimensional feature vectors from each signal including input parameters, signal statistics (RMS, amplitude), and spectral features (centroid, bandwidth, THD, decay rate).",
    details: [
      "input_freq, input_amplitude, input_duty_cycle",
      "signal_amplitude (peak-to-peak)",
      "signal_rms (root mean square)",
      "rise_time_est (edge detection)",
      "spectral_centroid & bandwidth",
      "THD (total harmonic distortion)",
      "harmonic_decay_rate (1/n fitting)",
    ],
    color: "#00B8FF",
  },
  {
    title: "ML Model (GBDT)",
    icon: Cpu,
    frontImage: "/images/knob-detail.jpg",
    description:
      "Train a Gradient Boosting Decision Tree regressor with 800 estimators, max depth 7, learning rate 0.05. MultiOutputRegressor wraps 16 parallel predictors for each harmonic order.",
    details: [
      "n_estimators: 800 trees",
      "max_depth: 7",
      "learning_rate: 0.05",
      "RobustScaler preprocessing",
      "MultiOutputRegressor wrapper",
      "5-fold cross validation",
      "R² Score: 0.999929",
    ],
    color: "#FFB800",
  },
];

export default function MethodologySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0) rotateX(0deg)";
          }
        });
      },
      { threshold: 0.2 }
    );

    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="methodology"
      ref={sectionRef}
      className="relative w-full py-24 md:py-32"
      style={{ background: "#050507" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/20 mb-4">
            <Layers size={14} className="text-[#00FFA3]" />
            <span className="text-[#00FFA3] text-sm font-medium mono">
              Methodology
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            How It <span className="text-[#00FFA3]">Works</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Our system combines signal processing, feature engineering, and
            gradient boosting to predict harmonic amplitudes with near-perfect
            accuracy.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ perspective: "1000px" }}>
          {methodologyCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className="group relative"
                style={{
                  opacity: 0,
                  transform: `translateY(60px) rotateX(15deg)`,
                  transition: `all 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${idx * 0.15}s`,
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="liquid-glass rounded-2xl overflow-hidden h-full">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={card.frontImage}
                      alt={card.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050507] via-transparent to-transparent" />
                    <div
                      className="absolute top-4 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${card.color}20`, border: `1px solid ${card.color}40` }}
                    >
                      <Icon size={18} style={{ color: card.color }} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3
                      className="text-xl font-bold mb-3"
                      style={{ color: card.color }}
                    >
                      {card.title}
                    </h3>
                    <p className="text-white/60 text-sm leading-relaxed mb-4">
                      {card.description}
                    </p>

                    {/* Details list */}
                    <ul className="space-y-2">
                      {card.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-xs text-white/40"
                        >
                          <span
                            className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: card.color }}
                          />
                          <span className="mono">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
