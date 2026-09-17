import { QuizQuestion } from '../types';

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    objective: "Objective 1: Closed Loop Responses",
    question: "In industrial process control, what decay ratio corresponds to the standard 'Quarter Amplitude Damping' (1/4 decay ratio) criterion?",
    options: [
      "The amplitude of the second peak is 50% of the first peak",
      "The amplitude of each successive peak is one-fourth (25%) of the previous peak",
      "The process variable reaches steady-state in four cycles",
      "The closed loop gain is equal to 0.25"
    ],
    correctIndex: 1,
    explanation: "Quarter Amplitude Damping defines a response where the ratio of the amplitude of the second overshoot peak (A2) to the first overshoot peak (A1) is 1/4 (25%). It provides a balance between rapid rise time and acceptable damping.",
    presetConfig: {
      process: "firstOrder",
      kc: 3.5,
      invTi: 0.8,
      tau1: 2.0,
      tauD: 0.8,
      sp: 60,
      load: 0
    }
  },
  {
    id: 2,
    objective: "Objective 1: Stability Criteria",
    question: "According to Barkhausen stability criterion, what two conditions must be satisfied simultaneously for a closed loop to develop sustained oscillations?",
    options: [
      "Loop Gain = 0 and Phase Lag = 90°",
      "Loop Gain ≥ 1.0 and Total Loop Phase Lag = 180° (effective 360° with negative feedback)",
      "Proportional Gain < 1.0 and Integral Time = 0",
      "Process Gain equals Controller Gain with zero dead time"
    ],
    correctIndex: 1,
    explanation: "Because negative feedback naturally inverts the signal (providing 180° phase inversion), an additional 180° phase lag produced by the process dynamics, sensor, and transmitter results in positive reinforcement (360° total). If the open-loop gain is 1.0 or greater at this frequency, sustained or growing oscillations occur.",
    presetConfig: {
      process: "deadTime",
      kc: 2.2,
      invTi: 0.0,
      tau1: 1.5,
      tauD: 2.0,
      sp: 50,
      load: 0
    }
  },
  {
    id: 3,
    objective: "Objective 2: First-Order Process & Offset",
    question: "A first-order temperature process has Kp = 1.0 and a P-only controller with Kc = 3.0. If the setpoint is stepped from 50% to 70% (ΔSP = 20%), what is the expected steady-state offset?",
    options: [
      "0% (no offset with first-order processes)",
      "5% offset (final PV reaches 65%)",
      "15% offset (final PV reaches 55%)",
      "20% offset (PV does not move)"
    ],
    correctIndex: 1,
    explanation: "Closed Loop Static Gain (CLSG) = |Kc·Kp| / (1 + |Kc·Kp|) = 3 / (1 + 3) = 0.75. The change in PV = CLSG × ΔSP = 0.75 × 20% = 15%. Thus, the final PV is 50% + 15% = 65%. The steady-state offset is ΔSP - ΔPV = 20% - 15% = 5%.",
    presetConfig: {
      process: "firstOrder",
      kc: 3.0,
      invTi: 0.0,
      tau1: 2.5,
      tauD: 0.0,
      sp: 70,
      load: 0
    }
  },
  {
    id: 4,
    objective: "Objective 2: First-Order Phase Shift",
    question: "Why is a pure single-capacity (first-order) process inherently stable and unable to produce sustained oscillations under P-only control?",
    options: [
      "Its process gain is always less than 1.0",
      "Its maximum theoretical phase lag asymptotically approaches 90°, which is insufficient to reach the 180° phase lag required for sustained oscillation",
      "First order processes do not experience thermal inertia",
      "The controller output saturates before oscillation can develop"
    ],
    correctIndex: 1,
    explanation: "A single first-order transfer function Gp = Kp/(1 + τs) has a phase angle φ = -arctan(ωτ). At infinite frequency, the maximum phase shift is only -90°. Since 180° phase lag is required for closed-loop instability, a pure first-order system cannot oscillate on its own.",
    presetConfig: {
      process: "firstOrder",
      kc: 15.0,
      invTi: 0.0,
      tau1: 2.0,
      tauD: 0.0,
      sp: 60,
      load: 0
    }
  },
  {
    id: 5,
    objective: "Objective 3: Integrating Process (Liquid Level)",
    question: "How does a pure integrating process (such as a liquid level tank without self-regulation) respond to a setpoint step when controlled by a P-only controller?",
    options: [
      "It will always exhibit a steady-state offset proportional to Kc",
      "It will reach the new setpoint with ZERO steady-state offset because the integrator in the process provides infinite static gain",
      "It will continuously ramp to 100% and overflow",
      "It cannot be controlled without Derivative action"
    ],
    correctIndex: 1,
    explanation: "Because an integrating process has transfer function Gp(s) = 1/(τI·s), its DC gain (at s=0) is infinite. Therefore, the Closed Loop Static Gain for a setpoint change is CLSG = 1.0, which means there is zero steady-state offset for a setpoint change even with P-only control!",
    presetConfig: {
      process: "integrating",
      kc: 2.0,
      invTi: 0.0,
      tau1: 2.0,
      tauD: 0.0,
      sp: 65,
      load: 0
    }
  },
  {
    id: 6,
    objective: "Objective 3: Integrating Process & Load Disturbances",
    question: "What happens when a sustained load disturbance (such as an unanticipated increase in bottom outflow) occurs in an integrating level process under P-only control?",
    options: [
      "The tank level automatically returns to setpoint with zero offset",
      "A permanent steady-state offset develops because the controller output must shift to balance the new load flow, requiring an error (e = SP - PV)",
      "The tank immediately runs dry regardless of controller gain",
      "The system enters uncontrollable high-frequency oscillation"
    ],
    correctIndex: 1,
    explanation: "In an integrating process, inflow must exactly equal outflow at steady state. If a load disturbance increases outflow, the control valve must open wider (ΔCO). Under P-only control (CO = Kc·e + Bias), the only way to sustain this new CO is with a permanent non-zero error (e = ΔCO/Kc), producing a steady-state offset.",
    presetConfig: {
      process: "integrating",
      kc: 2.0,
      invTi: 0.0,
      tau1: 2.0,
      tauD: 0.0,
      sp: 50,
      load: 25
    }
  },
  {
    id: 7,
    objective: "Objective 4: Pure Dead Time Period of Oscillation",
    question: "For a process dominated by pure transport delay (dead time τD = 2.0 seconds), what is the period of sustained oscillation (Tosc) when the loop gain is set to critical gain (Kcu)?",
    options: [
      "1.0 second (Tosc = τD / 2)",
      "2.0 seconds (Tosc = τD)",
      "4.0 seconds (Tosc = 2 × τD)",
      "8.0 seconds (Tosc = 4 × τD)"
    ],
    correctIndex: 2,
    explanation: "For pure dead time Gp = Kp·e^(-τD·s), the phase lag is φ = -ω·τD. A phase lag of 180° (π radians) occurs when ω·τD = π. Since frequency f = ω/(2π) = 1/(2τD), the period of oscillation is Tosc = 1/f = 2 × τD. With τD = 2.0s, Tosc = 4.0 seconds.",
    presetConfig: {
      process: "deadTime",
      kc: 2.5,
      invTi: 0.0,
      tau1: 1.0,
      tauD: 2.0,
      sp: 50,
      load: 0
    }
  },
  {
    id: 8,
    objective: "Objective 4: Dead Time vs Controller Tuning",
    question: "Why does adding dead time (transport delay) severely restrict the maximum usable controller gain (Kc)?",
    options: [
      "Dead time creates infinite phase lag as frequency increases, causing the phase lag to reach 180° at relatively low frequencies",
      "Dead time reduces the measurement span of the transmitter",
      "Dead time converts the controller to direct-acting",
      "Dead time causes the integral action to deactivate"
    ],
    correctIndex: 0,
    explanation: "Unlike first-order lags which cap out at 90° phase shift, dead time causes phase lag to increase linearly without limit (φ = -ω·τD). This introduces substantial phase shift at low frequencies, pushing the loop to the 180° critical stability limit even at modest controller gains.",
    presetConfig: {
      process: "deadTime",
      kc: 5.0,
      invTi: 0.0,
      tau1: 1.0,
      tauD: 2.5,
      sp: 60,
      load: 0
    }
  },
  {
    id: 9,
    objective: "Objective 5: Multicapacity Reaction Curve",
    question: "When a step change is applied to a multicapacity process (such as a 4-tray distillation column), what is the characteristic shape of the open-loop response curve?",
    options: [
      "A straight ramp with no initial delay",
      "An instantaneous jump followed by exponential decay",
      "An S-shaped reaction curve characterized by an apparent dead time followed by a lag",
      "A pure sinusoidal wave with decreasing frequency"
    ],
    correctIndex: 2,
    explanation: "Each tray or capacity in series acts as an individual first-order lag. The convolution of several lags in series produces an initial flat slope (apparent dead time) that steepens and then levels off asymptotically, forming the classic 'S-shaped' reaction curve.",
    presetConfig: {
      process: "multiCapacity",
      kc: 1.5,
      invTi: 0.3,
      tau1: 3.5,
      tauD: 1.5,
      sp: 65,
      load: 0
    }
  },
  {
    id: 10,
    objective: "Objective 5: Multicapacity Stability & Integral Action",
    question: "In a multicapacity distillation column with P-only control, what is the primary effect of introducing Integral action (Reset, 1/Ti)?",
    options: [
      "It eliminates steady-state offset, but adds up to 90° of additional phase lag, reducing loop stability margin",
      "It increases the critical gain (Kcu) allowing higher proportional gain",
      "It decreases the settling time without causing any additional overshoot",
      "It eliminates the dead time of the column"
    ],
    correctIndex: 0,
    explanation: "Integral action introduces an additional 90° of phase lag at low frequencies (Gi(s) = 1 + 1/(Ti·s)). In multicapacity systems that already possess substantial phase lag from cascading stages, adding integral action pushes total phase lag closer to 180°, which makes the loop less stable unless proportional gain is backed off.",
    presetConfig: {
      process: "multiCapacity",
      kc: 3.0,
      invTi: 1.5,
      tau1: 3.0,
      tauD: 1.5,
      sp: 50,
      load: 20
    }
  }
];
