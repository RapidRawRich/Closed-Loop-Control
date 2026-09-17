import React from 'react';
import { ProcessType, LoopParameters } from '../types';
import {
  Sliders,
  Flame,
  Waves,
  Truck,
  Building2,
  TrendingUp,
  AlertTriangle,
  Zap,
  RotateCcw,
} from 'lucide-react';

interface ControlPanelProps {
  processType: ProcessType;
  onProcessTypeChange: (type: ProcessType) => void;
  params: LoopParameters;
  onParamsChange: (newParams: Partial<LoopParameters>) => void;
  sp: number;
  onSpChange: (newSp: number) => void;
  loadDisturbance: number;
  onTriggerLoadDisturbance: () => void;
  onResetLoop: () => void;
  onApplyPreset: (presetName: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  processType,
  onProcessTypeChange,
  params,
  onParamsChange,
  sp,
  onSpChange,
  loadDisturbance,
  onTriggerLoadDisturbance,
  onResetLoop,
  onApplyPreset,
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/95 border-r border-slate-800 overflow-y-auto p-3.5 space-y-4 text-slate-200">
      {/* 1. Equipment Selection Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <Sliders size={13} className="text-cyan-400" />
            Process & Equipment Scenario
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            id="btn-select-first-order"
            onClick={() => onProcessTypeChange('firstOrder')}
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition ${
              processType === 'firstOrder'
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Flame size={16} className={processType === 'firstOrder' ? 'text-amber-400' : 'text-slate-500'} />
            <div className="leading-tight">
              <div className="font-semibold">Heat Exchanger</div>
              <div className="text-[10px] opacity-75">Obj 2: First-Order</div>
            </div>
          </button>

          <button
            id="btn-select-integrating"
            onClick={() => onProcessTypeChange('integrating')}
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition ${
              processType === 'integrating'
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Waves size={16} className={processType === 'integrating' ? 'text-blue-400' : 'text-slate-500'} />
            <div className="leading-tight">
              <div className="font-semibold">Liquid Tank</div>
              <div className="text-[10px] opacity-75">Obj 3: Integrating</div>
            </div>
          </button>

          <button
            id="btn-select-dead-time"
            onClick={() => onProcessTypeChange('deadTime')}
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition ${
              processType === 'deadTime'
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Truck size={16} className={processType === 'deadTime' ? 'text-emerald-400' : 'text-slate-500'} />
            <div className="leading-tight">
              <div className="font-semibold">Conveyor Belt</div>
              <div className="text-[10px] opacity-75">Obj 4: Dead Time</div>
            </div>
          </button>

          <button
            id="btn-select-multicapacity"
            onClick={() => onProcessTypeChange('multiCapacity')}
            className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition ${
              processType === 'multiCapacity'
                ? 'bg-cyan-950/70 border-cyan-500/80 text-cyan-200 shadow-sm'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Building2 size={16} className={processType === 'multiCapacity' ? 'text-purple-400' : 'text-slate-500'} />
            <div className="leading-tight">
              <div className="font-semibold">Distillation</div>
              <div className="text-[10px] opacity-75">Obj 5: Multicapacity</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Setpoint & Disturbance Step Controls */}
      <div className="bg-slate-800/40 rounded-lg p-2.5 border border-slate-700/50 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Setpoint (SP) & Load</span>
          <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            SP: {sp.toFixed(1)}%
          </span>
        </div>

        {/* Setpoint Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            id="btn-sp-step-down"
            onClick={() => onSpChange(Math.max(10, sp - 10))}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
          >
            <span>-10% SP</span>
          </button>

          <button
            id="btn-sp-reset-50"
            onClick={() => onSpChange(50)}
            className="flex items-center justify-center py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-slate-700 transition active:scale-95"
          >
            <span>SP 50%</span>
          </button>

          <button
            id="btn-sp-step-up"
            onClick={() => onSpChange(Math.min(90, sp + 10))}
            className="flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-95"
          >
            <span>+10% SP</span>
          </button>
        </div>

        {/* Load Disturbance Trigger */}
        <button
          id="btn-trigger-load-disturbance"
          onClick={onTriggerLoadDisturbance}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition shadow-sm active:scale-98 ${
            loadDisturbance > 0
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/80 shadow-amber-900/20 animate-pulse'
              : 'bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80'
          }`}
        >
          <Zap size={14} className={loadDisturbance > 0 ? 'text-amber-400' : 'text-rose-400'} />
          <span>{loadDisturbance > 0 ? 'Active Load Disturbance (+25%) - Click to Clear' : 'Trigger +25% Load Disturbance'}</span>
        </button>
      </div>

      {/* 3. Real-Time Tuning Parameters */}
      <div className="space-y-3.5">
        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          Loop Parameters & Tuning
        </div>

        {/* Controller Gain (Kc) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              Controller Gain (K<sub>c</sub>)
            </span>
            <span className="font-mono font-bold text-cyan-300">{params.kc.toFixed(2)}</span>
          </div>
          <input
            id="slider-kc"
            type="range"
            min="0.1"
            max="20.0"
            step="0.1"
            value={params.kc}
            onChange={(e) => onParamsChange({ kc: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.1 (Sluggish)</span>
            <span>Critical Gain (Kcu)</span>
            <span>20.0 (High)</span>
          </div>
        </div>

        {/* Integral Action (1/Ti) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              Reset Rate (1/T<sub>i</sub> repeats/min)
            </span>
            <span className="font-mono font-bold text-cyan-300">
              {params.invTi === 0 ? '0.0 (P-Only)' : `${params.invTi.toFixed(2)} /min`}
            </span>
          </div>
          <input
            id="slider-invti"
            type="range"
            min="0.0"
            max="4.0"
            step="0.05"
            value={params.invTi}
            onChange={(e) => onParamsChange({ invTi: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.0 (P-Only Offset)</span>
            <span>PI Closed Loop</span>
            <span>4.0 (Fast Reset)</span>
          </div>
        </div>

        {/* Process Dead Time (tau_D) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              Dead Time (&tau;<sub>D</sub>)
            </span>
            <span className="font-mono font-bold text-cyan-300">{params.tauD.toFixed(1)}s</span>
          </div>
          <input
            id="slider-taud"
            type="range"
            min="0.0"
            max="6.0"
            step="0.1"
            value={params.tauD}
            onChange={(e) => onParamsChange({ tauD: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.0s (No Delay)</span>
            <span>Transport Lag</span>
            <span>6.0s (Severe)</span>
          </div>
        </div>

        {/* Process Time Constant (tau_1) */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1">
              Time Constant (&tau;<sub>1</sub>)
            </span>
            <span className="font-mono font-bold text-cyan-300">{params.tau1.toFixed(1)}s</span>
          </div>
          <input
            id="slider-tau1"
            type="range"
            min="0.5"
            max="8.0"
            step="0.1"
            value={params.tau1}
            onChange={(e) => onParamsChange({ tau1: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>0.5s (Fast)</span>
            <span>Thermal/Capacity Lag</span>
            <span>8.0s (Slow)</span>
          </div>
        </div>
      </div>

      {/* 4. Instant Preset Scenarios for Exam Prep */}
      <div>
        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1">
          <TrendingUp size={12} className="text-amber-400" />
          Test Response Presets
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs">
          <button
            id="btn-preset-quarter-decay"
            onClick={() => onApplyPreset('quarterDecay')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            <span>Quarter Amplitude (1/4 Decay)</span>
            <span className="text-[10px] font-mono text-emerald-400">Optimum</span>
          </button>

          <button
            id="btn-preset-critical-oscillation"
            onClick={() => onApplyPreset('criticalOscillation')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            <span>Sustained Oscillation (Kcu)</span>
            <span className="text-[10px] font-mono text-amber-400">180° / Gain=1</span>
          </button>

          <button
            id="btn-preset-unstable"
            onClick={() => onApplyPreset('unstable')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-rose-300 transition"
          >
            <span className="flex items-center gap-1">
              <AlertTriangle size={12} className="text-rose-400" /> Growing Oscillation
            </span>
            <span className="text-[10px] font-mono text-rose-400">Unstable</span>
          </button>

          <button
            id="btn-preset-ponly-offset"
            onClick={() => onApplyPreset('ponlyOffset')}
            className="flex items-center justify-between px-2.5 py-1.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
          >
            <span>P-Only Offset Demonstration</span>
            <span className="text-[10px] font-mono text-cyan-400">CLSG &lt; 1</span>
          </button>
        </div>
      </div>

      {/* Reset Loop Button */}
      <button
        id="btn-reset-full-loop"
        onClick={onResetLoop}
        className="mt-auto flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition"
      >
        <RotateCcw size={13} />
        <span>Reset Loop to Steady State</span>
      </button>
    </div>
  );
};
