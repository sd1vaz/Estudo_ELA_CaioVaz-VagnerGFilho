/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ElaOptions {
  quality: number; // Quality value from 0.0 to 1.0 (normally 0.95)
  boost: number;   // Amplification factor, default 20
  channel: "all" | "red" | "green" | "blue" | "gray";
}

export interface ChannelError {
  r: number;
  g: number;
  b: number;
}

export interface HistogramData {
  errorLevel: number;
  count: number;
}

export interface ForensicStats {
  avgError: number;
  maxError: number;
  channelError: ChannelError;
  histogram: HistogramData[];
  anomalyScore: number;
  integrityVerdict: "HOMOGENEA" | "ALTERACAO_DETECTADA" | "DEEPFAKE_INCONSISTENTE" | "MONTAGEM_FORTE";
}

export interface PresetSample {
  id: string;
  name: string;
  type: string;
  description: string;
  verdict: string;
  generate: () => HTMLCanvasElement;
}
