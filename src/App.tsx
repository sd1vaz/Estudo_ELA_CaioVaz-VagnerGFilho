/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, Sparkles, Sliders, Layout, RefreshCw, FileText, 
  Info, Cpu, BarChart3, Binary, ShieldCheck, AlertTriangle, 
  Eye, FileCheck, CheckCircle2, ChevronRight, GraduationCap,
  History, Settings, ZoomIn, HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ElaOptions, ForensicStats } from "./types";
import { computeEla, generatePreset } from "./components/ElaGenerator";
import { TheorySection } from "./components/TheorySection";
import { ForensicChart } from "./components/ForensicChart";
import { AiAnalyst } from "./components/AiAnalyst";

export default function App() {
  // 1. Core State
  const [activeTab, setActiveTab] = useState<"sandbox" | "academic">("sandbox");
  const [originalBase64, setOriginalBase64] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<"original" | "edited" | "deepfake">("edited");
  const [compareMode, setCompareMode] = useState<"side-by-side" | "single-ela" | "curtain">("curtain");
  const [curtainPosition, setCurtainPosition] = useState(50); // 0 to 100
  const [isDraggingCurtain, setIsDraggingCurtain] = useState(false);

  // 2. ELA Options
  const [quality, setQuality] = useState(0.95);
  const [boost, setBoost] = useState(25);
  const [channel, setChannel] = useState<ElaOptions["channel"]>("all");
  const [triggerCount, setTriggerCount] = useState(0);

  // 3. Results Stats
  const [stats, setStats] = useState<ForensicStats | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 4. Refs
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const computedElaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayOriginalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const displayElaCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const curtainContainerRef = useRef<HTMLDivElement | null>(null);
  const activeCalcIdRef = useRef<number>(0);

  // Redraw canvases whenever they mount or when mode changes
  const redrawDisplayCanvases = () => {
    const origDisplay = displayOriginalCanvasRef.current;
    const computedOrig = originalCanvasRef.current;
    if (origDisplay && computedOrig) {
      origDisplay.width = computedOrig.width;
      origDisplay.height = computedOrig.height;
      const ctx = origDisplay.getContext("2d");
      if (ctx) ctx.drawImage(computedOrig, 0, 0);
    }

    const elaDisplay = displayElaCanvasRef.current;
    const computedEla = computedElaCanvasRef.current;
    if (elaDisplay && computedEla) {
      elaDisplay.width = computedEla.width;
      elaDisplay.height = computedEla.height;
      const ctx = elaDisplay.getContext("2d");
      if (ctx) ctx.drawImage(computedEla, 0, 0);
    }
  };

  // 5. Initialize or Switch Presets
  useEffect(() => {
    if (!selectedPreset) {
      // It is a user uploaded custom image!
      // The canvas is already loaded into originalCanvasRef.current by handleImageUpload.
      // So we only need to call recomputeEla() to update the ELA map.
      recomputeEla();
      return;
    }

    setIsProcessing(true);
    // Draw appropriate preset onto our original canvas reference
    const presetCanvas = generatePreset(selectedPreset);
    originalCanvasRef.current = presetCanvas;

    // Set base64 for AI analyst
    setOriginalBase64(presetCanvas.toDataURL("image/jpeg", 0.95));

    // Render it to the visible canvas original
    const origDisplay = displayOriginalCanvasRef.current;
    if (origDisplay) {
      origDisplay.width = presetCanvas.width;
      origDisplay.height = presetCanvas.height;
      const ctx = origDisplay.getContext("2d");
      if (ctx) ctx.drawImage(presetCanvas, 0, 0);
    }

    // Trigger ELA calculation
    recomputeEla();
  }, [selectedPreset, triggerCount]);

  // Re-run ELA when quality, boost or channel parameters change
  useEffect(() => {
    recomputeEla();
  }, [quality, boost, channel]);

  // Trigger redraw when compareMode changes
  useEffect(() => {
    redrawDisplayCanvases();
  }, [compareMode]);

  const recomputeEla = () => {
    const origCanvas = originalCanvasRef.current;
    if (!origCanvas) return;

    setIsProcessing(true);
    const currentCalcId = ++activeCalcIdRef.current;

    computeEla(
      origCanvas,
      { quality, boost, channel },
      (elaCanvas, forensicStats) => {
        if (currentCalcId !== activeCalcIdRef.current) return;
        computedElaCanvasRef.current = elaCanvas;
        redrawDisplayCanvases();
        setStats(forensicStats);
        setIsProcessing(false);
      },
      (error) => {
        if (currentCalcId !== activeCalcIdRef.current) return;
        console.error("Erro na computação de ELA:", error);
        setIsProcessing(false);
      }
    );
  };

  // 6. Handle Manual Uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setIsProcessing(true);
        
        // Dynamically scale canvas to standard workable resolution (max 800px width for quick client processing)
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
        }

        originalCanvasRef.current = canvas;
        setOriginalBase64(canvas.toDataURL("image/jpeg", 0.95));

        // Draw onto the original display preview canvas
        const origDisplay = displayOriginalCanvasRef.current;
        if (origDisplay) {
          origDisplay.width = w;
          origDisplay.height = h;
          const previewCtx = origDisplay.getContext("2d");
          if (previewCtx) previewCtx.drawImage(canvas, 0, 0);
        }

        // Force reload and recompute
        setSelectedPreset("" as any); // Clear active preset tag
        setTriggerCount((prev) => prev + 1);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 7. Curtain Slider Sweep Interaction Handler
  const handleCurtainMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCurtain || !curtainContainerRef.current) return;
    const rect = curtainContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCurtainPosition(pct);
  };

  const handleCurtainTouchMove = (e: React.TouchEvent) => {
    if (!curtainContainerRef.current) return;
    const rect = curtainContainerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setCurtainPosition(pct);
  };

  const startDragCurtain = () => setIsDraggingCurtain(true);
  const stopDragCurtain = () => setIsDraggingCurtain(false);

  useEffect(() => {
    const handleMouseUp = () => stopDragCurtain();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col selection:bg-indigo-500/30 selection:text-white">
      
      {/* Upper Navigation Bar & Scientific Authors Credit Banner */}
      <header className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/10 border border-indigo-500/20 p-2.5 rounded-xl text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase">Forensix ELA Suite</h1>
                <span className="bg-indigo-500/15 border border-indigo-500/30 text-[9px] font-mono text-indigo-400 px-1.5 py-0.5 rounded uppercase">v1.1 Pro</span>
              </div>
              <p className="text-xs text-gray-400">
                Detecção Forense de Manipulações Digitais utilizando <span className="text-indigo-400 font-semibold font-mono">Error Level Analysis (ELA)</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col md:items-end text-xs text-gray-500 font-mono">
            <div className="text-indigo-400 font-semibold">INVESTIGAÇÃO DIGITAL • ATIVA</div>
            <div className="text-[10px] text-gray-600">Processamento Avançado e Detecção Forense</div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-900/80 p-1 bg-slate-950/45 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === "sandbox"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Laboratório Interativo (ELA Sandbox)
          </button>
          <button
            onClick={() => setActiveTab("academic")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeTab === "academic"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Guia &amp; Metodologia Forense
          </button>
        </div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeTab === "sandbox" ? (
            <motion.div
              key="sandbox"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              
              {/* COL 1: CONTROL CENTER & PRESETS SELECTOR */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 2. Upload Custom Image */}
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4.5 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    Enviar sua Imagem
                  </h3>
                  <div className="relative group border border-dashed border-slate-800 hover:border-indigo-500/40 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-950/20">
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/png, image/jpeg"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-5 h-5 mx-auto text-gray-500 group-hover:text-indigo-400 transition-colors mb-2" />
                    <span className="text-[10px] text-gray-400 block font-medium group-hover:text-slate-200 transition-colors">Arraste ou clique para carregar</span>
                    <span className="text-[9px] text-gray-600 block mt-0.5 font-mono">SUPORTA JPEG, PNG</span>
                  </div>
                </div>

                {/* 3. Parameter Sliders */}
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4.5 space-y-4">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Ajustes de Compressão ELA
                  </h3>
                  
                  {/* Slider 1: Quality Q */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-gray-400">QUALIDADE COMPRESSIVA (Q)</span>
                      <span className="text-indigo-400 font-bold">{Math.round(quality * 100)}%</span>
                    </div>
                    <input
                      id="quality-slider"
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.01"
                      value={quality}
                      onChange={(e) => setQuality(parseFloat(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-950 rounded-lg"
                    />
                    <span className="text-[9px] text-gray-500 block leading-tight">Taxa de degradação JPEG conhecida. Padrão ideal científico: 95%.</span>
                  </div>

                  {/* Slider 2: Boost Mult */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-gray-400">FATOR DE AMPLICAÇÃO (BOOST)</span>
                      <span className="text-indigo-400 font-bold">{boost}x</span>
                    </div>
                    <input
                      id="boost-slider"
                      type="range"
                      min="1"
                      max="50"
                      step="1"
                      value={boost}
                      onChange={(e) => setBoost(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-1 bg-slate-950 rounded-lg"
                    />
                    <span className="text-[9px] text-gray-500 block leading-tight">Multiplica a diferença pixel-a-pixel para realçar as descontinuidades.</span>
                  </div>

                  {/* Dropdown 3: Channel Filter */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Visualização Espectral</label>
                    <select
                      id="channel-select"
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as ElaOptions["channel"])}
                      className="w-full h-8 bg-slate-950 border border-slate-900 rounded-lg text-[10px] px-2 text-slate-300 focus:outline-none focus:border-indigo-500/50 uppercase font-mono"
                    >
                      <option value="all">Sinal Completo (RGB)</option>
                      <option value="red">Canal Vermelho (Vez de Cor)</option>
                      <option value="green">Canal Verde (Luminância focal)</option>
                      <option value="blue">Canal Azul (Frequência Alta)</option>
                      <option value="gray">Escala de Cinza (Contraste limpo)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* COL 2: CENTRAL INTERACTIVE COMPARE CANVAS */}
              <div className="lg:col-span-6 bg-slate-900/10 border border-slate-900 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                
                {/* Visualizer header controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-900 pb-4 mb-4">
                  <div>
                    <h3 className="text-xs font-semibold text-white uppercase tracking-tight">Escopo de Inspeção Forense</h3>
                    <p className="text-[10px] text-gray-500 font-mono">TELA INTERATIVA DE COMPARAÇÃO DE PIXELS</p>
                  </div>

                  {/* Mode Buttons */}
                  <div className="flex bg-slate-950 border border-slate-900 rounded-lg p-0.5">
                    <button
                      id="mode-curtain"
                      onClick={() => setCompareMode("curtain")}
                      className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                        compareMode === "curtain" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Cortina Deslizante
                    </button>
                    <button
                      id="mode-side-by-side"
                      onClick={() => setCompareMode("side-by-side")}
                      className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                        compareMode === "side-by-side" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Lado a Lado
                    </button>
                    <button
                      id="mode-single-ela"
                      onClick={() => setCompareMode("single-ela")}
                      className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all cursor-pointer ${
                        compareMode === "single-ela" ? "bg-indigo-600 text-white shadow" : "text-gray-400 hover:text-white"
                      }`}
                    >
                      Apenas ELA
                    </button>
                  </div>
                </div>

                {/* Display Port */}
                <div className="my-auto self-center w-full relative flex items-center justify-center p-2 rounded-xl bg-slate-950/45 border border-slate-950 min-h-[300px]">
                  
                  {isProcessing && (
                    <div className="absolute inset-0 bg-slate-950/70 z-30 flex flex-col items-center justify-center rounded-xl backdrop-blur-sm gap-2">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
                      <span className="text-xs font-mono text-gray-400">RELOGANDO MATRIZ DE DEGRAU...</span>
                    </div>
                  )}

                  {/* Mode 1: Curtain swipe slider */}
                  {compareMode === "curtain" && (
                    <div
                      id="curtain-container"
                      ref={curtainContainerRef}
                      onMouseMove={handleCurtainMouseMove}
                      onTouchMove={handleCurtainTouchMove}
                      onMouseDown={startDragCurtain}
                      onTouchStart={startDragCurtain}
                      onMouseUp={stopDragCurtain}
                      onTouchEnd={stopDragCurtain}
                      className="relative w-full max-w-[640px] aspect-[64/42] select-none h-auto rounded-xl overflow-hidden cursor-ew-resize border border-slate-900"
                    >
                      {/* ELA Image on base */}
                      <canvas
                        id="ela-canvas"
                        ref={displayElaCanvasRef}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />

                      {/* Original image on top, clipped by curtain position */}
                      <canvas
                        id="orig-canvas-clipped"
                        ref={displayOriginalCanvasRef}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        style={{
                          clipPath: `polygon(0 0, ${curtainPosition}% 0, ${curtainPosition}% 100%, 0 100%)`
                        }}
                      />

                      {/* Handle Divider Bar */}
                      <div
                        className="absolute inset-y-0 w-[2px] bg-indigo-500 z-10 pointer-events-none flex items-center justify-center"
                        style={{ left: `${curtainPosition}%` }}
                      >
                        <div className="bg-indigo-600 border border-indigo-400 text-white w-5 h-8 rounded flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                          <Eye className="w-3 h-3 text-white" />
                        </div>
                      </div>

                      {/* Floating Indicator Labels */}
                      <div className="absolute top-2 left-2 bg-slate-950/80 border border-slate-900 px-2 py-0.5 text-[9px] text-indigo-400 rounded-md font-mono pointer-events-none z-20">
                        IMAGEM ORIGINAL
                      </div>
                      <div className="absolute top-2 right-2 bg-slate-950/80 border border-slate-900 px-2 py-0.5 text-[9px] text-rose-400 rounded-md font-mono pointer-events-none z-20">
                        MAPA ELA DE ERRO
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Side by Side view */}
                  {compareMode === "side-by-side" && (
                    <div id="side-by-side-display" className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      <div className="flex flex-col gap-1.5">
                        <canvas
                          ref={displayOriginalCanvasRef}
                          className="w-full h-auto aspect-[64/42] rounded-lg border border-slate-900 object-cover"
                        />
                        <span className="text-[9px] font-mono text-gray-500 text-center">IMAGEM ORIGINAL DE REFERÊNCIA</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <canvas
                          ref={displayElaCanvasRef}
                          className="w-full h-auto aspect-[64/42] rounded-lg border border-slate-900 object-cover"
                        />
                        <span className="text-[9px] font-mono text-gray-500 text-center">MAPA ERROR LEVEL ANALYSIS ({quality*100}%)</span>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Solely ELA map */}
                  {compareMode === "single-ela" && (
                    <div id="single-ela-display" className="w-full max-w-[640px] flex flex-col gap-1.5">
                      <canvas
                        ref={displayElaCanvasRef}
                        className="w-full h-auto aspect-[64/42] rounded-xl border border-slate-900 object-cover"
                      />
                      <span className="text-[9px] font-mono text-gray-500 text-center">SINAL AMPLIFICADO DE CONTRAPOSIÇÃO (FATOR: {boost}x)</span>
                    </div>
                  )}

                </div>

                {/* Legend Tip under canvas */}
                <div className="mt-4 bg-slate-950/30 border border-slate-900 rounded-xl p-3 flex gap-2.5 items-start text-[11px] leading-relaxed text-gray-400">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-300 block">Dica de Perícia:</span>
                    {selectedPreset === "original" && "A compressão é homogênea. O mapa de erro apresenta traços e contornos uniformes, provando integridade e origem única."}
                    {selectedPreset === "edited" && "Observe a insígnia amarela e vermelha: ela brilha de forma vibrante! Suas bordas afiadas mostram alto delta repressivo em relação ao resto da paisagem suavizada."}
                    {selectedPreset === "deepfake" && "A elipse do rosto substituída mostra um anel brilhante nítido de descontinuidade em suas bordas pontilhadas. Característico de fotos montadas seletivamente."}
                    {!selectedPreset && "Se você enviou sua própria imagem, procure por elementos, bordas, ou assinaturas de textura com brilho muito superior ou discordante das áreas circunvizinhas homogêneas."}
                  </div>
                </div>

              </div>

              {/* COL 3: SCIENTIFIC RESULTS, HISTOGRAM & AI LAUDO */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* 1. Stat Indicator cards */}
                <div className="bg-slate-900/20 border border-slate-900/60 rounded-2xl p-4.5 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
                    Telemetria Forense
                  </h3>

                  {stats && (
                    <div className="space-y-3">
                      
                      {/* Verdict Banner */}
                      <div className={`p-3 rounded-xl border flex gap-3 text-xs leading-tight ${
                        stats.integrityVerdict === "HOMOGENEA"
                          ? "bg-emerald-950/35 border-emerald-900/30 text-emerald-400"
                          : stats.integrityVerdict === "ALTERACAO_DETECTADA"
                          ? "bg-amber-950/35 border-amber-900/30 text-amber-400"
                          : "bg-rose-950/35 border-rose-900/30 text-rose-400"
                      }`}>
                        {stats.integrityVerdict === "HOMOGENEA" ? (
                          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-mono text-[9px] text-gray-500 block uppercase font-bold">Diagnóstico Heurístico:</span>
                          <span className="font-semibold text-slate-100 block mt-0.5">
                            {stats.integrityVerdict === "HOMOGENEA" && "COMPRESSÃO HOMOGÊNEA (Teste 1)"}
                            {stats.integrityVerdict === "ALTERACAO_DETECTADA" && "ALTERAÇÃO SUSPEITA DETECTADA (Teste 2)"}
                            {stats.integrityVerdict === "DEEPFAKE_INCONSISTENTE" && "INCONSISTÊNCIA DE QUANTIZAÇÃO (DEEP_SWAP)"}
                            {stats.integrityVerdict === "MONTAGEM_FORTE" && "MONTAGEM DETECTADA (Forte Desvio)"}
                          </span>
                          <span className="text-[10px] text-gray-400 block mt-1 leading-normal">
                            {stats.integrityVerdict === "HOMOGENEA" && "A imagem é uniforme. Nenhuma região apresenta picos compressivos isolados."}
                            {stats.integrityVerdict === "ALTERACAO_DETECTADA" && "Detecção de picos isolados com alto nível de erro. Possível colagem."}
                            {stats.integrityVerdict === "DEEPFAKE_INCONSISTENTE" && "Presença de anomalias localizadas no nível de erro, típico de IA."}
                            {stats.integrityVerdict === "MONTAGEM_FORTE" && "Inconsistências severas de compressão JPEG de múltiplos encoders."}
                          </span>
                        </div>
                      </div>

                      {/* Numeric Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                          <span className="text-[8px] text-gray-500 block uppercase">Erro Médio ELA</span>
                          <span className="text-sm font-semibold text-indigo-400">{stats.avgError} px</span>
                        </div>
                        <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                          <span className="text-[8px] text-gray-500 block uppercase">Score de Anomalia</span>
                          <span className={`text-sm font-semibold ${stats.anomalyScore > 40 ? "text-rose-400" : "text-emerald-400"}`}>{stats.anomalyScore}/100</span>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 2. Statistical Histogram Spectrum */}
                {stats && <ForensicChart data={stats.histogram} />}

                {/* 3. AI Cognitive Report */}
                <AiAnalyst
                  imageBase64={originalBase64}
                  quality={quality}
                  boost={boost}
                  stats={stats}
                />

              </div>

            </motion.div>
          ) : (
            <motion.div
              key="academic"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              <TheorySection />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Elegant Professional Footer */}
      <footer className="border-t border-slate-900 py-6 mt-12 bg-slate-950/40 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-6 space-y-2">
          <p>© 2026 Forensix ELA • Sistema de Investigação Forense Digital Avançado</p>
        </div>
      </footer>
    </div>
  );
}
