import React from 'react';
import { ProcessType, LoopParameters } from '../types';
import { Timer, Clock, Layers, ChevronRight, Gauge } from 'lucide-react';

interface ProcessDynamicsBarProps {
  processType: ProcessType;
  params: LoopParameters;
  onParamsChange: (newParams: Partial<LoopParameters>) => void;
  trayStates: [number, number, number, number];
}

export const ProcessDynamicsBar: React.FC<ProcessDynamicsBarProps> = ({
  processType,
  params,
  onParamsChange,
  trayStates,
}) => {
  const handleNudgeTauD = (delta: number) => {
    const next = Math.max(0.0, Math.min(8.0, +(params.tauD + delta).toFixed(1)));
    onParamsChange({ tauD: next });
  };

  const handleNudgeTau1 = (delta: number) => {
    const next = Math.max(0.2, Math.min(10.0, +(params.tau1 + delta).toFixed(1)));
    onParamsChange({ tau1: next });
  };

  return (
    <div
      id="process-dynamics-quick-bar"
      className="bg-slate-900/95 border-y border-slate-800 px-3.5 py-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs shadow-inner"
    >
      {/* Label and Mode Indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-cyan-950/70 border border-cyan-700/60 text-cyan-300 font-semibold text-[11px] tracking-wide uppercase">
          <Gauge size={13} className="text-cyan-400" />
          <span>Real-Time Dynamics</span>
        </div>

        {/* Dynamic Process-Specific Badge */}
        {processType === 'multiCapacity' && (
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-[11px] font-mono text-purple-300">
            <Layers size={12} className="text-purple-400" />
            <span className="text-slate-400">4-Stage Cascade:</span>
            <span className="text-emerald-400">T1: {trayStates[0].toFixed(0)}%</span>
            <ChevronRight size={10} className="text-slate-500" />
            <span className="text-cyan-400">T2: {trayStates[1].toFixed(0)}%</span>
            <ChevronRight size={10} className="text-slate-500" />
            <span className="text-sky-400">T3: {trayStates[2].toFixed(0)}%</span>
            <ChevronRight size={10} className="text-slate-500" />
            <span className="text-amber-400 font-bold">T4: {trayStates[3].toFixed(0)}%</span>
          </div>
        )}
      </div>

      {/* Sliders Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
        {/* Real-time Slider: Dead Time (tau_D) */}
        <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1 text-slate-300 shrink-0 w-24">
            <Timer size={13} className="text-amber-400" />
            <span className="font-semibold text-[11px]">Dead Time &tau;<sub>D</sub></span>
          </div>

          <button
            onClick={() => handleNudgeTauD(-0.5)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 transition active:scale-95"
            title="Decrease Dead Time by 0.5s"
          >
            -0.5
          </button>

          <input
            id="quick-slider-taud"
            type="range"
            min="0.0"
            max="6.0"
            step="0.1"
            value={params.tauD}
            onChange={(e) => onParamsChange({ tauD: parseFloat(e.target.value) })}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          <button
            onClick={() => handleNudgeTauD(0.5)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 transition active:scale-95"
            title="Increase Dead Time by 0.5s"
          >
            +0.5
          </button>

          <span className="font-mono font-bold text-amber-300 text-xs w-12 text-right shrink-0">
            {params.tauD.toFixed(1)}s
          </span>
        </div>

        {/* Real-time Slider: Time Constant (tau_1) */}
        <div className="flex items-center gap-2 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1 text-slate-300 shrink-0 w-24">
            <Clock size={13} className="text-cyan-400" />
            <span className="font-semibold text-[11px]">Time Const &tau;<sub>1</sub></span>
          </div>

          <button
            onClick={() => handleNudgeTau1(-0.5)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 transition active:scale-95"
            title="Decrease Time Constant by 0.5s"
          >
            -0.5
          </button>

          <input
            id="quick-slider-tau1"
            type="range"
            min="0.2"
            max="8.0"
            step="0.1"
            value={params.tau1}
            onChange={(e) => onParamsChange({ tau1: parseFloat(e.target.value) })}
            className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          <button
            onClick={() => handleNudgeTau1(0.5)}
            className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 border border-slate-700 transition active:scale-95"
            title="Increase Time Constant by 0.5s"
          >
            +0.5
          </button>

          <span className="font-mono font-bold text-cyan-300 text-xs w-12 text-right shrink-0">
            {params.tau1.toFixed(1)}s
          </span>
        </div>
      </div>
    </div>
  );
};
