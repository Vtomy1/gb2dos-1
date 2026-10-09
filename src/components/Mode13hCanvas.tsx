import React, { useEffect, useRef, useState } from 'react';
import { GbcRomHeader, ConversionConfig } from '../types/gbc';
import { generateVgaDacPalette } from '../utils/dosExeGenerator';
import { GbcPaletteGridVisualizer } from './GbcPaletteGridVisualizer';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Sliders, 
  RotateCcw, 
  Sparkles, 
  Eye,
  Palette
} from 'lucide-react';

interface Mode13hCanvasProps {
  header: GbcRomHeader;
  romBytes: Uint8Array;
  config: ConversionConfig;
  onConfigChange?: (newConfig: ConversionConfig) => void;
}

export const Mode13hCanvas: React.FC<Mode13hCanvasProps> = ({
  header,
  romBytes,
  config,
  onConfigChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState(60);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [scanlines, setScanlines] = useState(true);
  const [aspectCorrection, setAspectCorrection] = useState(true); // 4:3 DOS aspect ratio
  const [activePaletteIndex, setActivePaletteIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play retro PC speaker / Sound Blaster chime
  const playRetroBeep = (freq = 440, duration = 0.08) => {
    if (!audioEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square'; // Classic 8-bit PC speaker square wave
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not allowed or failed
    }
  };

  // Main 320x200 Mode 13h VGA rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Standard Mode 13h resolution
    const V_WIDTH = 320;
    const V_HEIGHT = 200;
    canvas.width = V_WIDTH;
    canvas.height = V_HEIGHT;

    // Generate 256-color VGA DAC palette
    const vgaPalette = generateVgaDacPalette(header, config.vgaPaletteStrategy);

    // Framebuffer: 320 * 200 indices (each is 0..255 pointing to VGA DAC)
    const vgaBuffer = new Uint8Array(V_WIDTH * V_HEIGHT);

    let animationFrameId: number;
    let tick = 0;
    let lastTime = performance.now();
    let frameCount = 0;

    // Pre-calculate tile colors from ROM bytes
    const tilePatterns: number[][] = [];
    const sampleOffset = 0x0800; // where tiles were seeded
    const numTiles = 16;
    for (let t = 0; t < numTiles; t++) {
      const tile: number[] = [];
      const offset = Math.min(romBytes.length - 16, sampleOffset + t * 16);
      for (let y = 0; y < 8; y++) {
        const b0 = romBytes[offset + y * 2] || 0;
        const b1 = romBytes[offset + y * 2 + 1] || 0;
        for (let x = 0; x < 8; x++) {
          const bit0 = (b0 >> (7 - x)) & 1;
          const bit1 = (b1 >> (7 - x)) & 1;
          const colorId = (bit1 << 1) | bit0; // 0..3
          tile.push(colorId);
        }
      }
      tilePatterns.push(tile);
    }

    const render = (now: number) => {
      tick++;
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }

      // 1. Draw MS-DOS Mode 13h Border & HUD or Full Scale
      const isCentered = config.layoutMode === 'centered_160x144_hud';

      if (isCentered) {
        // Clear background with DOS dark slate color (index 8 = dark gray / index 1 = dark blue)
        vgaBuffer.fill(8);

        // Draw top DOS Status Bar (Lines 0..20)
        for (let y = 0; y < 22; y++) {
          for (let x = 0; x < V_WIDTH; x++) {
            vgaBuffer[y * V_WIDTH + x] = 1; // DOS Blue header
          }
        }
        // Line 22 separator
        for (let x = 0; x < V_WIDTH; x++) {
          vgaBuffer[22 * V_WIDTH + x] = 15; // Bright white border
        }

        // Draw bottom DOS Status Bar (Lines 178..199)
        for (let y = 178; y < V_HEIGHT; y++) {
          for (let x = 0; x < V_WIDTH; x++) {
            vgaBuffer[y * V_WIDTH + x] = 1; // DOS Blue footer
          }
        }
        // Line 177 separator
        for (let x = 0; x < V_WIDTH; x++) {
          vgaBuffer[177 * V_WIDTH + x] = 15;
        }

        // Draw Centered 160x144 GBC Viewport:
        // Top-left: X=80, Y=28. Bottom-right: X=240, Y=172
        const G_X = 80;
        const G_Y = 28;
        const G_W = 160;
        const G_H = 144;

        // Viewport outer border (color 14 = yellow or 7 = gray)
        for (let x = G_X - 1; x <= G_X + G_W; x++) {
          vgaBuffer[(G_Y - 1) * V_WIDTH + x] = 14;
          vgaBuffer[(G_Y + G_H) * V_WIDTH + x] = 14;
        }
        for (let y = G_Y - 1; y <= G_Y + G_H; y++) {
          vgaBuffer[y * V_WIDTH + (G_X - 1)] = 14;
          vgaBuffer[y * V_WIDTH + (G_X + G_W)] = 14;
        }

        // Render GBC pixels inside 160x144 viewport:
        // Background tiled grid + moving demo sprites
        const scrollX = Math.floor(tick * 0.8) % 160;
        const scrollY = Math.floor(tick * 0.4) % 144;

        for (let gy = 0; gy < G_H; gy++) {
          for (let gx = 0; gx < G_W; gx++) {
            const tileX = Math.floor((gx + scrollX) / 16) % 4;
            const tileY = Math.floor((gy + scrollY) / 16) % 4;
            const tileIdx = (tileY * 4 + tileX) % numTiles;
            const pX = (gx + scrollX) % 8;
            const pY = (gy + scrollY) % 8;
            const colorId = tilePatterns[tileIdx]?.[pY * 8 + pX] || 0;

            // Palette slot (GBC background palette 0..7 mapped to DAC 16..47)
            const palSlot = (tileX + tileY) % 4;
            const vgaColorIndex = 16 + palSlot * 4 + colorId;
            vgaBuffer[(G_Y + gy) * V_WIDTH + (G_X + gx)] = vgaColorIndex;
          }
        }

        // Render animated retro Game Boy Color hero sprite (spaceship / runner)
        const sprX = Math.round(G_X + 80 + Math.sin(tick * 0.04) * 45);
        const sprY = Math.round(G_Y + 72 + Math.cos(tick * 0.03) * 35);
        for (let sy = 0; sy < 16; sy++) {
          for (let sx = 0; sx < 16; sx++) {
            const dx = sx - 8;
            const dy = sy - 8;
            if (dx * dx + dy * dy < 50) {
              const targetX = sprX + sx - 8;
              const targetY = sprY + sy - 8;
              if (targetX >= G_X && targetX < G_X + G_W && targetY >= G_Y && targetY < G_Y + G_H) {
                // Sprite palette (DAC 48..63)
                vgaBuffer[targetY * V_WIDTH + targetX] = 48 + ((sx + sy) % 4);
              }
            }
          }
        }
      } else {
        // Scaled layout (320x200 stretched)
        for (let y = 0; y < V_HEIGHT; y++) {
          const gy = Math.floor((y / V_HEIGHT) * 144);
          for (let x = 0; x < V_WIDTH; x++) {
            const gx = Math.floor((x / V_WIDTH) * 160);
            const tileX = Math.floor(gx / 16) % 4;
            const tileY = Math.floor(gy / 16) % 4;
            const tileIdx = (tileY * 4 + tileX) % numTiles;
            const colorId = tilePatterns[tileIdx]?.[(gy % 8) * 8 + (gx % 8)] || 0;
            vgaBuffer[y * V_WIDTH + x] = 16 + ((tileX + tileY) % 4) * 4 + colorId;
          }
        }
      }

      // 2. Convert indexed VGA buffer into 32-bit RGBA ImageData for canvas
      const imgData = ctx.createImageData(V_WIDTH, V_HEIGHT);
      const data = imgData.data;

      for (let i = 0; i < V_WIDTH * V_HEIGHT; i++) {
        const colorIdx = vgaBuffer[i];
        // Multiply 6-bit DAC values (0..63) by 255/63 (approx 4.047) to get standard 8-bit RGB (0..255)
        const r = Math.min(255, Math.round(vgaPalette[colorIdx * 3] * 4.047));
        const g = Math.min(255, Math.round(vgaPalette[colorIdx * 3 + 1] * 4.047));
        const b = Math.min(255, Math.round(vgaPalette[colorIdx * 3 + 2] * 4.047));

        const pixelOffset = i * 4;
        data[pixelOffset] = r;
        data[pixelOffset + 1] = g;
        data[pixelOffset + 2] = b;
        data[pixelOffset + 3] = 255;
      }

      ctx.putImageData(imgData, 0, 0);

      // 3. Render authentic MS-DOS Mode 13h overlay text (BIOS bitmap style)
      if (isCentered) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px monospace';
        ctx.textRendering = 'geometricPrecision';

        // Top line
        ctx.fillText(`MS-DOS 6.22 [MODE 13h] 320x200x256`, 8, 10);
        ctx.fillStyle = '#ffff55';
        ctx.fillText(`ROM: ${header.title.slice(0, 10)} [${header.manufacturerCode}]`, 8, 19);

        // Bottom line
        ctx.fillStyle = '#55ffff';
        ctx.fillText(`DAC: 0x03C8/9`, 8, 187);
        ctx.fillText(`SEG: 0xA000`, 90, 187);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`VER: ${header.versionFormatted}`, 165, 187);
        ctx.fillText(`FPS: 60`, 245, 187);
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText(`160x144 Centered (X:80, Y:28)`, 8, 196);
        ctx.fillText(`PRESS [ESC] TO DOS`, 200, 196);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [header, romBytes, config]);

  const vgaPalette = generateVgaDacPalette(header, config.vgaPaletteStrategy);

  return (
    <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tv className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white font-mono tracking-wide uppercase">
            Virtual MS-DOS Mode 13h VGA Display (320×200 8-Bit)
          </h2>
        </div>

        {/* Display and Audio Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) playRetroBeep(587, 0.1);
            }}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              audioEnabled
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-[#181f2f] border-[#29344d] text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle PC Speaker / Sound Blaster Sound"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden md:inline">PC Speaker</span>
          </button>

          <button
            onClick={() => setScanlines(!scanlines)}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              scanlines
                ? 'bg-cyan-950/60 border-cyan-700 text-cyan-300'
                : 'bg-[#181f2f] border-[#29344d] text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle CRT Scanline Shader"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Scanlines</span>
          </button>

          <button
            onClick={() => setAspectCorrection(!aspectCorrection)}
            className={`p-2 rounded-lg border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
              aspectCorrection
                ? 'bg-purple-950/60 border-purple-700 text-purple-300'
                : 'bg-[#181f2f] border-[#29344d] text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 4:3 CRT Aspect Ratio"
          >
            <Maximize2 className="w-4 h-4 text-purple-400" />
            <span className="hidden md:inline">4:3 CRT</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Monitor Enclosure */}
      <div className="flex flex-col items-center">
        <div className="relative p-3 md:p-5 bg-[#07090e] border-2 border-[#1e2538] rounded-2xl shadow-2xl max-w-full">
          {/* CRT Monitor Bezel branding */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>IBM VGA COMPATIBLE · 70Hz REFRESH</span>
            </div>
            <span>MODE 13h (320x200 @ 256 COLORS)</span>
          </div>

          {/* CRT Screen Wrapper */}
          <div className={`relative overflow-hidden rounded-lg bg-black ${scanlines ? 'crt-screen' : ''}`}>
            <canvas
              ref={canvasRef}
              className={`pixel-art block transition-all ${
                aspectCorrection ? 'aspect-[4/3]' : 'aspect-[16/10]'
              }`}
              style={{
                width: '100%',
                maxWidth: '640px',
                height: 'auto',
              }}
            />
          </div>

          {/* CRT Bottom Bar */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 px-1">
            <span>RAM: 0xA0000 (64,000 BYTES)</span>
            <span>INT 10h AH=00h AL=13h</span>
            <span className="text-emerald-400 font-bold">{fps} FPS</span>
          </div>
        </div>
      </div>

      {/* Configuration Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Layout Switcher */}
        <div className="bg-[#0e121c] border border-[#1e2538] p-3.5 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Screen Frame Format
            </span>
            <span className="text-[11px] text-cyan-300 font-mono">
              {config.layoutMode === 'centered_160x144_hud' ? '160x144 Centered + HUD' : '320x200 Scaled'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              onClick={() => {
                onConfigChange?.({ ...config, layoutMode: 'centered_160x144_hud' });
                playRetroBeep(440);
              }}
              className={`py-2 px-3 rounded border text-left cursor-pointer transition-colors ${
                config.layoutMode === 'centered_160x144_hud'
                  ? 'bg-cyan-950/60 border-cyan-600 text-white font-bold'
                  : 'bg-[#131826] border-[#222a3f] text-slate-400 hover:text-white'
              }`}
            >
              <div>Centered 160×144</div>
              <div className="text-[10px] text-slate-400 font-normal">Authentic DOS status frame</div>
            </button>

            <button
              onClick={() => {
                onConfigChange?.({ ...config, layoutMode: 'scaled_320x200' });
                playRetroBeep(494);
              }}
              className={`py-2 px-3 rounded border text-left cursor-pointer transition-colors ${
                config.layoutMode === 'scaled_320x200'
                  ? 'bg-cyan-950/60 border-cyan-600 text-white font-bold'
                  : 'bg-[#131826] border-[#222a3f] text-slate-400 hover:text-white'
              }`}
            >
              <div>Scaled 320×200</div>
              <div className="text-[10px] text-slate-400 font-normal">Full-screen raster stretch</div>
            </button>
          </div>
        </div>

        {/* VGA DAC Palette Strategy */}
        <div className="bg-[#0e121c] border border-[#1e2538] p-3.5 rounded-lg space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-purple-400" />
              VGA DAC Translation Strategy
            </span>
            <span className="text-[11px] text-purple-300 font-mono">
              {config.vgaPaletteStrategy === 'dynamic_gbc_rgb555'
                ? 'GBC RGB555'
                : config.vgaPaletteStrategy === 'high_contrast'
                ? 'High Contrast'
                : 'DMG Phosphor'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
            {[
              { id: 'dynamic_gbc_rgb555', label: 'Color Handheld', sub: 'Dynamic 15-bit' },
              { id: 'high_contrast', label: 'VGA Arcade', sub: 'High Contrast' },
              { id: 'classic_phosphor_green', label: 'DMG Green', sub: 'Dot Matrix' },
            ].map(pal => (
              <button
                key={pal.id}
                onClick={() => {
                  onConfigChange?.({
                    ...config,
                    vgaPaletteStrategy: pal.id as ConversionConfig['vgaPaletteStrategy'],
                  });
                  playRetroBeep(523);
                }}
                className={`py-1.5 px-2 rounded border text-center cursor-pointer transition-colors ${
                  config.vgaPaletteStrategy === pal.id
                    ? 'bg-purple-950/60 border-purple-600 text-white font-bold'
                    : 'bg-[#131826] border-[#222a3f] text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[11px]">{pal.label}</div>
                <div className="text-[9px] text-slate-500 font-normal">{pal.sub}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VGA 256-Color DAC Palette Visualizer */}
      <div className="bg-[#0b0e17] border border-[#1a1f2e] rounded-xl p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">VGA DAC 256-Color Palette Table</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Ports 0x03C8 / 0x03C9 (6-Bit RGB: 0..63)</span>
          </div>

          {activePaletteIndex !== null ? (
            <div className="text-cyan-300 font-bold">
              Index #{activePaletteIndex} · R:{vgaPalette[activePaletteIndex * 3]} G:{vgaPalette[activePaletteIndex * 3 + 1]} B:{vgaPalette[activePaletteIndex * 3 + 2]}
            </div>
          ) : (
            <div className="text-slate-500 text-[11px]">Hover over any cell to inspect DAC color channels</div>
          )}
        </div>

        {/* 256 color palette grid */}
        <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-1 bg-black rounded-lg border border-slate-900 overflow-x-auto">
          {Array.from({ length: 256 }).map((_, idx) => {
            const r = Math.round(vgaPalette[idx * 3] * 4.047);
            const g = Math.round(vgaPalette[idx * 3 + 1] * 4.047);
            const b = Math.round(vgaPalette[idx * 3 + 2] * 4.047);

            return (
              <div
                key={idx}
                onMouseEnter={() => setActivePaletteIndex(idx)}
                onMouseLeave={() => setActivePaletteIndex(null)}
                className="w-full aspect-square rounded-[2px] cursor-pointer transition-transform hover:scale-125 hover:z-10 hover:ring-2 hover:ring-white"
                style={{ backgroundColor: `rgb(${r}, ${g}, ${b})` }}
                title={`VGA Color #${idx}: R=${vgaPalette[idx * 3]}, G=${vgaPalette[idx * 3 + 1]}, B=${vgaPalette[idx * 3 + 2]}`}
              />
            );
          })}
        </div>
      </div>

      {/* 2D GBC Palette Grid Visualizer & RGB Inspector */}
      <GbcPaletteGridVisualizer
        header={header}
        romBytes={romBytes}
        config={config}
      />
    </div>
  );
};
