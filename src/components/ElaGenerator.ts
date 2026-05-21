/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ElaOptions, ForensicStats } from "../types";

/**
 * Computes Error Level Analysis (ELA) on an HTMLCanvasElement.
 * Formula: ELA = |OriginalPixel - RecompressedPixel| * boost_scale
 */
export function computeEla(
  originalCanvas: HTMLCanvasElement,
  options: ElaOptions,
  onComplete: (elaCanvas: HTMLCanvasElement, stats: ForensicStats) => void,
  onError?: (error: any) => void
) {
  const width = originalCanvas.width;
  const height = originalCanvas.height;

  // 1. Convert original canvas to a JPEG data URL with quality Q
  let jpegUrl = "";
  try {
    jpegUrl = originalCanvas.toDataURL("image/jpeg", options.quality);
  } catch (err) {
    if (onError) onError(err);
    return;
  }

  // 2. Load the JPEG data URL back into an Image object
  const tempImg = new Image();
  tempImg.onload = () => {
    try {
      // 3. Create a recompressed canvas and draw the JPEG image onto it
      const decompressedCanvas = document.createElement("canvas");
      decompressedCanvas.width = width;
      decompressedCanvas.height = height;
      const decompContext = decompressedCanvas.getContext("2d");
      if (!decompContext) {
        throw new Error("Could not get 2D context for decompressed canvas");
      }
      decompContext.drawImage(tempImg, 0, 0);

      // 4. Get pixel buffers for original and recompressed
      const origCtx = originalCanvas.getContext("2d");
      if (!origCtx) {
        throw new Error("Could not get 2D context for original canvas");
      }
      const origData = origCtx.getImageData(0, 0, width, height);
      const decompData = decompContext.getImageData(0, 0, width, height);

      // 5. Create ELA output image data
      const elaCanvas = document.createElement("canvas");
      elaCanvas.width = width;
      elaCanvas.height = height;
      const elaCtx = elaCanvas.getContext("2d");
      if (!elaCtx) {
        throw new Error("Could not get ELA canvas context");
      }
      const elaData = elaCtx.createImageData(width, height);

      let totalDiff = 0;
      let maxDiff = 0;
      const channelDiffs = { r: 0, g: 0, b: 0 };
      
      // Create an array to aggregate error level counts for histogram (0-255 range)
      const histogramBuckets = new Array(256).fill(0);

      for (let i = 0; i < origData.data.length; i += 4) {
        const r1 = origData.data[i];
        const g1 = origData.data[i + 1];
        const b1 = origData.data[i + 2];

        const r2 = decompData.data[i];
        const g2 = decompData.data[i + 1];
        const b2 = decompData.data[i + 2];

        // Absolute difference
        const dr = Math.abs(r1 - r2);
        const dg = Math.abs(g1 - g2);
        const db = Math.abs(b1 - b2);

        // Average pixel difference
        const pixelDiff = (dr + dg + db) / 3;
        totalDiff += pixelDiff;
        if (pixelDiff > maxDiff) maxDiff = pixelDiff;

        channelDiffs.r += dr;
        channelDiffs.g += dg;
        channelDiffs.b += db;

        // Apply multiplier boost
        let outR = Math.min(255, dr * options.boost);
        let outG = Math.min(255, dg * options.boost);
        let outB = Math.min(255, db * options.boost);

        // Filtering channels
        if (options.channel === "red") {
          outG = 0;
          outB = 0;
        } else if (options.channel === "green") {
          outR = 0;
          outB = 0;
        } else if (options.channel === "blue") {
          outR = 0;
          outG = 0;
        } else if (options.channel === "gray") {
          const val = Math.round((outR + outG + outB) / 3);
          outR = val;
          outG = val;
          outB = val;
        }

        elaData.data[i] = outR;
        elaData.data[i + 1] = outG;
        elaData.data[i + 2] = outB;
        elaData.data[i + 3] = 255; // opaque

        // Populating histogram based on ELA intensity
        const intensity = Math.min(255, Math.round(pixelDiff * options.boost));
        histogramBuckets[intensity]++;
      }

      elaCtx.putImageData(elaData, 0, 0);

      const numPixels = width * height;
      const avgError = totalDiff / numPixels;

      // Detect suspect areas based on high-frequency spikes
      let varianceSum = 0;
      for (let i = 0; i < origData.data.length; i += 4) {
        const r1 = origData.data[i];
        const g1 = origData.data[i + 1];
        const b1 = origData.data[i + 2];
        const r2 = decompData.data[i];
        const g2 = decompData.data[i + 1];
        const b2 = decompData.data[i + 2];
        const pixelDiff = (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2)) / 3;
        varianceSum += Math.pow(pixelDiff - avgError, 2);
      }
      const variance = varianceSum / numPixels;
      const stdDev = Math.sqrt(variance);

      // Determine heuristic anomaly score between 0 and 100
      let highErrorPixelCount = 0;
      for (let j = 80; j < 256; j++) {
        highErrorPixelCount += histogramBuckets[j];
      }
      const highErrorRatio = (highErrorPixelCount / numPixels) * 100;

      // Define anomaly score: ratio of high outlier error pixels + average recompression delta
      let anomalyScore = Math.min(100, Math.round(highErrorRatio * 20 + avgError * 6 + stdDev * 8));
      if (anomalyScore < 3) anomalyScore = 1 + (anomalyScore % 3);

      // Set Verdict
      let verdict: ForensicStats["integrityVerdict"] = "HOMOGENEA";
      if (anomalyScore > 65) {
        verdict = "MONTAGEM_FORTE";
      } else if (anomalyScore > 35) {
        verdict = "DEEPFAKE_INCONSISTENTE";
      } else if (anomalyScore > 10) {
        verdict = "ALTERACAO_DETECTADA";
      }

      // Prepare down-sampled histogram for charts (to prevent huge charting payload, we group into 16 bins)
      const groupedHistogram = [];
      const binSize = 8; // 256 / 32 bins
      for (let bin = 0; bin < 32; bin++) {
        let sum = 0;
        for (let offset = 0; offset < binSize; offset++) {
          sum += histogramBuckets[bin * binSize + offset];
        }
        groupedHistogram.push({
          errorLevel: bin * binSize,
          count: sum,
        });
      }

      onComplete(elaCanvas, {
        avgError: parseFloat(avgError.toFixed(2)),
        maxError: parseFloat(maxDiff.toFixed(2)),
        channelError: {
          r: parseFloat((channelDiffs.r / numPixels).toFixed(2)),
          g: parseFloat((channelDiffs.g / numPixels).toFixed(2)),
          b: parseFloat((channelDiffs.b / numPixels).toFixed(2)),
        },
        histogram: groupedHistogram,
        anomalyScore,
        integrityVerdict: verdict,
      });
    } catch (err) {
      if (onError) onError(err);
    }
  };

  tempImg.onerror = (err) => {
    if (onError) onError(err);
  };

  tempImg.src = jpegUrl;
}

