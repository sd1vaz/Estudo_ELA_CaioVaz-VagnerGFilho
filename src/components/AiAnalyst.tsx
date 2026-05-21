/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Sparkles, Loader2, FileText, Send, HelpCircle, CheckCircle, RefreshCw, AlertCircle, Award, Download } from "lucide-react";
import { ForensicStats } from "../types";
import { jsPDF } from "jspdf";

interface AiAnalystProps {
  imageBase64: string | null;
  quality: number;
  boost: number;
  stats: ForensicStats | null;
}

export function AiAnalyst({ imageBase64, quality, boost, stats }: AiAnalystProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  
  // Custom chat message list for follow-up questions
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const downloadReportAsPdf = () => {
    if (!report) return;

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let currentY = 20;

      const drawPageDecorations = (pageNum: number) => {
        // Outer decorative pericial border
        doc.setDrawColor(30, 41, 59); // deep slate/dark
        doc.setLineWidth(0.4);
        doc.rect(margin - 6, margin - 6, pageWidth - ((margin - 6) * 2), pageHeight - ((margin - 6) * 2));

        // Background subtle pericial watermark
        doc.setTextColor(245, 247, 250);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(26);
        // Draw centered official watermark
        doc.text("DOCUMENTO OFICIAL DE PERÍCIA", pageWidth / 2, pageHeight / 2 - 20, { align: "center", angle: 45 });
        doc.text("LAUDO DIGITAL CERTIFICADO ELA", pageWidth / 2, pageHeight / 2 + 10, { align: "center", angle: 45 });

        // Custom top Header Header Bar
        doc.setDrawColor(99, 102, 241); // indigo-500
        doc.setLineWidth(1.2);
        doc.line(margin, margin + 4, pageWidth - margin, margin + 4);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(99, 102, 241);
        doc.text("LAUDO TÉCNICO DE PERÍCIA E PROCESSAMENTO FORENSE", margin, margin);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text("Forensix ELA - Investigação Computacional", pageWidth - margin, margin, { align: "right" });

        // Bottom Footer line
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.4);
        doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7);
        doc.text("CERTIDÃO EXTRAÍDA DO SIMULADOR FORENSE DE TAXA DE DUPLA COMPRESSÃO JPEG", margin, pageHeight - 9);
        doc.text(`Página ${pageNum}`, pageWidth - margin, pageHeight - 9, { align: "right" });
      };

      let pageNum = 1;
      drawPageDecorations(pageNum);

      // Title Block
      currentY = 32;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text("LAUDO DE AVALIAÇÃO E ANÁLISE DE COMPRESSÃO (ELA)", pageWidth / 2, currentY, { align: "center" });

      currentY += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("Metodologia de Error Level Analysis para identificação de dupla quantização e fraudes digitais.", pageWidth / 2, currentY, { align: "center" });

      currentY += 9;

      // Metadata Banner Box (Light Gray Card)
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.rect(margin, currentY, contentWidth, 28, "FD");

      const drawMetaText = (lbl: string, val: string, x: number, y: number) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(lbl, x, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text(val, x + 34, y);
      };

      const dateStr = new Date().toLocaleString("pt-BR");
      const verdictStr = stats?.integrityVerdict === "HOMOGENEA"
        ? "HOMOGÊNEA (Sem anomalias)"
        : stats?.integrityVerdict === "ALTERACAO_DETECTADA"
        ? "ALTERAÇÃO DETECTADA (Edição Leve)"
        : stats?.integrityVerdict === "DEEPFAKE_INCONSISTENTE"
        ? "DEEPFAKE / INCONSISTENTE (Modificado por IA)"
        : stats?.integrityVerdict === "MONTAGEM_FORTE"
        ? "MONTAGEM FORTE (Falsa colagem)"
        : "NÃO CONSTITUÍDO";

      drawMetaText("TÉCNICA DE PERÍCIA:", "Error Level Analysis (ELA)", margin + 4, currentY + 6);
      drawMetaText("EMISSÃO DO LAUDO:", dateStr, margin + contentWidth / 2 + 2, currentY + 6);

      drawMetaText("RECOMPRESSÃO (Q):", `${Math.round(quality * 100)}%`, margin + 4, currentY + 12);
      drawMetaText("GRAU DE ANOMALIA:", `${stats?.anomalyScore ?? "N/A"}/100`, margin + contentWidth / 2 + 2, currentY + 12);

      drawMetaText("AMPLIFICAÇÃO (BOOST):", `${boost}x`, margin + 4, currentY + 18);
      drawMetaText("VEREDITO DIGITAL:", verdictStr, margin + contentWidth / 2 + 2, currentY + 18);

      drawMetaText("SISTEMA GERADOR:", "Forensix Suite Enterprise", margin + 4, currentY + 24);
      drawMetaText("FILTRO UTILIZADO:", "Canal de Nível de Erro Ativo", margin + contentWidth / 2 + 2, currentY + 24);

      currentY += 36;

      // Parsing lines from markdown
      const reportLines = report.split("\n");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      const checkPageSpacing = (addedY: number) => {
        if (currentY + addedY > pageHeight - 18) {
          doc.addPage();
          pageNum++;
          drawPageDecorations(pageNum);
          currentY = 26;
        }
      };

      reportLines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          currentY += 3.5;
          return;
        }

        // H1 header
        if (trimmed.startsWith("# ")) {
          const headerText = trimmed.substring(2).toUpperCase();
          checkPageSpacing(12);
          currentY += 3;
          // horizontal line
          doc.setDrawColor(226, 232, 240);
          doc.setLineWidth(0.4);
          doc.line(margin, currentY, margin + contentWidth, currentY);
          currentY += 4.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10.5);
          doc.setTextColor(79, 70, 229); // Indigo
          doc.text(headerText, margin, currentY);
          currentY += 4.5;
        } 
        // H2 header
        else if (trimmed.startsWith("## ")) {
          const headerText = trimmed.substring(3).toUpperCase();
          checkPageSpacing(9);
          currentY += 2.5;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(15, 23, 42); // slate 900
          // vertical accent bar style
          doc.setFillColor(99, 102, 241);
          doc.rect(margin, currentY - 3, 1.8, 7.5, "F");
          doc.text(headerText, margin + 4, currentY);
          currentY += 4.5;
        } 
        // H3 header
        else if (trimmed.startsWith("### ")) {
          const headerText = trimmed.substring(4);
          checkPageSpacing(7);
          currentY += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85);
          doc.text(headerText, margin, currentY);
          currentY += 4;
        } 
        // Bullet list item
        else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
          const contentText = trimmed.substring(2);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);

          const wrapped = doc.splitTextToSize(contentText, contentWidth - 6);
          wrapped.forEach((pText: string, i: number) => {
            checkPageSpacing(4.5);
            if (i === 0) {
              doc.setTextColor(99, 102, 241);
              doc.text("•", margin + 1.5, currentY);
              doc.setTextColor(30, 41, 59);
              doc.text(pText, margin + 4.5, currentY);
            } else {
              doc.text(pText, margin + 4.5, currentY);
            }
            currentY += 4.2;
          });
        } 
        // Number list item
        else if (/^\d+\.\s/.test(trimmed)) {
          const numPrefix = trimmed.match(/^\d+/)?.[0] || "1";
          const contentText = trimmed.replace(/^\d+\.\s/, "");
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 41, 59);

          const wrapped = doc.splitTextToSize(contentText, contentWidth - 6);
          wrapped.forEach((pText: string, i: number) => {
            checkPageSpacing(4.5);
            if (i === 0) {
              doc.setTextColor(99, 102, 241);
              doc.text(`${numPrefix}.`, margin + 1.5, currentY);
              doc.setTextColor(30, 41, 59);
              doc.text(pText, margin + 6.2, currentY);
            } else {
              doc.text(pText, margin + 6.2, currentY);
            }
            currentY += 4.2;
          });
        } 
        // Regular paragraph block
        else {
          const cleanText = trimmed
            .replace(/\*\*(.*?)\*\*/g, "$1")
            .replace(/\*(.*?)\*/g, "$1")
            .replace(/`(.*?)`/g, "$1");

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(51, 65, 85); // elegant reading gray

          const wrapped = doc.splitTextToSize(cleanText, contentWidth);
          wrapped.forEach((pText: string) => {
            checkPageSpacing(4.5);
            doc.text(pText, margin, currentY);
            currentY += 4.2;
          });
        }
      });

      // Signature Verification seal block at bottom of document
      checkPageSpacing(25);
      currentY += 5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.4);
      doc.line(margin, currentY, margin + contentWidth, currentY);

      currentY += 4;
      doc.setFillColor(240, 253, 244); // light emerald 50
      doc.setDrawColor(187, 247, 208); // emerald 200 border
      doc.setLineWidth(0.2);
      doc.rect(margin, currentY, contentWidth, 12, "FD");

      doc.setTextColor(21, 128, 61); // emerald 700
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text("VERIFICAÇÃO DIGITAL ATIVA", margin + 4, currentY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text("Documento emitido eletronicamente de forma exclusiva por sistema de análise avançada Forensix ELA Suite.", margin + 4, currentY + 9);

      doc.save(`LAUDO_FORENSE_ELA_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      alert("Não foi possível gerar o PDF. Verifique o console para mais detalhes.");
    }
  };

  const downloadReportFile = () => {
    if (!report) return;

    const formattedHeader = `=============================================================================
             LAUDO TÉCNICO DE PERÍCIA E PROCESSAMENTO FORENSE
=============================================================================
Data de Emissão: ${new Date().toLocaleString("pt-BR")}
Metodologia Utilizada: Error Level Analysis (ELA) - Nível de Erro de Compressão
Parâmetros Analíticos:
- Fator de Recompressão (Q): ${Math.round(quality * 100)}%
- Fator de Amplificação (Boost): ${boost}x
- Veredito da Análise Estrutural: ${stats?.integrityVerdict || "NÃO CONFIGURADO"}
- Grau de Anomalia Computada: ${stats?.anomalyScore ? stats.anomalyScore + "/100" : "Verificar mapa ELA"}
- Emissão: Automatizada (Algoritmo Forensix ELA Suite)
=============================================================================

REDAÇÃO PERICIAL RECOMPILADA:

` + report + `

=============================================================================
                                VERIFICAÇÃO ELETRÔNICA
Documento exportado diretamente do sistema de simulação forense.
Assinado eletronicamente sob integridade de quantização ELA.
=============================================================================`;

    const blob = new Blob([formattedHeader], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LAUDO_FORENSE_ELA_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const requestForensicReport = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setReport(null);
    setErrorCode(null);
    setChatHistory([]);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
          notes: notes || "Solicitando revisão geral da análise de nível de erro (ELA).",
          quality: Math.round(quality * 100),
          boost: boost,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao gerar a análise.");
      }

      setReport(data.report);
    } catch (err: any) {
      console.error(err);
      setErrorCode(err.message || "Não foi possível conectar ao servidor forense.");
    } finally {
      setLoading(false);
    }
  };

  const submitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !report || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setChatLoading(true);

    try {
      // Reconstruct simple chat prompt
      const contextPrompt = `
Aqui está o laudo pericial gerado anteriormente para esta imagem:
---
${report}
---

O usuário quer fazer uma pergunta complementar sobre este laudo ou a imagem analisada.
Pergunta do Usuário: "${userMessage}"

Por favor, responda de forma breve, muito profissional, técnica e objetiva em português.`;

      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: "image/jpeg",
          notes: contextPrompt,
          quality: Math.round(quality * 100),
          boost: boost,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Não foi possível resgatar resposta.");
      }

      setChatHistory((prev) => [...prev, { role: "model", text: data.report }]);
    } catch (err: any) {
      console.error(err);
      setChatHistory((prev) => [...prev, { role: "model", text: `Erro de perícia: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Safe lightweight parser for standard Markdown formatting
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // H1 Header
      if (line.startsWith("# ")) {
        return (
          <h1 key={index} className="text-base font-bold text-white tracking-tight pt-4 pb-2 border-b border-slate-900 mb-3 uppercase flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" />
            {line.substring(2)}
          </h1>
        );
      }
      // H2 Header
      if (line.startsWith("## ")) {
        return (
          <h2 key={index} className="text-sm font-semibold text-indigo-400 tracking-tight pt-3 pb-1.5 mb-2 mt-4 uppercase border-l-2 border-indigo-500 pl-2">
            {line.substring(3)}
          </h2>
        );
      }
      // H3 Header
      if (line.startsWith("### ")) {
        return (
          <h3 key={index} className="text-xs font-semibold text-slate-300 tracking-tight pt-2 pb-1 mb-1 mt-2">
            {line.substring(4)}
          </h3>
        );
      }
      // Bullet list
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        return (
          <div key={index} className="flex items-start gap-1.5 pl-3 py-0.5 text-xs text-gray-300">
            <span className="text-indigo-500 font-bold mt-0.5">•</span>
            <div className="flex-1">{line.trim().substring(2)}</div>
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line.trim())) {
        const content = line.trim().replace(/^\d+\.\s/, "");
        return (
          <div key={index} className="flex items-start gap-1.5 pl-3 py-1 text-xs text-gray-300">
            <span className="text-indigo-400 font-semibold">{line.trim().match(/^\d+/)?.[0]}.</span>
            <div className="flex-1">{content}</div>
          </div>
        );
      }
      // Empty line
      if (line.trim() === "") {
        return <div key={index} className="h-2"></div>;
      }

      // Inline code or formatting helpers
      const formatted = line
        .replace(/\*\*(.*?)\*\*/g, "$1") // Strip double stars for cleaner styling
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1");

      return (
        <p key={index} className="text-xs text-gray-300 leading-relaxed mb-1 pr-1 pl-1">
          {formatted}
        </p>
      );
    });
  };

  return (
    <div id="ai-analyst-panel" className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col h-full justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-900/80">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-950 border border-indigo-500/20 p-1.5 rounded-lg">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white tracking-tight leading-none mb-1">Perito Criminal IA Forense</h3>
              <span className="text-[10px] text-gray-500 font-mono">INTEGRAÇÃO COGNITIVA GEMINI</span>
            </div>
          </div>
          {report && (
            <div className="flex items-center gap-2">
              <button
                onClick={downloadReportAsPdf}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                title="Salvar Laudo em PDF"
              >
                <Download className="w-3 h-3" />
                <span>Salvar PDF</span>
              </button>
              <button
                onClick={requestForensicReport}
                className="p-1 hover:bg-slate-800/80 rounded text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Refazer Análise"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {!imageBase64 ? (
          <div className="text-center py-8 text-xs text-gray-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
            Selecione ou envie uma imagem na central de testes para liberar o laudo pericial automatizado.
          </div>
        ) : !report ? (
          <div className="space-y-4">
            <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3">
              <label className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Observações Adicionais / Caso de Investigação (Opcional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex. Esta imagem foi recortada do Paint e colada... ou: Foto original da câmera de testes..."
                className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/50 resize-none font-sans"
              />
            </div>

            <button
              onClick={requestForensicReport}
              disabled={loading}
              className="w-full h-11 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PROCESSANDO EVIDÊNCIAS...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>EMITIR LAUDO PERICIAL POR IA</span>
                </>
              )}
            </button>

            {errorCode && (
              <div className="bg-rose-950/40 border border-rose-900/30 text-rose-300 p-3 rounded-xl text-[11px] flex gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Erro na chamada Pericial:</span>
                  {errorCode}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Forensic report output space */
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-900 rounded-2xl h-[280px] overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-indigo-900">
              {/* Report Cover Header */}
              <div className="text-center border-b border-indigo-950/60 pb-3 mb-4">
                <span className="text-[9px] font-mono text-indigo-500 uppercase tracking-widest block mb-1">RELATÓRIO DE INTEGRIDADE DIGITAL</span>
                <h4 className="text-xs font-bold text-slate-100 uppercase tracking-tight">INVESTIGAÇÃO DE ARTEFATOS COMPRESSIVOS ELA</h4>
                <div className="flex justify-center gap-4 text-[9px] text-gray-500 mt-1.5 font-mono">
                  <span>AUTORES: CAIO VAZ & VAGNER G.</span>
                  <span>MÉTODO: QUANT_ELA</span>
                </div>
              </div>

              {/* Main Report Body parsed from Markdown */}
              <div className="space-y-1 text-xs">
                {renderMarkdown(report)}
              </div>

              {/* Electronic Signature & Download Action */}
              <div className="mt-6 border-t border-slate-900 pt-3 flex flex-col items-center gap-2.5">
                <div className="inline-block border border-slate-800 bg-slate-950/90 rounded-md py-1.5 px-3">
                  <span className="text-[8px] font-mono text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle className="w-2.5 h-2.5" /> VERIFICADO DE ACORDO DE NÍVEL DE ERRO (Q={Math.round(quality*100)}%)
                  </span>
                </div>
                
                <button
                  onClick={downloadReportAsPdf}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md shadow-emerald-950/20 cursor-pointer hover:shadow-lg hover:shadow-emerald-950/40"
                >
                  <Download className="w-4 h-4" />
                  <span>EXPORTAR LAUDO COMPLETO (PDF)</span>
                </button>

                <button
                  onClick={downloadReportFile}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-300 underline cursor-pointer transition-colors"
                >
                  Exportar cópia raw (.md)
                </button>
              </div>
            </div>

            {/* Questions Section - Follow up Chat */}
            <div className="border-t border-slate-900/80 pt-4 mt-2">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-indigo-400" /> Perguntas Complementares à Perícia
              </h4>

              {chatHistory.length > 0 && (
                <div className="max-h-[140px] overflow-y-auto mb-2 space-y-2.5 p-2 bg-slate-950/50 rounded-xl border border-slate-900/60 scrollbar-none">
                  {chatHistory.map((ch, idx) => (
                    <div key={idx} className={`p-2 rounded-lg text-xs leading-normal ${ch.role === "user" ? "bg-indigo-950/30 text-indigo-200 ml-4 border-r-2 border-indigo-500" : "bg-slate-900/50 text-gray-300 mr-4 border-l-2 border-slate-400"}`}>
                      <span className="font-mono text-[9px] text-gray-500 block mb-0.5">{ch.role === "user" ? "VOCÊ" : "PERITO IA"}</span>
                      {ch.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={submitQuestion} className="flex gap-1">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ex: Como as bordas provam colagem aqui?"
                  className="flex-1 bg-slate-950 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-gray-300 placeholder:text-gray-600 focus:outline-none focus:border-indigo-500/40"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl px-2.5 flex items-center justify-center transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
