import React from 'react';
import { ProcessType, LoopParameters, LoopState } from '../types';
import { BookOpen, Calculator, Info, ShieldCheck, AlertCircle } from 'lucide-react';

interface TheoryPanelProps {
  processType: ProcessType;
  params: LoopParameters;
  state: LoopState;
}

export const TheoryPanel: React.FC<TheoryPanelProps> = ({
  processType,
  params,
  state,
}) => {
  const loopGain = params.kc * params.kp;
  const clsg = loopGain / (1 + loopGain);
  const cltc = params.tau1 / (1 + loopGain);
  const offset = (1 - clsg) * (state.sp - 50);

  // Theoretical Period of Oscillation
  let toscTheo = 0;
  if (processType === 'deadTime') {
    toscTheo = 2 * params.tauD;
  } else if (processType === 'multiCapacity') {
    toscTheo = 2 * params.tauD + 1.8 * params.tau1;
  } else if (processType === 'firstOrder' && params.tauD > 0) {
    toscTheo = 4 * params.tauD;
  }

  return (
    <div className="flex flex-col h-full bg-slate-900/95 border-l border-slate-800 overflow-y-auto p-3.5 space-y-4 text-slate-200">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
          <BookOpen size={13} className="text-cyan-400" />
          ILM Theory & Formula Guide
        </span>
        <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          NWP 310305cA
        </span>
      </div>

      {/* Live Calculated Loop Metrics */}
      <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/60 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Calculator size={13} className="text-amber-400" />
          <span>Live Calculated Loop Metrics</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">Open-Loop Gain (K<sub>OL</sub>)</div>
            <div className="font-mono font-bold text-cyan-300 text-sm">
              |K<sub>c</sub> &middot; K<sub>p</sub>| = {loopGain.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">Closed-Loop Static Gain (CLSG)</div>
            <div className="font-mono font-bold text-emerald-400 text-sm">
              {processType === 'integrating' ? '1.000 (Inf DC)' : clsg.toFixed(3)}
            </div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">Closed-Loop Time Const (CLTC)</div>
            <div className="font-mono font-bold text-amber-300 text-sm">
              {cltc.toFixed(2)} s
            </div>
            <div className="text-[9px] text-slate-500">vs Open &tau;<sub>1</sub> = {params.tau1.toFixed(1)}s</div>
          </div>

          <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">Theoretical T<sub>osc</sub></div>
            <div className="font-mono font-bold text-purple-300 text-sm">
              {toscTheo > 0 ? `${toscTheo.toFixed(2)} s` : 'N/A (Stable)'}
            </div>
            <div className="text-[9px] text-slate-500">
              {processType === 'deadTime' ? 'Tosc = 2 × τD' : 'Cascade lag'}
            </div>
          </div>
        </div>

        {/* Current Error & Offset Indicator */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800 font-mono">
          <span className="text-slate-400">Error (SP - PV):</span>
          <span className={`font-bold ${Math.abs(state.error) < 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {(state.sp - state.pv).toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Process-Specific Mathematical Derivations */}
      {processType === 'firstOrder' && (
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-800/40 space-y-1.5">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <Info size={13} />
              Objective 2: First-Order Process Formula
            </div>
            <div className="font-mono text-[11px] bg-slate-900 p-2 rounded text-slate-300">
              G<sub>p</sub>(s) = K<sub>p</sub> / (1 + &tau;<sub>1</sub>s)
            </div>
            <p className="text-slate-300 text-[11px]">
              Transfer function of the Heat Exchanger. Thermal capacity and fluid resistance create an exponential lag.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-300">Key Closed-Loop Formulas:</div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">1. Closed-Loop Static Gain (CLSG):</div>
              <div className="font-mono text-[11px] text-slate-300">
                CLSG = |K<sub>c</sub> &middot; K<sub>p</sub>| / (1 + |K<sub>c</sub> &middot; K<sub>p</sub>|)
              </div>
              <p className="text-[10px] text-slate-400">
                Notice CLSG &lt; 1.0 for P-only control. The process variable never reaches the full setpoint!
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">2. Steady-State Offset:</div>
              <div className="font-mono text-[11px] text-slate-300">
                Offset = &Delta;SP &middot; [1 / (1 + |K<sub>c</sub> &middot; K<sub>p</sub>|)] = (1 - CLSG) &middot; &Delta;SP
              </div>
              <p className="text-[10px] text-slate-400">
                Higher controller gain K<sub>c</sub> reduces offset, but cannot eliminate it without Integral action (1/T<sub>i</sub>).
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">3. Speed of Response (CLTC):</div>
              <div className="font-mono text-[11px] text-slate-300">
                &tau;<sub>CL</sub> = &tau;<sub>1</sub> / (1 + |K<sub>c</sub> &middot; K<sub>p</sub>|)
              </div>
              <p className="text-[10px] text-slate-400">
                Negative feedback speeds up the closed loop by a factor of (1 + K<sub>c</sub>K<sub>p</sub>).
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-cyan-300">4. Why Pure First Order Never Oscillates:</div>
              <p className="text-[10px] text-slate-300">
                Phase angle &phi; = -arctan(&omega;&tau;<sub>1</sub>). At infinite frequency, maximum phase lag is only -90&deg;.
                Since 180&deg; is required for instability, pure single-capacity systems are unconditionally stable!
              </p>
            </div>
          </div>
        </div>
      )}

      {processType === 'integrating' && (
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="bg-blue-950/30 p-2.5 rounded-lg border border-blue-800/40 space-y-1.5">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Info size={13} />
              Objective 3: Integrating Process Formula
            </div>
            <div className="font-mono text-[11px] bg-slate-900 p-2 rounded text-slate-300">
              G<sub>p</sub>(s) = 1 / (&tau;<sub>I</sub> &middot; s)
            </div>
            <p className="text-slate-300 text-[11px]">
              Liquid level in a vessel without self-regulation. A constant mismatch between inflow and outflow causes level to ramp indefinitely.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-300">Exam Concepts for Integrating Loops:</div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-emerald-400">1. Zero Offset on Setpoint Changes:</div>
              <p className="text-[10px] text-slate-300">
                At steady state (s &rarr; 0), the integrator in the tank provides infinite process gain. Therefore:
              </p>
              <div className="font-mono text-[11px] text-slate-300">
                CLSG = 1.0 (Zero offset for SP step with P-only!)
              </div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-rose-400">2. Load Disturbance Causes Offset:</div>
              <p className="text-[10px] text-slate-300">
                When bottom drain flow increases, the inlet valve must shift to match outflow. With P-only, a new CO requires an error (e = &Delta;CO / K<sub>c</sub>).
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">3. Danger of Integral Action:</div>
              <p className="text-[10px] text-slate-300">
                The process already contributes -90&deg; phase lag. Adding Integral action contributes another -90&deg;, giving -180&deg; total! This readily destabilizes the level loop.
              </p>
            </div>
          </div>
        </div>
      )}

      {processType === 'deadTime' && (
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40 space-y-1.5">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5">
              <Info size={13} />
              Objective 4: Pure Dead Time Formula
            </div>
            <div className="font-mono text-[11px] bg-slate-900 p-2 rounded text-slate-300">
              G<sub>p</sub>(s) = K<sub>p</sub> &middot; e<sup>-&tau;<sub>D</sub> s</sup>
            </div>
            <p className="text-slate-300 text-[11px]">
              Transport delay along conveyor belt. Material moves distance L at velocity v: &tau;<sub>D</sub> = L / v.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-300">Critical Exam Formulas:</div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-purple-300">1. Period of Oscillation (T<sub>osc</sub>):</div>
              <div className="font-mono text-[11px] text-slate-300">
                T<sub>osc</sub> = 2 &times; &tau;<sub>D</sub>
              </div>
              <p className="text-[10px] text-slate-400">
                With &tau;<sub>D</sub> = {params.tauD.toFixed(1)}s, theoretical period is {(2 * params.tauD).toFixed(1)}s.
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">2. Infinite Phase Lag:</div>
              <div className="font-mono text-[11px] text-slate-300">
                &phi;(&omega;) = -&omega; &middot; &tau;<sub>D</sub> (radians)
              </div>
              <p className="text-[10px] text-slate-400">
                Phase lag increases linearly without bound as frequency rises, severely limiting maximum controller gain K<sub>cu</sub>.
              </p>
            </div>
          </div>
        </div>
      )}

      {processType === 'multiCapacity' && (
        <div className="space-y-3 text-xs leading-relaxed">
          <div className="bg-purple-950/30 p-2.5 rounded-lg border border-purple-800/40 space-y-1.5">
            <div className="font-bold text-purple-300 flex items-center gap-1.5">
              <Info size={13} />
              Objective 5: Multicapacity (Distillation)
            </div>
            <div className="font-mono text-[11px] bg-slate-900 p-2 rounded text-slate-300">
              G<sub>p</sub>(s) = K<sub>p</sub> / [(1 + &tau;<sub>1</sub>s)(1 + &tau;<sub>2</sub>s)...]
            </div>
            <p className="text-slate-300 text-[11px]">
              Cascading trays in series. Creates the characteristic sigmoidal "S-shaped" process reaction curve.
            </p>
          </div>

          <div className="space-y-2">
            <div className="font-bold text-slate-300">Exam Concepts:</div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-cyan-300">1. S-Curve Dynamics:</div>
              <p className="text-[10px] text-slate-400">
                Initial slope is zero (inflection point). Modeled as apparent dead time (&tau;<sub>a</sub>) plus equivalent time constant (&tau;<sub>e</sub>).
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-amber-300">2. Cascading Phase Lag:</div>
              <p className="text-[10px] text-slate-400">
                With 4 stages in series, total phase lag easily exceeds 180&deg;, allowing sustained oscillations under high gain even with zero pure transport delay!
              </p>
            </div>

            <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60 space-y-1">
              <div className="font-semibold text-purple-300">3. Oscillation Period Range:</div>
              <div className="font-mono text-[11px] text-slate-300">
                2 &tau;<sub>D</sub> &lt; T<sub>osc</sub> &lt; 4 &tau;<sub>D</sub>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barkhausen Stability Criteria Card */}
      <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700 text-xs space-y-1.5">
        <div className="font-bold text-amber-400 flex items-center gap-1">
          <ShieldCheck size={14} />
          Barkhausen Stability Criteria (Exam Core)
        </div>
        <p className="text-[11px] text-slate-300 leading-snug">
          A closed loop sustains oscillation if:
        </p>
        <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-0.5">
          <li>Total loop phase lag = 180&deg; (360&deg; with negative feedback)</li>
          <li>Open-loop gain |K<sub>c</sub> &middot; K<sub>p</sub>| = 1.0 at that critical frequency</li>
        </ul>
      </div>
    </div>
  );
};
