import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 image uploads
app.use(express.json({ limit: "50mb" }));

// Initialize Google GenAI if key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Google GenAI initialized successfully on server.");
  } catch (err) {
    console.error("Failed to initialize Google GenAI:", err);
  }
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI analysis features will be disabled.");
}

// 1. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasAiKey: !!apiKey,
    time: new Date().toISOString(),
  });
});

// 2. API: Forensic ELA AI Analyst
app.post("/api/gemini/analyze", async (req, res) => {
  if (!ai) {
    return res.status(503).json({
      error: "O serviço de IA não está configurado. Verifique a chave GEMINI_API_KEY nas configurações.",
    });
  }

  const { imageBase64, mimeType, notes, quality, boost } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "Falta a imagem para análise forense." });
  }

  try {
    // Strip header from base64 if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const systemInstruction = `Você é um Perito Criminal de Computação Forense e Processamento de Imagens altamente experiente, especialista na técnica Error Level Analysis (ELA) e em fraudes de mídia digital.
O usuário está conduzindo investigações ou análises forenses oficiais em imagens digitais.
Você receberá a imagem enviada (que pode ser original, editada ou mapa ELA) e parâmetros adicionais (Qualidade original configurada: ${quality || 95}%, Fator de amplificação: ${boost || 20}x).

Sua tarefa é fornecer um LAUDO TÉCNICO SUCINTO, EXTREMAMENTE OBJETIVO E RIGOROSO em português. Evite parágrafos longos, justificativas repetitivas ou explicações óbvias. Seja direto ao ponto. Use termos forenses precisos (ex: dupla compressão JPEG, matriz de quantização, descontinuidade de bordas, homogeneidade).

O laudo deve conter as seguintes seções estruturadas de forma muito breve:
1.  **DADOS DA ANÁLISE**:
    *   Técnica: Error Level Analysis (ELA)
    *   Recompressão (Q): ${quality || 95}%
    *   Amplificação (Boost): ${boost || 20}x
    *   Notas do Operador: ${notes || "Nenhuma."}
2.  **FUNDAMENTO DO ELA**: Uma explicação rápida (máximo de 3 linhas) de por que partes inseridas destoam em nível de erro.
3.  **CONSTATAÇÕES VISUAIS**: O que é visível nesta análise, avaliando brilhos anômalos, descontinuidades de bordas ou artefatos.
4.  **DIAGNÓSTICO E VEREDITO**: O seu veredito técnico direto e categórico (ex: Homogênea, Indício Forte de Montagem/Colagem, Inconsistência de Quantização por IA).
5.  **RECOMENDAÇÕES**: Próximas etapas rápidas em 1 ou 2 tópicos objetivos (ex: EXIF, PRNU, ou iluminação).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: base64Data,
          },
        },
        {
          text: `Por favor, analise a imagem fornecida de acordo com as instruções forenses. O operador relata o seguinte sobre este caso: "${notes || "Esta imagem está sendo analisada sob as lentes do sistema ELA para evidenciar anomalias no nível de compressão."}"`,
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.2, // Low temperature for consistent forensic output
      },
    });

    const report = response.text;
    res.json({ report });
  } catch (err: any) {
    console.error("Error calling Gemini API on server:", err);
    res.status(500).json({ error: err.message || "Erro desconhecido ao processar a análise com a IA." });
  }
});

// 3. Vite development middleware or static asset serving for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production files from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
