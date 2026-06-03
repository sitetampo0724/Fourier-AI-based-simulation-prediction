import { useEffect, useRef, useState } from "react";
import { Award, Target, TrendingUp, BarChart3 } from "lucide-react";

const metrics = [
  {
    label: "R² Score",
    value: "0.9999",
    description: "Model explains 99.99% of data variance",
    icon: Target,
    color: "#00FFA3",
  },
  {
    label: "RMSE",
    value: "0.0044",
    description: "Root mean square error",
    icon: BarChart3,
    color: "#00B8FF",
  },
  {
    label: "MAE",
    value: "0.0012",
    description: "Mean absolute error",
    icon: TrendingUp,
    color: "#FFB800",
  },
  {
    label: "CV R²",
    value: "0.9998",
    description: "5-fold cross validation",
    icon: Award,
    color: "#FF0055",
  },
];

const modelConfig = [
  { param: "Base Learner", value: "GradientBoostingRegressor" },
  { param: "n_estimators", value: "800" },
  { param: "max_depth", value: "7" },
  { param: "learning_rate", value: "0.05" },
  { param: "min_samples_split", value: "3" },
  { param: "min_samples_leaf", value: "2" },
  { param: "subsample", value: "0.9" },
  { param: "max_features", value: "sqrt" },
  { param: "Scaler", value: "RobustScaler" },
  { param: "Wrapper", value: "MultiOutputRegressor" },
];

export default function ResultsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="results"
      ref={sectionRef}
      className="relative w-full py-24 md:py-32"
      style={{ background: "#050507" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF0055]/10 border border-[#FF0055]/20 mb-4">
            <Award size={14} className="text-[#FF0055]" />
            <span className="text-[#FF0055] text-sm font-medium mono">
              Performance
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Model <span className="text-[#FF0055]">Performance</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Trained on 5000 samples with 5-fold cross validation. The model
            achieves near-perfect accuracy across all 31 harmonic orders.
          </p>
        </div>

        {/* Kinetic typography metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {metrics.map((metric, idx) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`liquid-glass rounded-2xl p-6 text-center transition-all duration-1000 ${
                  visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: `${metric.color}15`,
                    border: `1px solid ${metric.color}30`,
                  }}
                >
                  <Icon size={20} style={{ color: metric.color }} />
                </div>
                <p
                  className="text-3xl md:text-4xl font-bold mono mb-2"
                  style={{ color: metric.color }}
                >
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-white/70 mb-1">
                  {metric.label}
                </p>
                <p className="text-xs text-white/40">{metric.description}</p>
              </div>
            );
          })}
        </div>

        {/* Model configuration table */}
        <div className="liquid-glass rounded-2xl overflow-hidden mb-16">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">
              Model Configuration
            </h3>
            <p className="text-sm text-white/40 mt-1">
              Gradient Boosting hyperparameters optimized for harmonic amplitude
              prediction
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {modelConfig.map((row, idx) => (
                  <tr
                    key={row.param}
                    className={`border-b border-white/5 ${
                      idx % 2 === 0 ? "bg-white/[0.02]" : ""
                    }`}
                  >
                    <td className="py-3 px-6 text-sm text-white/60 mono w-1/2">
                      {row.param}
                    </td>
                    <td className="py-3 px-6 text-sm text-[#00FFA3] mono font-medium">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature importance */}
        <div className="liquid-glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Feature Importance (Permutation)
          </h3>
          <div className="space-y-4">
            {[
              { name: "input_amplitude", importance: 0.2483, std: 0.0111 },
              { name: "signal_amplitude", importance: 0.2070, std: 0.0089 },
              { name: "signal_rms", importance: 0.1769, std: 0.0075 },
              { name: "spectral_centroid", importance: 0.0001, std: 0.0000 },
              { name: "spectral_bandwidth", importance: 0.0001, std: 0.0000 },
              { name: "input_freq", importance: 0.0, std: 0.0 },
              { name: "rise_time_est", importance: 0.0, std: 0.0 },
              { name: "harmonic_decay_rate", importance: 0.0, std: 0.0 },
              { name: "input_duty_cycle", importance: 0.0, std: 0.0 },
              { name: "THD", importance: 0.0, std: 0.0 },
            ].map((feature) => (
              <div key={feature.name} className="flex items-center gap-4">
                <div className="w-40 flex-shrink-0">
                  <p className="text-xs mono text-white/60 truncate">
                    {feature.name}
                  </p>
                </div>
                <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: visible
                        ? `${Math.min(feature.importance * 400, 100)}%`
                        : "0%",
                      backgroundColor:
                        feature.importance > 0.1
                          ? "#00FFA3"
                          : feature.importance > 0
                          ? "#00B8FF"
                          : "transparent",
                    }}
                  />
                </div>
                <div className="w-32 flex-shrink-0 text-right">
                  <span className="text-xs mono text-white/60">
                    {feature.importance > 0
                      ? `${feature.importance.toFixed(4)} \u00b1 ${feature.std.toFixed(4)}`
                      : "~0.0000"}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-[#FFB800]/5 border border-[#FFB800]/10">
            <p className="text-xs text-[#FFB800]/80 leading-relaxed">
              <span className="font-semibold">Note:</span> Amplitude-related
              features dominate importance as they directly determine harmonic
              magnitudes via the 4A/(n&pi;) relationship. Spectral features show
              minimal impact because the model learns that ideal square waves
              always follow 1/n decay.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
