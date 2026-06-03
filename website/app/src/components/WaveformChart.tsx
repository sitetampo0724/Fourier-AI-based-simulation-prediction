import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import type { PredictionResult } from "../lib/harmonicEngine";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface WaveformChartProps {
  result: PredictionResult;
  freq: number;
  amplitude: number;
}

export default function WaveformChart({
  result,
  freq,
  amplitude,
}: WaveformChartProps) {
  const { labels, originalData, reconstructedData, upperBound, lowerBound } =
    useMemo(() => {
      const periods = 2;
      const pointsPerPeriod = 500;
      const totalPoints = periods * pointsPerPeriod;
      const T = 1 / freq;

      const labels: string[] = [];
      const originalData: number[] = [];
      const reconstructedData: number[] = [];
      const upperBound: number[] = [];
      const lowerBound: number[] = [];

      for (let i = 0; i <= totalPoints; i++) {
        const t = (i / totalPoints) * periods * T;
        labels.push(t.toFixed(5));

        const phase = (t / T) % 1;
        const orig = phase < 0.5 ? amplitude : -amplitude;
        originalData.push(orig);

        let recon = 0;
        for (const h of result.harmonics) {
          recon +=
            h.predictedAmp * Math.sin(2 * Math.PI * h.order * freq * t);
        }
        reconstructedData.push(recon);

        upperBound.push(Math.max(orig, recon));
        lowerBound.push(Math.min(orig, recon));
      }

      return { labels, originalData, reconstructedData, upperBound, lowerBound };
    }, [result, freq, amplitude]);

  // Downsample
  const skip = 3;
  const dsLabels = labels.filter((_, i) => i % skip === 0);
  const dsOriginal = originalData.filter((_, i) => i % skip === 0);
  const dsReconstructed = reconstructedData.filter((_, i) => i % skip === 0);
  const dsUpper = upperBound.filter((_, i) => i % skip === 0);
  const dsLower = lowerBound.filter((_, i) => i % skip === 0);

  const data: ChartData<"line", number[], string> = {
    labels: dsLabels,
    datasets: [
      // Error band: upper envelope
      {
        label: "_upper",
        data: dsUpper,
        borderColor: "transparent",
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        pointRadius: 0,
        tension: 0.3,
        fill: false,
        order: 0,
      },
      // Error band: lower envelope with fill to upper
      {
        label: "误差区域",
        data: dsLower,
        borderColor: "transparent",
        backgroundColor: "rgba(34, 197, 94, 0.12)",
        pointRadius: 0,
        tension: 0.3,
        fill: "-1",
        order: 1,
      },
      // Reconstructed signal
      {
        label: `重建信号 (${result.harmonics.length}阶谐波)`,
        data: dsReconstructed,
        borderColor: "#EF4444",
        backgroundColor: "transparent",
        borderWidth: 2,
        borderDash: [8, 4],
        pointRadius: 0,
        tension: 0.3,
        order: 2,
      },
      // Original square wave
      {
        label: "原始方波",
        data: dsOriginal,
        borderColor: "#3B82F6",
        backgroundColor: "transparent",
        borderWidth: 2,
        pointRadius: 0,
        tension: 0,
        order: 3,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "rgba(255,255,255,0.7)",
          font: {
            family: "'JetBrains Mono', monospace",
            size: 11,
          },
          usePointStyle: true,
          pointStyleWidth: 12,
          filter: (item) => item.text !== "_upper",
        },
      },
      tooltip: {
        backgroundColor: "rgba(5, 5, 7, 0.9)",
        titleColor: "rgba(255,255,255,0.8)",
        bodyColor: "rgba(255,255,255,0.6)",
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        callbacks: {
          title: () => "",
          label: (ctx) => {
            if (ctx.dataset.label === "_upper") return "";
            const yVal = ctx.parsed.y;
            if (yVal == null) return "";
            return `${ctx.dataset.label}: ${Number(yVal).toFixed(4)}`;
          },
        },
        filter: (item) => item.dataset.label !== "_upper",
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          color: "rgba(255,255,255,0.3)",
          font: { family: "'JetBrains Mono', monospace", size: 9 },
          maxTicksLimit: 8,
          callback: (_value, index: number) => {
            const t = (index / dsLabels.length) * 2;
            return `${t.toFixed(1)}T`;
          },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
        border: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        display: true,
        ticks: {
          color: "rgba(255,255,255,0.3)",
          font: { family: "'JetBrains Mono', monospace", size: 9 },
        },
        grid: { color: "rgba(255,255,255,0.05)" },
        border: { color: "rgba(255,255,255,0.1)" },
        suggestedMin: -amplitude * 1.3,
        suggestedMax: amplitude * 1.3,
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
}