/**
 * Draws a futuristic/sci-fi portrait of a human face
 */
function drawFace(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Base head shape
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = "#f3e8ff";
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#c084fc";
  ctx.stroke();

  // Neck
  ctx.beginPath();
  ctx.rect(cx - r/3, cy + r - 10, r * 0.66, r * 0.7);
  ctx.fillStyle = "#e9d5ff";
  ctx.fill();
  ctx.stroke();

  // Hair
  ctx.beginPath();
  ctx.arc(cx, cy - r/4, r * 1.1, Math.PI, Math.PI * 2);
  ctx.fillStyle = "#3b0764";
  ctx.fill();

  // Eyes
  ctx.beginPath();
  ctx.arc(cx - r/3, cy - r/6, r/8, 0, Math.PI * 2);
  ctx.arc(cx + r/3, cy - r/6, r/8, 0, Math.PI * 2);
  ctx.fillStyle = "#1e1b4b";
  ctx.fill();

  // Pupils (Glow)
  ctx.beginPath();
  ctx.arc(cx - r/3, cy - r/6, r/24, 0, Math.PI * 2);
  ctx.arc(cx + r/3, cy - r/6, r/24, 0, Math.PI * 2);
  ctx.fillStyle = "#a855f7";
  ctx.fill();

  // Nose
  ctx.beginPath();
  ctx.moveTo(cx, cy - r/10);
  ctx.lineTo(cx - 5, cy + r/5);
  ctx.lineTo(cx + 8, cy + r/5);
  ctx.closePath();
  ctx.fillStyle = "#d8b4fe";
  ctx.fill();

  // Smile
  ctx.beginPath();
  ctx.arc(cx, cy + r/3, r/4, 0, Math.PI);
  ctx.strokeStyle = "#581c87";
  ctx.lineWidth = 3;
  ctx.stroke();
}

