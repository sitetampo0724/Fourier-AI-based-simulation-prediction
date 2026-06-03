import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
}

interface MouseState {
  x: number;
  y: number;
  lx: number;
  ly: number;
  sx: number;
  sy: number;
  v: number;
  vs: number;
  set: boolean;
}

interface ParticleFieldOptions {
  speed?: number;
  frequency?: number;
  mouseSize?: number;
  mouseForce?: number;
  particleDensity?: number;
  particleSize?: number;
  color?: string;
  particleDrag?: number;
  returnForce?: number;
}

export default function ParticleField({
  options = {},
}: {
  options?: ParticleFieldOptions;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MouseState>({
    x: -1000,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    set: false,
  });
  const timeRef = useRef(0);

  const opts = {
    speed: 0.001,
    frequency: 2.0,
    mouseSize: 100,
    mouseForce: 0.02,
    particleDensity: 30,
    particleSize: 1.5,
    color: "#00FFA3",
    particleDrag: 0.95,
    returnForce: 0.01,
    ...options,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles(rect.width, rect.height);
    };

    const initParticles = (width: number, height: number) => {
      const particles: Particle[] = [];
      const rows = Math.floor(height / opts.particleDensity);
      const cols = Math.floor(width / opts.particleDensity);
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const px = j * opts.particleDensity + opts.particleDensity / 2;
          const py = i * opts.particleDensity + opts.particleDensity / 2;
          particles.push({
            x: px,
            y: py,
            baseX: px,
            baseY: py,
            vx: 0,
            vy: 0,
          });
        }
      }
      particlesRef.current = particles;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const mouse = mouseRef.current;
      if (!mouse.set) {
        mouse.x = x;
        mouse.lx = x;
        mouse.sx = x;
        mouse.y = y;
        mouse.ly = y;
        mouse.sy = y;
        mouse.set = true;
      } else {
        mouse.x = x;
        mouse.y = y;
      }
    };

    const drawWaves = (width: number, height: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "screen";

      const gradient = ctx.createLinearGradient(0, height / 2, width, height / 2);
      gradient.addColorStop(0, "rgba(0, 255, 163, 0)");
      gradient.addColorStop(0.2, "rgba(0, 255, 163, 0.8)");
      gradient.addColorStop(0.5, "rgba(0, 200, 255, 1)");
      gradient.addColorStop(0.8, "rgba(0, 255, 163, 0.8)");
      gradient.addColorStop(1, "rgba(0, 255, 163, 0)");

      ctx.lineWidth = 2;
      ctx.strokeStyle = gradient;

      drawSingleWave(1, 50, 0.005, 0, width, height);
      drawSingleWave(2, 20, 0.02, Math.PI / 2, width, height);
      drawSingleWave(0.5, 80, 0.003, Math.PI, width, height);

      ctx.restore();
    };

    const drawSingleWave = (
      freqMult: number,
      amp: number,
      freqParam: number,
      phaseOffset: number,
      width: number,
      height: number
    ) => {
      ctx.beginPath();
      for (let x = 0; x < width; x += 2) {
        const y =
          height / 2 +
          Math.sin(x * freqParam + timeRef.current * freqMult + phaseOffset) *
            amp *
            opts.frequency;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const updateParticles = () => {
      const mouse = mouseRef.current;
      const mouseSizeFactor = opts.mouseSize * (1 + mouse.vs * 0.1);

      for (const p of particlesRef.current) {
        const dx = mouse.sx - p.x;
        const dy = mouse.sy - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouseSizeFactor) {
          const force = (mouseSizeFactor - dist) / mouseSizeFactor;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * opts.mouseForce * mouse.vs;
          p.vy += Math.sin(angle) * force * opts.mouseForce * mouse.vs;
        }

        const waveY =
          Math.sin(p.baseX * 0.005 + timeRef.current) *
            50 *
            opts.frequency +
          Math.sin(p.baseX * 0.02 + timeRef.current * 2) * 20;

        p.vx += (p.baseX - p.x) * opts.returnForce;
        p.vy += (p.baseY + waveY - p.y) * opts.returnForce;

        p.vx *= opts.particleDrag;
        p.vy *= opts.particleDrag;

        p.x += p.vx;
        p.y += p.vy;
      }
    };

    const drawParticles = () => {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = opts.color;

      for (const p of particlesRef.current) {
        const speed = Math.hypot(p.vx, p.vy);
        const alpha = Math.min(speed * 0.5, 1);
        ctx.globalAlpha = Math.max(alpha, 0.1);
        const radius = opts.particleSize * (1 + speed * 0.2);
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const loop = (t: number) => {
      timeRef.current = t * opts.speed;
      const mouse = mouseRef.current;

      mouse.sx += (mouse.x - mouse.sx) * 0.1;
      mouse.sy += (mouse.y - mouse.sy) * 0.1;

      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      mouse.v = Math.hypot(dx, dy);
      mouse.vs += (mouse.v - mouse.vs) * 0.1;
      mouse.vs = Math.min(mouse.vs, 10);
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;

      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);
      drawWaves(width, height);
      updateParticles();
      drawParticles();

      animRef.current = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    animRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
      }}
    />
  );
}
