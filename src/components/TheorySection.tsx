/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { BookOpen, ShieldAlert, Cpu, CheckCircle2, ChevronRight, HelpCircle, FileText, Compass, ListTodo, AlertTriangle } from "lucide-react";

export function TheorySection() {
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = [
    {
      title: "Contextualização & Problema",
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-sm">
            Com o avanço formidável da inteligência artificial generativa e de softwares de processamento de imagens, tornou-se comum o surgimento de fakes hiper-realistas e falsificações indetectáveis pelo olho humano.
          </p>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 mt-2">
            <h4 className="text-xs font-semibold text-slate-300 tracking-wider uppercase mb-2">Riscos e Impactos Sociais:</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 flex items-start gap-2">
                <span className="text-rose-500 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200 block">Segurança da Informação</span>
                  Estelionato, fraudes bancárias e invasão de dados.
                </div>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 flex items-start gap-2">
                <span className="text-amber-500 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200 block">Fake News</span>
                  Propagação de falsas narrativas e manipulações geopolíticas.
                </div>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 flex items-start gap-2">
                <span className="text-cyan-500 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200 block">Perícia Criminal</span>
                  Demanda por validação forense incontestável de evidências.
                </div>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded border border-slate-900 flex items-start gap-2">
                <span className="text-purple-500 font-bold">●</span>
                <div>
                  <span className="font-semibold text-slate-200 block">Fraudes de Identidade</span>
                  Deepfakes cibernéticos de identificação facial.
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "O que é & Como Funciona a Técnica ELA?",
      icon: <Cpu className="w-5 h-5 text-indigo-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-300 leading-relaxed text-sm">
            <strong>Error Level Analysis (ELA)</strong> é um método de computação forense que identifica diferenças no nível de compressão de imagens JPEG. Ele opera sob um princípio matemático fundamental da recompressão:
          </p>
          <div className="bg-slate-950 border border-indigo-900/30 p-3.5 rounded-xl font-mono text-xs text-indigo-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-indigo-900/40 px-2 py-0.5 text-[9px] text-indigo-200 rounded-bl">Equação de Erro</div>
            ELA_Pixel(x,y) = |Original_Pixel(x,y) - Recompressed_Pixel(x,y, Q)| × Boost
          </div>
          <p className="text-xs text-gray-400 leading-normal">
            Quando um arquivo JPEG é editado, a parte colada possui uma taxa de salvamentos menor do que o restante da imagem original. Ao re-salvarmos a imagem sob uma qualidade conhecida (ex: 95%), as partes homogêneas degradam de forma previsível e sutil, enquanto as seções adulteradas apresentam um erro de quantização muito superior, brilhando intensamente no mapa de contraste!
          </p>
        </div>
      ),
    },
    {
      title: "Fluxo Executivo do Algoritmo",
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      content: (
        <div className="relative mt-2">
          <div className="absolute left-3.5 top-0 bottom-0 w-0.5 bg-slate-800"></div>
          <div className="space-y-4">
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-950"></div>
              <h5 className="text-xs font-semibold text-indigo-300 uppercase">01. Carregamento & Matriz Original</h5>
              <p className="text-xs text-gray-400">Leitura espectral e conversão dos canais RGB da imagem sob análise.</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-950"></div>
              <h5 className="text-xs font-semibold text-blue-300 uppercase">02. Recompressão JPEG Integrada</h5>
              <p className="text-xs text-gray-400">Geração de uma versão re-salva temporária com taxa de qualidade de quantização padrão "Q" (ex: 95%).</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-amber-500 border-2 border-slate-950"></div>
              <h5 className="text-xs font-semibold text-amber-300 uppercase">03. Extração Numérica Absoluta</h5>
              <p className="text-xs text-gray-400">Cálculo de diferença delta canal-a-canal: <code className="text-[10px] bg-slate-900 border border-slate-800 px-1 py-0.5 text-slate-300">|Orig - Recomp|</code>.</p>
            </div>
            <div className="relative pl-8">
              <div className="absolute left-2 top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></div>
              <h5 className="text-xs font-semibold text-emerald-300 uppercase">04. Amplificação Forense (Boost map)</h5>
              <p className="text-xs text-gray-400">Multiplicação dos deltas para melhor visibilidade e plotagem do histograma cumulativo.</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Vantagens & Limitações da Técnica",
      icon: <AlertTriangle className="w-5 h-5 text-yellow-400" />,
      content: (
        <div className="grid grid-cols-2 gap-4 mt-1">
          <div className="bg-slate-900/40 border border-emerald-900/20 rounded-xl p-3">
            <h5 className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mb-2 uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" /> Vantagens Relevantes
            </h5>
            <ul className="text-[11px] text-gray-300 space-y-2">
              <li className="flex items-start gap-1">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Fácil implementação:</strong> Dispensável base de treinamento pesado de rede.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Baixo custo computacional:</strong> Análise instantânea diretamente via JavaScript-Canvas.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-emerald-500 font-bold">✓</span>
                <span><strong>Arquivos JPEG:</strong> Altamente eficiente para as compressões lossy comerciais.</span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/40 border border-rose-900/20 rounded-xl p-3">
            <h5 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5 mb-2 uppercase">
              <AlertTriangle className="w-3.5 h-3.5" /> Limitações Críticas
            </h5>
            <ul className="text-[11px] text-gray-300 space-y-2">
              <li className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✗</span>
                <span><strong>Sensível à recompressão:</strong> Re-salvamentos múltiplos tendem a dissipar as assinaturas.</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✗</span>
                <span><strong>Teto técnico:</strong> Não detecta alterações de metadados puros ou de compressão sem perda (PNGs originais).</span>
              </li>
              <li className="flex items-start gap-1">
                <span className="text-rose-500 font-bold">✗</span>
                <span><strong>Dependente de texturas e iluminação:</strong> Áreas com alto detalhamento natural exibem ruídos falsos.</span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Conclusão & Visão de Futuro",
      icon: <HelpCircle className="w-5 h-5 text-emerald-400" />,
      content: (
        <div className="space-y-3">
          <p className="text-gray-300 leading-relaxed text-sm">
            O estudo desenvolvido por <strong>Caio Henrique Vaz e Vagner Gomes Filho</strong> demonstra a persistência do Error Level Analysis como ferramenta prévia inestimável de triagem e inteligência forense digital.
          </p>
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-300 space-y-2">
            <span className="font-semibold text-slate-200 block text-indigo-300 tracking-wider">Diretrizes de Trabalhos Futuros:</span>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-slate-950 p-2 rounded border border-slate-900 text-center">
                <span className="text-indigo-400 block font-semibold mb-0.5">IA Automática</span>
                Modelos híbridos de CNNs e ELA.
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-900 text-center">
                <span className="text-indigo-400 block font-semibold mb-0.5">Forense em Vídeos</span>
                Análise frame-a-frame de compressão intraframe.
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-900 text-center">
                <span className="text-indigo-400 block font-semibold mb-0.5">Fusão PRNU</span>
                Assinaturas de ruído físico do sensor da lente.
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div id="theory-section" className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2 mb-6">
        <div className="bg-indigo-950 border border-indigo-500/20 p-2 rounded-lg">
          <BookOpen className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white tracking-tight leading-none mb-1">Fundamentos Acadêmicos da Pesquisa</h2>
          <span className="text-xs text-gray-400">Referenciais e embasamentos teóricos extraídos da apresentação original</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-1.5">
          {slides.map((s, index) => (
            <button
              id={`slide-tab-${index}`}
              key={index}
              onClick={() => setActiveSlide(index)}
              className={`flex items-center gap-3 text-left px-3.5 py-3 rounded-xl border text-xs font-medium transition-all ${
                activeSlide === index
                  ? "bg-indigo-950/40 border-indigo-500/40 text-white shadow-md shadow-indigo-950/40"
                  : "bg-slate-900/10 border-slate-900 hover:border-slate-800/60 text-slate-400 hover:text-slate-200"
              }`}
            >
              {s.icon}
              <span className="truncate flex-1">{s.title}</span>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeSlide === index ? "translate-x-1" : "opacity-30"}`} />
            </button>
          ))}
        </div>

        {/* Content Box */}
        <div className="md:col-span-3 bg-slate-950/35 border border-slate-900 rounded-2xl p-6 min-h-[280px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-900/80">
              <div className="p-1 text-slate-300">
                {slides[activeSlide].icon}
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">{slides[activeSlide].title}</h3>
            </div>
            {slides[activeSlide].content}
          </div>

          <div className="pt-4 border-t border-slate-900/80 flex items-center justify-between text-[11px] text-gray-500">
            <span>Processamento de Imagens • Caio Henrique Vaz & Vagner Gomes Filho</span>
            <span>Slide {activeSlide + 1} de {slides.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