/**
 * Generates the preset sample canvases
 */
export function generatePreset(type: "original" | "edited" | "deepfake"): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // Clear background
  ctx.fillStyle = "#0f172a"; // Deep space base
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper to draw academic background (grid + sky mountains representation)
  const drawBackground = () => {
    // Cyber Grid
    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Sky soft gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, "#121829");
    skyGrad.addColorStop(0.6, "#1e1e38");
    skyGrad.addColorStop(1, "#312e81");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Warm radial sun
    const sunGrad = ctx.createRadialGradient(480, 120, 10, 480, 120, 120);
    sunGrad.addColorStop(0, "rgba(251, 146, 60, 0.8)");
    sunGrad.addColorStop(0.5, "rgba(236, 72, 153, 0.2)");
    sunGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(480, 120, 120, 0, Math.PI * 2);
    ctx.fill();

    // Landscape peaks
    ctx.fillStyle = "rgba(49, 46, 129, 0.9)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(150, 150);
    ctx.lineTo(300, 320);
    ctx.lineTo(480, 180);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(67, 56, 202, 0.8)";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    ctx.lineTo(240, 240);
    ctx.lineTo(400, 310);
    ctx.lineTo(550, 210);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    // Geometric structure representing database / academic elements
    ctx.fillStyle = "rgba(129, 140, 248, 0.15)";
    ctx.strokeStyle = "rgba(129, 140, 248, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(50, 180, 140, 140);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(50, 180);
    ctx.lineTo(120, 120);
    ctx.lineTo(190, 180);
    ctx.closePath();
    ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
    ctx.fill();
    ctx.stroke();

    // Text label drawn on pristine base
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillText("ESTRUTURA INTEGRAL DE DADOS", 45, 350);
  };

  if (type === "original") {
    // ----------------------------------------------------
    // TYPE 1: ORIGINAL (Prisine Single-Pass Image)
    // ----------------------------------------------------
    drawBackground();

    // Recompress it so the output feels like a standard JPEG format photo
    const pristineUrl = canvas.toDataURL("image/jpeg", 0.9);
    const img = new Image();
    img.src = pristineUrl;
    // We keep it as is, drawn all together.

  } else if (type === "edited") {
    // ----------------------------------------------------
    // TYPE 2: EDITED (Spliced high-frequency overlay)
    // ----------------------------------------------------
    // Draw background
    drawBackground();

    // Compress the canvas background to low quality JPEG to degrade its high-frequencies!
    const jpegUrl = canvas.toDataURL("image/jpeg", 0.6); // heavily degrade background quantization elements
    
    // Create a synchronous simulation of loading back and placing high-contrast object on top
    // Because in an asset generator we want it immediate, we will paint a pre-degraded mosaic manually,
    // then draw the clean object directly with ultra-sharp edges, creating a perfect recompression mismatch!
    
    // Let's degrade background pixels slightly to simulate JPEG block artifacts
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Blockify background (except our new element) to simulate double compression mismatch
    const bSize = 8;
    for (let y = 0; y < canvas.height - bSize; y += bSize) {
      for (let x = 0; x < canvas.width - bSize; x += bSize) {
        // Sample cell average
        const offset = (y * canvas.width + x) * 4;
        const r = imgData.data[offset];
        const g = imgData.data[offset + 1];
        const b = imgData.data[offset + 2];
        
        // Write slight block variance to give real blocky texture
        for (let bx = 0; bx < bSize; bx++) {
          for (let by = 0; by < bSize; by++) {
            const destOffset = ((y + by) * canvas.width + (x + bx)) * 4;
            // Slight jitter
            const jitterR = Math.max(0, Math.min(255, r + Math.sin(x + y) * 2));
            const jitterG = Math.max(0, Math.min(255, g + Math.cos(x + y) * 2));
            const jitterB = Math.max(0, Math.min(255, b + Math.sin(x - y) * 2));
            
            imgData.data[destOffset] = jitterR;
            imgData.data[destOffset + 1] = jitterG;
            imgData.data[destOffset + 2] = jitterB;
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // DRAW THE SPLICE: Drawing an external object that never suffered prior compression!
    // We draw a glowing yellow caution hazard badge saying "EDITADO" or "FORGED"
    ctx.save();
    ctx.shadowColor = "rgba(239, 68, 68, 0.6)";
    ctx.shadowBlur = 15;
    
    // Red border warning sign
    ctx.fillStyle = "#facc15"; // bright gold yellow
    ctx.beginPath();
    ctx.moveTo(350, 160);
    ctx.lineTo(520, 160);
    ctx.lineTo(435, 60);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#dc2626"; // highly saturated red border
    ctx.lineWidth = 6;
    ctx.stroke();

    // Exclamation point
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.arc(435, 142, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(431, 95, 8, 35);

    // Text banner with crisp edge
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(310, 180, 250, 45);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(310, 180, 250, 45);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("FORGED / EDITADO", 435, 211);
    ctx.restore();

  } else if (type === "deepfake") {
    // ----------------------------------------------------
    // TYPE 3: DEEPFAKE (Facial swap overlay mismatch)
    // ----------------------------------------------------
    drawBackground();

    // Draw base face and compress
    drawFace(ctx, 320, 200, 110);
    
    // Simulate recompression blocks on base face
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const bSize = 8;
    for (let y = 0; y < canvas.height - bSize; y += bSize) {
      for (let x = 0; x < canvas.width - bSize; x += bSize) {
        const offset = (y * canvas.width + x) * 4;
        const r = imgData.data[offset];
        const g = imgData.data[offset + 1];
        const b = imgData.data[offset + 2];
        for (let bx = 0; bx < bSize; bx++) {
          for (let by = 0; by < bSize; by++) {
            const destOffset = ((y + by) * canvas.width + (x + bx)) * 4;
            const jitter = Math.sin((x+bx)/16) * 4;
            imgData.data[destOffset] = Math.max(0, Math.min(255, r + jitter));
            imgData.data[destOffset+1] = Math.max(0, Math.min(255, g + jitter));
            imgData.data[destOffset+2] = Math.max(0, Math.min(255, b + jitter));
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // DRAW THE DEEPFAKE GLOW CIRCLE (Represent face replacement)
    // Draw a swapped alien facial oval on top of the original face!
    ctx.save();
    ctx.beginPath();
    ctx.arc(320, 195, 75, 0, Math.PI * 2);
    ctx.clip();

    // Drawing alternate neon blue alien face details inside clip
    ctx.fillStyle = "#06b6d4"; // Cyan face glow
    ctx.fillRect(200, 100, 240, 200);

    // Alien Eyes
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(290, 185, 22, 10, Math.PI/10, 0, Math.PI*2);
    ctx.ellipse(350, 185, 22, 10, -Math.PI/10, 0, Math.PI*2);
    ctx.fill();

    ctx.fillStyle = "#0891b2";
    ctx.beginPath();
    ctx.arc(290, 185, 6, 0, Math.PI*2);
    ctx.arc(350, 185, 6, 0, Math.PI*2);
    ctx.fill();

    // Blue mouth
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, 225);
    ctx.quadraticCurveTo(320, 240, 340, 225);
    ctx.stroke();

    ctx.restore();

    // Forensic bounding indicator overlay (with different compression / extremely crisp edges)
    ctx.strokeStyle = "#e11d48"; // magenta line
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(320, 195, 75, 0, Math.PI * 2);
    ctx.stroke();

    // Forensic Tag
    ctx.fillStyle = "#e11d48";
    ctx.fillRect(250, 100, 140, 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("IA SWAP DETECTADA [91.4%]", 320, 115);
    ctx.restore();
  }

  return canvas;
}
