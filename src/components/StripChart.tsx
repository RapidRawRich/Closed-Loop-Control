import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface StripChartProps {
  sp: number;
  pv: number;
  co: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onClear: () => void;
}

const BUFFER_LENGTH = 320;

export const StripChart: React.FC<StripChartProps> = ({
  sp,
  pv,
  co,
  isPaused,
  onTogglePause,
  onClear,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // History ring buffers
  const historyRef = useRef<{
    sp: Float32Array;
    pv: Float32Array;
    co: Float32Array;
  }>({
    sp: new Float32Array(BUFFER_LENGTH).fill(50),
    pv: new Float32Array(BUFFER_LENGTH).fill(50),
    co: new Float32Array(BUFFER_LENGTH).fill(50),
  });

  const [hoverData, setHoverData] = useState<{
    x: number;
    spVal: number;
    pvVal: number;
    coVal: number;
  } | null>(null);

  // Clear data handler
  useEffect(() => {
    // When parent signals clear or on reset
  }, [onClear]);

  // Push new sample every animation frame or interval
  useEffect(() => {
    if (isPaused) return;

    const hist = historyRef.current;
    // Shift left
    for (let i = 0; i < BUFFER_LENGTH - 1; i++) {
      hist.sp[i] = hist.sp[i + 1];
      hist.pv[i] = hist.pv[i + 1];
      hist.co[i] = hist.co[i + 1];
    }
    hist.sp[BUFFER_LENGTH - 1] = sp;
    hist.pv[BUFFER_LENGTH - 1] = pv;
    hist.co[BUFFER_LENGTH - 1] = co;
  }, [sp, pv, co, isPaused]);

  // Render loop for canvas
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;

      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Gridlines (0, 25, 50, 75, 100%)
      const steps = [0, 25, 50, 75, 100];
      ctx.lineWidth = 1 * dpr;
      steps.forEach((pct) => {
        const y = h - (pct / 100) * (h - 20 * dpr) - 10 * dpr;
        ctx.strokeStyle = pct === 50 ? 'rgba(148, 163, 184, 0.25)' : 'rgba(51, 65, 85, 0.4)';
        ctx.beginPath();
        ctx.moveTo(35 * dpr, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#64748b';
        ctx.font = `${9 * dpr}px monospace`;
        ctx.textAlign = 'right';
        ctx.fillText(`${pct}%`, 30 * dpr, y + 3 * dpr);
      });

      // 2. Vertical timeline divisions
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.2)';
      const xSpan = w - 40 * dpr;
      for (let i = 0; i <= 6; i++) {
        const x = 38 * dpr + (i / 6) * xSpan;
        ctx.beginPath();
        ctx.moveTo(x, 10 * dpr);
        ctx.lineTo(x, h - 10 * dpr);
        ctx.stroke();
      }

      // Draw Traces
      const hist = historyRef.current;
      const drawTrace = (arr: Float32Array, color: string, strokeWidth: number, isDashed = false) => {
        ctx.lineWidth = strokeWidth * dpr;
        ctx.strokeStyle = color;
        ctx.setLineDash(isDashed ? [4 * dpr, 4 * dpr] : []);
        ctx.beginPath();

        for (let i = 0; i < BUFFER_LENGTH; i++) {
          const x = 38 * dpr + (i / (BUFFER_LENGTH - 1)) * xSpan;
          const val = Math.max(0, Math.min(100, arr[i]));
          const y = h - (val / 100) * (h - 20 * dpr) - 10 * dpr;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Order of drawing: CO (blue/cyan), SP (amber), PV (bright emerald)
      drawTrace(hist.co, 'rgba(56, 189, 248, 0.55)', 1.5, true);  // Blue: Controller Output (CO)
      drawTrace(hist.sp, '#fbbf24', 2.0, true);                   // Yellow/Amber: Setpoint (SP)
      drawTrace(hist.pv, '#10b981', 2.5, false);                  // Green: Process Variable (PV)

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const paddingLeft = 38;
    const chartW = rect.width - paddingLeft;

    if (mouseX < paddingLeft || mouseX > rect.width) {
      setHoverData(null);
      return;
    }

    const ratio = (mouseX - paddingLeft) / chartW;
    const index = Math.round(ratio * (BUFFER_LENGTH - 1));
    const hist = historyRef.current;

    setHoverData({
      x: mouseX,
      spVal: hist.sp[index] ?? 50,
      pvVal: hist.pv[index] ?? 50,
      coVal: hist.co[index] ?? 50,
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const clearHistory = () => {
    historyRef.current.sp.fill(sp);
    historyRef.current.pv.fill(pv);
    historyRef.current.co.fill(co);
    onClear();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-900/90 border-t border-slate-800 p-2.5">
      {/* Top Header & Legend Controls */}
      <div className="flex items-center justify-between pb-1.5 px-2 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-sm"></span>
            <span className="font-semibold text-slate-300">SP (Setpoint):</span>
            <span className="font-mono text-amber-300 font-bold">{sp.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            <span className="font-semibold text-slate-300">PV (Measured):</span>
            <span className="font-mono text-emerald-400 font-bold">{pv.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block shadow-sm"></span>
            <span className="font-semibold text-slate-300">CO (Output):</span>
            <span className="font-mono text-sky-300 font-bold">{co.toFixed(1)}%</span>
          </div>

          {hoverData && (
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-700 text-[11px] font-mono text-slate-400">
              <span>Cursor:</span>
              <span className="text-amber-300">SP:{hoverData.spVal.toFixed(1)}%</span>
              <span className="text-emerald-400">PV:{hoverData.pvVal.toFixed(1)}%</span>
              <span className="text-sky-300">CO:{hoverData.coVal.toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-pause-chart"
            onClick={onTogglePause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play size={12} /> : <Pause size={12} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            id="btn-clear-chart"
            onClick={clearHistory}
            className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition"
            title="Reset strip chart buffer"
          >
            <RotateCcw size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative flex-1 w-full min-h-[110px] mt-1">
        <canvas
          ref={canvasRef}
          id="strip-chart-canvas"
          className="w-full h-full cursor-crosshair block"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </div>
  );
};
