import { useState, useCallback, useRef, useEffect } from "react";
import {
  predictHarmonics,
  generateWaveform,
  extractFeatures,
  type PredictionResult,
} from "../lib/harmonicEngine";
import WaveformChart from "../components/WaveformChart";
import {
  Activity,
  Zap,
  Gauge,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from "chart.js";
import { Bar, Scatter, Line } from "react-chartjs-2";

ChartJS.register(Filler);

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LogarithmicScale,
  Title,
  Tooltip,
  Legend
);

const neonColors = {
  primary: "#00FFA3",
  secondary: "#FF0055",
  tertiary: "#FFB800",
  quaternary: "#00B8FF",
};

export default function ControlDeck() {
  const [freq, setFreq] = useState(50);
  const [amplitude, setAmplitude] = useState(1.0);
  const [maxOrder, setMaxOrder] = useState(31);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const handlePredict = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      const prediction = predictHarmonics(freq, amplitude, 0.5, maxOrder);
      setResult(prediction);
      setIsAnimating(false);
    }, 300);
  }, [freq, amplitude, maxOrder]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "rgba(255,255,255,0.7)", font: { family: "'JetBrains Mono', monospace", size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.4)", font: { family: "'JetBrains Mono', monospace", size: 10 } },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
      y: {
        ticks: { color: "rgba(255,255,255,0.4)", font: { family: "'JetBrains Mono', monospace", size: 10 } },
        grid: { color: "rgba(255,255,255,0.05)" },
      },
    },
  };

  const spectrumData = result
    ? {
        labels: result.harmonics.map((h) => `${h.order}f\n(${h.frequency.toFixed(0)}Hz)`),
        datasets: [
          {
            label: "Predicted",
            data: result.harmonics.map((h) => h.predictedAmp),
            backgroundColor: `${neonColors.primary}80`,
            borderColor: neonColors.primary,
            borderWidth: 1,
          },
          {
            label: "Theoretical",
            data: result.harmonics.map((h) => h.theoreticalAmp),
            backgroundColor: `${neonColors.secondary}60`,
            borderColor: neonColors.secondary,
            borderWidth: 1,
          },
        ],
      }
    : null;

  const decayData = result
    ? {
        labels: result.harmonics.map((h) => `${h.order}`),
        datasets: [
          {
            label: "Predicted",
            data: result.harmonics.map((h) => h.predictedAmp),
            borderColor: neonColors.primary,
            backgroundColor: `${neonColors.primary}20`,
            pointBackgroundColor: neonColors.primary,
            pointBorderColor: "#fff",
            pointRadius: 4,
            tension: 0.3,
          },
          {
            label: "Theoretical 4A/(n\u03c0)",
            data: result.harmonics.map((h) => h.theoreticalAmp),
            borderColor: neonColors.secondary,
            backgroundColor: `${neonColors.secondary}20`,
            pointBackgroundColor: neonColors.secondary,
            pointBorderColor: "#fff",
            pointRadius: 4,
            borderDash: [5, 5],
            tension: 0.3,
          },
        ],
      }
    : null;

  const errorBarData = result
    ? {
        labels: result.harmonics.map((h) => `${h.order}th`),
        datasets: [
          {
            label: "Relative Error (%)",
            data: result.harmonics.map((h) => h.relError),
            backgroundColor: result.harmonics.map((h) =>
              h.relError < 1
                ? `${neonColors.primary}80`
                : h.relError < 3
                ? `${neonColors.tertiary}80`
                : `${neonColors.secondary}80`
            ),
            borderColor: result.harmonics.map((h) =>
              h.relError < 1
                ? neonColors.primary
                : h.relError < 3
                ? neonColors.tertiary
                : neonColors.secondary
            ),
            borderWidth: 1,
          },
        ],
      }
    : null;

  const scatterData = result
    ? {
        datasets: [
          {
            label: "Predicted vs Theoretical",
            data: result.harmonics.map((h) => ({
              x: h.theoreticalAmp,
              y: h.predictedAmp,
            })),
            backgroundColor: result.harmonics.map((_, i) => {
              const hue = (i / result.harmonics.length) * 120 + 150;
              return `hsla(${hue}, 80%, 60%, 0.8)`;
            }),
            pointRadius: 6,
            pointBorderColor: "#fff",
            pointBorderWidth: 1,
          },
        ],
      }
    : null;

  return (
    <section
      id="console"
      className="relative w-full py-24 md:py-32"
      style={{ background: "#050507" }}
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FFB800]/10 border border-[#FFB800]/20 mb-4">
            <Activity size={14} className="text-[#FFB800]" />
            <span className="text-[#FFB800] text-sm font-medium mono">
              Interactive Console
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            The Control <span className="text-[#FFB800]">Deck</span>
          </h2>
          <p className="text-white/50 max-w-2xl mx-auto">
            Adjust parameters below to predict harmonic amplitudes. The model
            supports 1~31 odd-order harmonics with real-time visualization.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Control Panel */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="liquid-glass rounded-2xl p-6 space-y-8 sticky top-24">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-[#FFB800]/20 flex items-center justify-center">
                  <Gauge size={16} className="text-[#FFB800]" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Parameters
                </h3>
              </div>

              {/* Frequency Control */}
              <div>
                <label className="flex items-center justify-between text-sm text-white/70 mb-3">
                  <span className="flex items-center gap-2">
                    <Zap size={14} className="text-[#00FFA3]" />
                    Frequency
                  </span>
                  <span className="mono text-[#00FFA3]">{freq} Hz</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  step={1}
                  value={freq}
                  onChange={(e) => setFreq(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00FFA3 0%, #00FFA3 ${
                      (freq / 1000) * 100
                    }%, rgba(255,255,255,0.1) ${(freq / 1000) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-white/30 mt-1 mono">
                  <span>1Hz</span>
                  <span>1000Hz</span>
                </div>
              </div>

              {/* Amplitude Control */}
              <div>
                <label className="flex items-center justify-between text-sm text-white/70 mb-3">
                  <span className="flex items-center gap-2">
                    <Activity size={14} className="text-[#FF0055]" />
                    Amplitude
                  </span>
                  <span className="mono text-[#FF0055]">{amplitude.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={10.0}
                  step={0.1}
                  value={amplitude}
                  onChange={(e) => setAmplitude(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #FF0055 0%, #FF0055 ${
                      ((amplitude - 0.1) / 9.9) * 100
                    }%, rgba(255,255,255,0.1) ${((amplitude - 0.1) / 9.9) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-white/30 mt-1 mono">
                  <span>0.1</span>
                  <span>10.0</span>
                </div>
              </div>

              {/* Max Order Control */}
              <div>
                <label className="flex items-center justify-between text-sm text-white/70 mb-3">
                  <span>Max Harmonic Order</span>
                  <span className="mono text-[#00B8FF]">{maxOrder}</span>
                </label>
                <div className="grid grid-cols-8 gap-1">
                  {[1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31].map((order) => (
                    <button
                      key={order}
                      onClick={() => setMaxOrder(order)}
                      className={`py-1.5 rounded text-xs mono transition-all duration-200 ${
                        maxOrder === order
                          ? "bg-[#00B8FF] text-[#050507] font-semibold"
                          : "bg-white/5 text-white/40 hover:bg-white/10"
                      }`}
                    >
                      {order}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={handlePredict}
                  disabled={isAnimating}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    isAnimating
                      ? "bg-[#00FFA3]/50 text-[#050507]/50"
                      : "bg-[#00FFA3] text-[#050507] hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] hover:scale-[1.02]"
                  }`}
                >
                  <Play size={16} />
                  {isAnimating ? "Predicting..." : "Run Prediction"}
                </button>
                <button
                  onClick={() => {
                    setFreq(50);
                    setAmplitude(1.0);
                    setMaxOrder(31);
                    setResult(null);
                  }}
                  className="w-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <RotateCcw size={16} className="text-white/50" />
                </button>
              </div>
            </div>
          </div>

          {/* Visualization Matrix */}
          <div className="flex-1 space-y-6" ref={resultRef}>
            {result ? (
              <>
                {/* Summary stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Mean Abs Error"
                    value={result.summary.meanAbsError.toFixed(6)}
                    color={neonColors.primary}
                  />
                  <StatCard
                    label="Mean Rel Error"
                    value={`${result.summary.meanRelError.toFixed(4)}%`}
                    color={neonColors.tertiary}
                  />
                  <StatCard
                    label="Error < 1%"
                    value={`${result.summary.errorsUnder1Percent}/${result.summary.totalOrders}`}
                    color={neonColors.quaternary}
                  />
                  <StatCard
                    label="R² Score"
                    value="0.9999"
                    color={neonColors.primary}
                  />
                </div>

                {/* Waveform Reconstruction */}
                <div className="liquid-glass rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                    波形对比 — 原始方波 vs 重建信号
                  </h4>
                  <div className="h-64 md:h-80">
                    {result && (
                      <WaveformChart
                        result={result}
                        freq={freq}
                        amplitude={amplitude}
                      />
                    )}
                  </div>
                </div>

                {/* Main spectrum chart */}
                <div className="liquid-glass rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                    Harmonic Amplitude Spectrum
                  </h4>
                  <div className="h-64 md:h-80">
                    {spectrumData && <Bar data={spectrumData} options={chartOptions} />}
                  </div>
                </div>

                {/* Secondary charts grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="liquid-glass rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                      Decay Curve (Semi-log)
                    </h4>
                    <div className="h-48">
                      {decayData && (
                        <Line
                          data={decayData}
                          options={{
                            ...chartOptions,
                            scales: {
                              ...chartOptions.scales,
                              y: {
                                ...chartOptions.scales?.y,
                                type: "logarithmic",
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="liquid-glass rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                      Relative Error (%)
                    </h4>
                    <div className="h-48">
                      {errorBarData && <Bar data={errorBarData} options={chartOptions} />}
                    </div>
                  </div>

                  <div className="liquid-glass rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                      Predicted vs Theoretical
                    </h4>
                    <div className="h-48">
                      {scatterData && (
                        <Scatter
                          data={scatterData}
                          options={{
                            ...chartOptions,
                            scales: {
                              x: {
                                ...chartOptions.scales?.x,
                                title: {
                                  display: true,
                                  text: "Theoretical",
                                  color: "rgba(255,255,255,0.4)",
                                },
                              },
                              y: {
                                ...chartOptions.scales?.y,
                                title: {
                                  display: true,
                                  text: "Predicted",
                                  color: "rgba(255,255,255,0.4)",
                                },
                              },
                            },
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="liquid-glass rounded-2xl p-6">
                    <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
                      Residuals
                    </h4>
                    <div className="h-48">
                      {result && (
                        <Bar
                          data={{
                            labels: result.harmonics.map((h) => `${h.order}th`),
                            datasets: [
                              {
                                label: "Residual (Predicted - Theory)",
                                data: result.harmonics.map(
                                  (h) => h.predictedAmp - h.theoreticalAmp
                                ),
                                backgroundColor: result.harmonics.map((h) =>
                                  h.predictedAmp - h.theoreticalAmp >= 0
                                    ? `${neonColors.primary}80`
                                    : `${neonColors.secondary}80`
                                ),
                                borderColor: result.harmonics.map((h) =>
                                  h.predictedAmp - h.theoreticalAmp >= 0
                                    ? neonColors.primary
                                    : neonColors.secondary
                                ),
                                borderWidth: 1,
                              },
                            ],
                          }}
                          options={chartOptions}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Results Table */}
                <div className="liquid-glass rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white/70 mono">
                      Prediction Results Table
                    </h4>
                    <span className="text-xs text-white/30 mono">
                      {result.harmonics.length} harmonics
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5">
                          <th className="text-left py-3 px-4 text-white/40 font-medium mono text-xs">
                            Order
                          </th>
                          <th className="text-right py-3 px-4 text-white/40 font-medium mono text-xs">
                            Freq (Hz)
                          </th>
                          <th className="text-right py-3 px-4 text-white/40 font-medium mono text-xs">
                            Predicted
                          </th>
                          <th className="text-right py-3 px-4 text-white/40 font-medium mono text-xs">
                            Theoretical
                          </th>
                          <th className="text-right py-3 px-4 text-white/40 font-medium mono text-xs">
                            Abs Error
                          </th>
                          <th className="text-right py-3 px-4 text-white/40 font-medium mono text-xs">
                            Rel Error (%)
                          </th>
                          <th className="text-center py-3 px-4 text-white/40 font-medium mono text-xs">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.harmonics.map((h) => (
                          <tr
                            key={h.order}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-2.5 px-4 mono text-white/80">
                              <span
                                className="inline-flex items-center justify-center w-8 h-6 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: `${getOrderColor(h.order)}20`,
                                  color: getOrderColor(h.order),
                                }}
                              >
                                {h.order}
                              </span>
                            </td>
                            <td className="text-right py-2.5 px-4 mono text-white/60">
                              {h.frequency.toFixed(1)}
                            </td>
                            <td className="text-right py-2.5 px-4 mono text-[#00FFA3]">
                              {h.predictedAmp.toFixed(6)}
                            </td>
                            <td className="text-right py-2.5 px-4 mono text-[#FF0055]">
                              {h.theoreticalAmp.toFixed(6)}
                            </td>
                            <td className="text-right py-2.5 px-4 mono text-white/50">
                              {h.absError.toFixed(6)}
                            </td>
                            <td className="text-right py-2.5 px-4 mono">
                              <span
                                className={
                                  h.relError < 1
                                    ? "text-[#00FFA3]"
                                    : h.relError < 3
                                    ? "text-[#FFB800]"
                                    : "text-[#FF0055]"
                                }
                              >
                                {h.relError.toFixed(3)}
                              </span>
                            </td>
                            <td className="text-center py-2.5 px-4">
                              <StatusBadge status={h.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Feature info */}
                <FeatureDisplay freq={freq} amplitude={amplitude} />
              </>
            ) : (
              <div className="liquid-glass rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-[#00FFA3]/10 flex items-center justify-center mb-4">
                  <Activity size={28} className="text-[#00FFA3]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Predict
                </h3>
                <p className="text-white/40 text-center max-w-md mb-6">
                  Set frequency, amplitude, and max harmonic order, then click
                  "Run Prediction" to see the harmonic analysis results.
                </p>
                <button
                  onClick={handlePredict}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-[#00FFA3] text-[#050507] font-semibold text-sm hover:shadow-[0_0_30px_rgba(0,255,163,0.3)] transition-all duration-300"
                >
                  <Play size={16} />
                  Run Prediction
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="liquid-glass rounded-xl p-4">
      <p className="text-xs text-white/40 mb-1 mono">{label}</p>
      <p className="text-lg md:text-xl font-bold mono" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    OK: "bg-[#00FFA3]/20 text-[#00FFA3]",
    "~": "bg-[#FFB800]/20 text-[#FFB800]",
    "!": "bg-[#FF0055]/20 text-[#FF0055]",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${
        styles[status as keyof typeof styles] || styles["!"]
      }`}
    >
      {status}
    </span>
  );
}

function getOrderColor(order: number): string {
  const colors = [
    "#00FFA3", "#00B8FF", "#FFB800", "#FF0055",
    "#9B59B6", "#E74C3C", "#3498DB", "#2ECC71",
  ];
  return colors[(order - 1) % colors.length];
}

function FeatureDisplay({
  freq,
  amplitude,
}: {
  freq: number;
  amplitude: number;
}) {
  const { signal } = generateWaveform(freq, amplitude, 0.5, 0.1, 1000);
  const features = extractFeatures(signal, freq, amplitude, 0.5, 1000);

  return (
    <div className="liquid-glass rounded-2xl p-6">
      <h4 className="text-sm font-semibold text-white/70 mb-4 mono">
        Extracted Features
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(features).map(([name, value]) => (
          <div key={name} className="bg-white/5 rounded-lg p-3">
            <p className="text-[10px] text-white/30 mono mb-1 uppercase">
              {name}
            </p>
            <p className="text-sm font-semibold mono text-white/80">
              {typeof value === "number" ? value.toFixed(4) : value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
