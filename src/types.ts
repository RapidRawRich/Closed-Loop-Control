export type ProcessType = 'firstOrder' | 'integrating' | 'deadTime' | 'multiCapacity';

export interface LoopParameters {
  kc: number;        // Controller Gain
  invTi: number;     // Integral Action (1/Ti in repeats/min or 1/s)
  tau1: number;      // Process Time Constant (seconds)
  tauD: number;      // Process Dead Time (seconds)
  kp: number;        // Process Static Gain
}

export interface LoopState {
  sp: number;        // Setpoint (0 - 100%)
  pv: number;        // Process Variable (0 - 100%)
  co: number;        // Controller Output (0 - 100%)
  error: number;     // SP - PV
  integralSum: number;
  loadDisturbance: number; // 0 - 25%
  trayStates: [number, number, number, number]; // for multicapacity 4 trays
  stability: 'steady' | 'transient' | 'oscillating' | 'unstable';
}

export interface QuizQuestion {
  id: number;
  objective: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  presetConfig?: {
    process: ProcessType;
    kc: number;
    invTi: number;
    tau1: number;
    tauD: number;
    sp: number;
    load: number;
  };
}
