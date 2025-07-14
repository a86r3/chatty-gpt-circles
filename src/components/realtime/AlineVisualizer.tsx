import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AlineVisualizerProps {
  isRecording: boolean;
  isConnected: boolean;
  audioLevel: number;
}

const AlineVisualizer = ({ isRecording, isConnected, audioLevel }: AlineVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const barsRef = useRef(Array.from({ length: 32 }, () => Math.random() * 0.5));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Background circle
      ctx.strokeStyle = isConnected ? '#00ff88' : '#444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2 - 10, 0, Math.PI * 2);
      ctx.stroke();

      // Audio bars in circle
      const bars = barsRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 3;

      bars.forEach((bar, i) => {
        const angle = (i / bars.length) * Math.PI * 2;
        const intensity = isRecording ? (bar + audioLevel) : bar * 0.3;
        
        const startX = centerX + Math.cos(angle) * radius;
        const startY = centerY + Math.sin(angle) * radius;
        const endX = centerX + Math.cos(angle) * (radius + intensity * 60);
        const endY = centerY + Math.sin(angle) * (radius + intensity * 60);

        ctx.strokeStyle = isRecording ? '#00ff88' : (isConnected ? '#0088ff' : '#444');
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Animate bars
        bars[i] += (Math.random() - 0.5) * 0.1;
        bars[i] = Math.max(0.1, Math.min(1, bars[i]));
      });

      // Center glow
      if (isConnected) {
        const glowSize = isRecording ? 20 + audioLevel * 30 : 15;
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
        gradient.addColorStop(0, isRecording ? 'rgba(0, 255, 136, 0.8)' : 'rgba(0, 136, 255, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording, isConnected, audioLevel]);

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={200}
        height={200}
        className="w-full h-full"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={cn(
          "w-4 h-4 rounded-full transition-all duration-300",
          isConnected ? (isRecording ? "bg-green-500 animate-pulse" : "bg-blue-500") : "bg-gray-500"
        )} />
      </div>
    </div>
  );
};

export default AlineVisualizer;