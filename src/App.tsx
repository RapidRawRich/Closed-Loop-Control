import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProcessType, LoopParameters, LoopState } from './types';
import { ThreeViewport } from './components/ThreeViewport';
import { StripChart } from './components/StripChart';
import { ControlPanel } from './components/ControlPanel';
import { TheoryPanel } from './components/TheoryPanel';
import { QuizModal } from './components/QuizModal';
import {
  Activity,
  Award,
  HelpCircle,
  RotateCcw,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  Flame,
  Waves,
  Truck,
  Building2,
} from 'lucide-react';

const DT = 0.05; // Simulation timestep in seconds (20 Hz)
const DELAY_BUFFER_MAX = 300; // max 15 seconds buffer

export default function App() {
  // Current Process Type
  const [processType, setProcessType] = useState<ProcessType>('firstOrder');

  // Loop Tuning Parameters
  const [params, setParams] = useState<LoopParameters>({
    kc: 2.0,
    invTi: 0.5,
    tau1: 2.5,
    tauD: 0.5,
    kp: 1.0,
  });

  // Loop Dynamic States
  const [sp, setSp] = useState<number>(50.0);
  const [pv, setPv] = useState<number>(50.0);
  const [co, setCo] = useState<number>(50.0);
  const [loadDisturbance, setLoadDisturbance] = useState<number>(0.0);
  const [stability, setStability] = useState<'steady' | 'transient' | 'oscillating' | 'unstable'>('steady');
  const [trayStates, setTrayStates] = useState<[number, number, number, number]>([50, 50, 50, 50]);

  // Strip chart paused state
  const [isPaused, setIsPaused] = useState(false);

  // Quiz Modal State
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // Internal physics engine buffers and state refs
  const physicsRef = useRef({
    integralSum: 0,
    pv: 50.0,
    co: 50.0,
    sp: 50.0,
    coDelayBuffer: new Float32Array(DELAY_BUFFER_MAX).fill(50.0),
    bufferHead: 0,
    tray1: 50.0,
    tray2: 50.0,
    tray3: 50.0,
    tray4: 50.0,
    load: 0.0,
    peakHistory: [] as number[],
    lastPeakTime: 0,
    sampleCount: 0,
  });

  // Sync state to physicsRef
  useEffect(() => {
    physicsRef.current.sp = sp;
  }, [sp]);

  useEffect(() => {
    physicsRef.current.load = loadDisturbance;
  }, [loadDisturbance]);

  // Handle Tuning Parameter Change
  const handleParamsChange = (newParams: Partial<LoopParameters>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  };

  // Reset Loop State to steady
  const handleResetLoop = useCallback(() => {
    const phys = physicsRef.current;
    phys.integralSum = 0;
    phys.pv = sp;
    phys.co = 50.0;
    phys.coDelayBuffer.fill(50.0);
    phys.tray1 = sp;
    phys.tray2 = sp;
    phys.tray3 = sp;
    phys.tray4 = sp;
    phys.peakHistory = [];
    setPv(sp);
    setCo(50.0);
    setLoadDisturbance(0);
    setTrayStates([sp, sp, sp, sp]);
    setStability('steady');
  }, [sp]);

  // Process Selection Handler
  const handleProcessTypeChange = (type: ProcessType) => {
    setProcessType(type);
    // Set appropriate default tuning for the selected process
    if (type === 'firstOrder') {
      setParams({ kc: 3.0, invTi: 0.5, tau1: 2.5, tauD: 0.2, kp: 1.0 });
    } else if (type === 'integrating') {
      setParams({ kc: 1.8, invTi: 0.0, tau1: 2.0, tauD: 0.1, kp: 1.0 }); // P-only by default for integrating
    } else if (type === 'deadTime') {
      setParams({ kc: 1.8, invTi: 0.0, tau1: 1.0, tauD: 2.0, kp: 1.0 });
    } else if (type === 'multiCapacity') {
      setParams({ kc: 2.2, invTi: 0.4, tau1: 3.2, tauD: 0.8, kp: 1.0 });
    }
    handleResetLoop();
  };

  // Trigger Load Disturbance Pulse or Toggle
  const handleTriggerLoadDisturbance = () => {
    setLoadDisturbance((prev) => (prev > 0 ? 0 : 25));
  };

  // Preset Configurations
  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'quarterDecay') {
      setProcessType('firstOrder');
      setParams({ kc: 3.2, invTi: 0.6, tau1: 2.5, tauD: 0.6, kp: 1.0 });
      setSp(65);
      setLoadDisturbance(0);
    } else if (presetName === 'criticalOscillation') {
      setProcessType('deadTime');
      setParams({ kc: 2.2, invTi: 0.0, tau1: 1.0, tauD: 2.0, kp: 1.0 });
      setSp(50);
      setLoadDisturbance(0);
    } else if (presetName === 'unstable') {
      setProcessType('multiCapacity');
      setParams({ kc: 4.5, invTi: 1.2, tau1: 2.0, tauD: 1.5, kp: 1.0 });
      setSp(60);
      setLoadDisturbance(0);
    } else if (presetName === 'ponlyOffset') {
      setProcessType('firstOrder');
      setParams({ kc: 2.0, invTi: 0.0, tau1: 2.0, tauD: 0.0, kp: 1.0 }); // P-only
      setSp(70);
      setLoadDisturbance(0);
    }
  };

  // Load Preset from Quiz Question
  const handleLoadQuizPreset = (config: {
    process: ProcessType;
    kc: number;
    invTi: number;
    tau1: number;
    tauD: number;
    sp: number;
    load: number;
  }) => {
    setProcessType(config.process);
    setParams({
      kc: config.kc,
      invTi: config.invTi,
      tau1: config.tau1,
      tauD: config.tauD,
      kp: 1.0,
    });
    setSp(config.sp);
    setLoadDisturbance(config.load);
    handleResetLoop();
  };

  // Physics Simulation Interval Loop
  useEffect(() => {
    const timer = setInterval(() => {
      if (isPaused) return;

      const phys = physicsRef.current;
      phys.sampleCount++;

      // 1. Controller Calculations (PI Controller)
      const currentSP = phys.sp;
      const currentPV = phys.pv;
      const error = currentSP - currentPV;

      // Proportional term
      const pTerm = params.kc * error;

      // Integral term (with anti-windup clamping)
      if (params.invTi > 0) {
        phys.integralSum += params.kc * (params.invTi / 60.0) * error * DT * 10.0;
        phys.integralSum = Math.max(-45, Math.min(45, phys.integralSum));
      } else {
        phys.integralSum = 0; // P-only mode
      }

      // Controller Output: Bias (50%) + P + I
      let computedCO = 50.0 + pTerm + phys.integralSum;
      computedCO = Math.max(0.0, Math.min(100.0, computedCO));
      phys.co = computedCO;

      // 2. Dead Time Ring Buffer Update
      const delaySteps = Math.min(DELAY_BUFFER_MAX - 1, Math.max(0, Math.round(params.tauD / DT)));
      phys.coDelayBuffer[phys.bufferHead] = computedCO;
      const readIdx = (phys.bufferHead - delaySteps + DELAY_BUFFER_MAX) % DELAY_BUFFER_MAX;
      const delayedCO = phys.coDelayBuffer[readIdx];
      phys.bufferHead = (phys.bufferHead + 1) % DELAY_BUFFER_MAX;

      // 3. Process Dynamics Engine
      const load = phys.load;

      if (processType === 'firstOrder') {
        // Gp(s) = Kp / (1 + tau1*s)
        // dPV/dt = [Kp * delayedCO + Load - PV] / tau1
        const targetPV = params.kp * delayedCO + load;
        const dpv = (targetPV - phys.pv) / Math.max(0.2, params.tau1);
        phys.pv += dpv * DT;
      } else if (processType === 'integrating') {
        // Gp(s) = 1 / (tauI * s)
        // Liquid Tank: Inflow = delayedCO, Outflow = 50% base + load
        // dLevel/dt = (Inflow - Outflow) / tauI
        const inflow = delayedCO;
        const outflow = 50.0 + load;
        const rate = (inflow - outflow) / (Math.max(0.5, params.tau1) * 3.0);
        phys.pv += rate * DT * 5.0;
      } else if (processType === 'deadTime') {
        // Pure transport delay along conveyor: Gp(s) = Kp * e^(-tauD*s)
        // Slight sensor lag filter
        const targetPV = params.kp * delayedCO + load;
        const filterLag = Math.max(0.1, params.tau1 * 0.3);
        const dpv = (targetPV - phys.pv) / filterLag;
        phys.pv += dpv * DT;
      } else if (processType === 'multiCapacity') {
        // 4 Cascaded Trays in Series: Gp(s) = Kp / (1 + tau_i*s)^4
        const subTau = Math.max(0.2, params.tau1 / 4.0);

        // Tray 1
        const target1 = delayedCO + load;
        phys.tray1 += ((target1 - phys.tray1) / subTau) * DT;

        // Tray 2
        phys.tray2 += ((phys.tray1 - phys.tray2) / subTau) * DT;

        // Tray 3
        phys.tray3 += ((phys.tray2 - phys.tray3) / subTau) * DT;

        // Tray 4 (Final PV)
        phys.tray4 += ((phys.tray3 - phys.tray4) / subTau) * DT;

        phys.pv = phys.tray4;
      }

      // Hard clamp physical bounds
      phys.pv = Math.max(0.0, Math.min(100.0, phys.pv));

      // Stability Evaluation
      const errMag = Math.abs(currentSP - phys.pv);
      if (errMag < 0.8 && Math.abs(phys.co - 50.0) < 5.0) {
        setStability('steady');
      } else if (params.kc > 5.0 && params.tauD > 1.2) {
        setStability('oscillating');
      } else if (params.kc > 12.0) {
        setStability('unstable');
      } else {
        setStability('transient');
      }

      // Sync to React State every frame
      setPv(phys.pv);
      setCo(phys.co);
      if (processType === 'multiCapacity') {
        setTrayStates([phys.tray1, phys.tray2, phys.tray3, phys.tray4]);
      }
    }, DT * 1000);

    return () => clearInterval(timer);
  }, [params, processType, isPaused]);

  const loopState: LoopState = {
    sp,
    pv,
    co,
    error: sp - pv,
    integralSum: physicsRef.current.integralSum,
    loadDisturbance,
    trayStates,
    stability,
  };

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. SCADA Industrial Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 shadow-sm">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-wide">
                NWP Closed Loop Control 3D Simulator
              </h1>
              <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                ILM 310305cA
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Instrument Technician Quiz Prep</span>
              <span>&bull;</span>
              <span className="text-amber-300 font-medium">
                {processType === 'firstOrder' && 'Heat Exchanger (First-Order)'}
                {processType === 'integrating' && 'Level Vessel (Integrating)'}
                {processType === 'deadTime' && 'Conveyor Scale (Pure Dead Time)'}
                {processType === 'multiCapacity' && 'Distillation Tower (Multicapacity)'}
              </span>
            </div>
          </div>
        </div>

        {/* Live HUD Readouts */}
        <div className="hidden md:flex items-center gap-4 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">SP:</span>
            <span className="font-bold text-amber-300">{sp.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">PV:</span>
            <span className="font-bold text-emerald-400">{pv.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">CO:</span>
            <span className="font-bold text-sky-400">{co.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Error:</span>
            <span className={`font-bold ${Math.abs(sp - pv) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(sp - pv).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <span className="text-slate-400">Loop Status:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                stability === 'steady'
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800'
                  : stability === 'transient'
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800'
                  : stability === 'oscillating'
                  ? 'bg-amber-950/60 text-amber-300 border border-amber-800 animate-pulse'
                  : 'bg-rose-950/60 text-rose-300 border border-rose-800 animate-pulse'
              }`}
            >
              {stability}
            </span>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-open-quiz"
            onClick={() => setIsQuizOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-sm"
          >
            <Award size={15} />
            <span>Quiz Prep (10 Qs)</span>
          </button>

          <button
            id="btn-header-reset"
            onClick={handleResetLoop}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            title="Reset Loop"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Work Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Interactive Control & Tuning Panel */}
        <aside className="w-full lg:w-80 shrink-0 h-64 lg:h-full overflow-hidden border-b lg:border-b-0">
          <ControlPanel
            processType={processType}
            onProcessTypeChange={handleProcessTypeChange}
            params={params}
            onParamsChange={handleParamsChange}
            sp={sp}
            onSpChange={setSp}
            loadDisturbance={loadDisturbance}
            onTriggerLoadDisturbance={handleTriggerLoadDisturbance}
            onResetLoop={handleResetLoop}
            onApplyPreset={handleApplyPreset}
          />
        </aside>

        {/* Center Column: 3D Viewport on top + Real-Time Strip Chart on bottom */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-slate-950">
          {/* Top Half: 3D Perspective WebGL Viewport */}
          <div className="flex-1 relative min-h-[220px]">
            <ThreeViewport
              processType={processType}
              loopState={loopState}
              loopParams={params}
            />
          </div>

          {/* Bottom Half: 3-Channel Strip Chart Recorder */}
          <div className="h-44 sm:h-52 shrink-0">
            <StripChart
              sp={sp}
              pv={pv}
              co={co}
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              onClear={() => {}}
            />
          </div>
        </main>

        {/* Right Column: ILM Theory & Formula Guide */}
        <aside className="w-full lg:w-84 shrink-0 h-64 lg:h-full overflow-hidden border-t lg:border-t-0">
          <TheoryPanel
            processType={processType}
            params={params}
            state={loopState}
          />
        </aside>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onLoadPreset={handleLoadQuizPreset}
      />
    </div>
  );
}
