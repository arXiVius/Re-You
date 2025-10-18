import React, { useEffect, useRef } from "react";

interface ReactiveGridProps {
  gridSize?: number;  // distance between dots
  radius?: number;    // cursor influence radius
  dotSize?: number;   // dot radius
  color?: string;     // color of dots (rgba recommended)
  speed?: number;     // how fast dots return to base position
  breatheSpeed?: number; // breathing cycle speed (seconds)
  breatheAmount?: number; // breathing strength (0.0–0.3 looks natural)
}

const ReactiveGrid: React.FC<ReactiveGridProps> = ({
  gridSize = 40,
  radius = 100,
  dotSize = 1.4,
  color = "rgba(255,255,255,0.02)",
  speed = 0.08,
  breatheSpeed = 6,
  breatheAmount = 0.15,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const dots = useRef<{ x: number; y: number; baseX: number; baseY: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      dots.current = [];
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          dots.current.push({ x, y, baseX: x, baseY: y });
        }
      }
    };
    resize();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resize);

    let time = 0;

    const animate = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.016; // ~60fps

      const breathe = 1 + Math.sin(time / breatheSpeed) * breatheAmount;

      for (const dot of dots.current) {
        const dx = mouse.current.x - dot.baseX;
        const dy = mouse.current.y - dot.baseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius) {
          const force = (radius - dist) / radius;
          dot.x = dot.baseX - dx * force * 0.25;
          dot.y = dot.baseY - dy * force * 0.25;
        } else {
          dot.x += (dot.baseX - dot.x) * speed;
          dot.y += (dot.baseY - dot.y) * speed;
        }
      }

      ctx.fillStyle = color;
      for (const dot of dots.current) {
        const breatheX = dot.x * breathe;
        const breatheY = dot.y * breathe;
        ctx.beginPath();
        ctx.arc(breatheX, breatheY, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
    };
  }, [gridSize, radius, dotSize, color, speed, breatheSpeed, breatheAmount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 -z-10 pointer-events-none"
    />
  );
};

export default ReactiveGrid;
