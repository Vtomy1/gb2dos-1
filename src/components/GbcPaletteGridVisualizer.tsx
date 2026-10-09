import React, { useState } from 'react';
import { GbcRomHeader, ConversionConfig } from '../types/gbc';
import { extractGbcPalettesFromRom, GbcColorEntry } from '../utils/gbcPaletteExtractor';
import { 
  Palette, 
  Eye, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Sliders, 
  Tv, 
  Cpu, 
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

interface GbcPaletteGridVisualizerProps {
  header: GbcRomHeader;
  romBytes: Uint8Array;
  config: ConversionConfig;
}

export const GbcPaletteGridVisualizer: React.FC<GbcPaletteGridVisualizerProps> = ({
  header,
  romBytes,
  config,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'bg' | 'obj'>('all');
  const [displayMode, setDisplayMode] = useState<'rgb555' | 'vga_dac' | 'gbc_hex' | 'screen_hex'>('rgb555');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Extract all 64 GBC color entries mapped to VGA Mode 13h DAC
  const paletteEntries = extractGbcPalettesFromRom(header, romBytes, config.vgaPaletteStrategy);

  // Selected entry for deep inspection (defaults to first non-white color BG0[1])
  const [selectedEntry, setSelectedEntry] = useState<GbcColorEntry>(paletteEntries[1] || paletteEntries[0]);

  // Group entries by palette (8 BG palettes + 8 OBJ palettes)
  const palettesGrouped = Array.from({ length: 16 }).map((_, pIdx) => {
    const isObj = pIdx >= 8;
    const pType: 'BG' | 'OBJ' = isObj ? 'OBJ' : 'BG';
    const pNumber = isObj ? pIdx - 8 : pIdx;
    const colors = paletteEntries.filter(e => e.paletteType === pType && e.paletteIndex === pNumber);
    return {
      id: `${pType}${pNumber}`,
      type: pType,
      index: pNumber,
      colors,
    };
  });

  const filteredPalettes = palettesGrouped.filter(p => {
    if (filterType === 'bg') return p.type === 'BG';
    if (filterType === 'obj') return p.type === 'OBJ';
    return true;
  });

  const handleCopyCode = (format: 'c' | 'asm') => {
    if (format === 'c') {
      const code = `/* MS-DOS Mode 13h VGA DAC Palette (6-bit RGB 0..63) for ${header.title} */
const unsigned char vga_palette[192] = {
${filteredPalettes.map(p => `    /* ${p.id} */ ` + p.colors.map(c => `${c.vgaRed}, ${c.vgaGreen}, ${c.vgaBlue}`).join(', ')).join(',\n')}
};`;
      navigator.clipboard.writeText(code);
      setCopiedCode('c');
    } else {
      const code = `; MS-DOS Mode 13h TASM/NASM Palette Table for ${header.title}
VgaPalTable LABEL BYTE
${filteredPalettes.map(p => `    DB ` + p.colors.map(c => `${c.vgaRed}, ${c.vgaGreen}, ${c.vgaBlue}`).join(', ') + ` ; ${p.id}`).join('\n')}`;
      navigator.clipboard.writeText(code);
      setCopiedCode('asm');
    }
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleDownloadPal = () => {
    const buf = new Uint8Array(256 * 3);
    paletteEntries.forEach(entry => {
      buf[entry.vgaDacIndex * 3] = entry.vgaRed;
      buf[entry.vgaDacIndex * 3 + 1] = entry.vgaGreen;
      buf[entry.vgaDacIndex * 3 + 2] = entry.vgaBlue;
    });
    const blob = new Blob([buf.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${header.title.replace(/[^a-zA-Z0-9]/g, '_')}_GBC_VGA.PAL`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 md:p-6 space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>HARDWARE PALETTE MATRIX</span>
            <span aria-hidden="true">·</span>
            <span>GBC 15-BIT RGB555 $\rightarrow$ VGA MODE 13h 6-BIT DAC</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">{header.title}</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold font-mono text-white tracking-wide mt-0.5">
            GBC ROM Color Palette 2D Inspector
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl mt-1 font-mono">
            Renders the 16 hardware color palettes extracted from the ROM header as a 2D grid.
            Inspect individual RGB channel values and their conversion into VGA DAC registers (Ports 0x03C8/9).
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleCopyCode('c')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182030] hover:bg-[#222c42] border border-[#2b3754] text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-colors cursor-pointer"
            title="Copy as C array for Turbo C / OpenWatcom"
          >
            {copiedCode === 'c' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy C Array</span>
          </button>

          <button
            onClick={() => handleCopyCode('asm')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182030] hover:bg-[#222c42] border border-[#2b3754] text-slate-300 hover:text-white text-xs font-mono rounded-lg transition-colors cursor-pointer"
            title="Copy as TASM/NASM DB table"
          >
            {copiedCode === 'asm' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy ASM .DB</span>
          </button>

          <button
            onClick={handleDownloadPal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-200 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer"
            title="Download standard 768-byte palette file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export .PAL</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Display Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0a0d14] border border-[#1b2234] rounded-lg">
        {/* Filter Palette Type */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Palette Group:</span>
          <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded border border-[#22293b]">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All 16 Palettes (64c)
            </button>
            <button
              onClick={() => setFilterType('bg')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                filterType === 'bg'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Background (BG0–7)
            </button>
            <button
              onClick={() => setFilterType('obj')}
              className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                filterType === 'obj'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sprites (OBJ0–7)
            </button>
          </div>
        </div>

        {/* Display Format in Grid Cells */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Swatch Value:</span>
          <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded border border-[#22293b]">
            <button
              onClick={() => setDisplayMode('rgb555')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                displayMode === 'rgb555'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show 5-bit GBC RGB channels (0..31)"
            >
              GBC RGB555
            </button>
            <button
              onClick={() => setDisplayMode('vga_dac')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                displayMode === 'vga_dac'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show 6-bit VGA DAC channels (0..63)"
            >
              VGA 6-Bit DAC
            </button>
            <button
              onClick={() => setDisplayMode('gbc_hex')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                displayMode === 'gbc_hex'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show 15-bit hex word ($7FFF)"
            >
              GBC Hex ($word)
            </button>
            <button
              onClick={() => setDisplayMode('screen_hex')}
              className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                displayMode === 'screen_hex'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Show 24-bit screen color (#RRGGBB)"
            >
              24-Bit #HEX
            </button>
          </div>
        </div>
      </div>

      {/* 3. 2D Interactive Palette Matrix Grid */}
      <div className="overflow-x-auto bg-[#08090d] border border-[#1b2234] rounded-xl p-4">
        <div className="min-w-[680px] space-y-2 font-mono text-xs">
          {/* Header row: Column titles */}
          <div className="grid grid-cols-5 gap-3 pb-2 border-b border-slate-800 text-[11px] text-slate-500 font-bold select-none">
            <span className="w-24">PALETTE ID</span>
            <span>COLOR 0 (BACK / TRANS)</span>
            <span>COLOR 1 (LIGHT TONE)</span>
            <span>COLOR 2 (MID TONE)</span>
            <span>COLOR 3 (SHADOW / OUTLINE)</span>
          </div>

          {/* 2D Grid Rows */}
          {filteredPalettes.map(palette => (
            <div
              key={palette.id}
              className="grid grid-cols-5 gap-3 items-center py-1.5 px-2 rounded-lg hover:bg-slate-900/40 transition-colors"
            >
              {/* Palette Label */}
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${palette.type === 'BG' ? 'bg-cyan-400' : 'bg-purple-400'}`} />
                <span className="font-bold text-white tracking-wide text-xs">
                  {palette.id}
                </span>
                <span className="text-[10px] text-slate-500">
                  ({palette.type === 'BG' ? 'Background' : 'Sprite'})
                </span>
              </div>

              {/* 4 Color Cells */}
              {palette.colors.map(color => {
                const isSelected =
                  selectedEntry.paletteType === color.paletteType &&
                  selectedEntry.paletteIndex === color.paletteIndex &&
                  selectedEntry.colorIndex === color.colorIndex;

                let labelValue = '';
                if (displayMode === 'rgb555') {
                  labelValue = `R:${color.gbcRed} G:${color.gbcGreen} B:${color.gbcBlue}`;
                } else if (displayMode === 'vga_dac') {
                  labelValue = `VGA: ${color.vgaRed},${color.vgaGreen},${color.vgaBlue}`;
                } else if (displayMode === 'gbc_hex') {
                  labelValue = `$${color.gbcWord.toString(16).padStart(4, '0').toUpperCase()}`;
                } else {
                  labelValue = color.hexColor;
                }

                return (
                  <button
                    key={color.colorIndex}
                    onClick={() => setSelectedEntry(color)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 ring-2 ring-cyan-400/50 shadow-md'
                        : 'border-[#1f2638] bg-[#0d1017] hover:border-slate-600 hover:bg-[#141924]'
                    }`}
                  >
                    {/* Color Swatch */}
                    <div
                      className="w-8 h-8 rounded-md shrink-0 border border-black/40 shadow-inner"
                      style={{ backgroundColor: color.hexColor }}
                    />

                    {/* Text values */}
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-bold text-white truncate">
                        {labelValue}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                        <span>DAC #{color.vgaDacIndex}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-400 font-semibold">${color.gbcWord.toString(16).padStart(4, '0').toUpperCase()}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Deep Channel Inspector Panel for Selected Color Swatch */}
      <div className="bg-[#0b0e17] border-2 border-[#20293d] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1a2133] pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg border-2 border-white/20 shadow-lg"
              style={{ backgroundColor: selectedEntry.hexColor }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white font-mono">
                  {selectedEntry.slotName} Inspector
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 font-mono font-bold">
                  {selectedEntry.paletteType === 'BG' ? 'Background Palette' : 'Sprite/OBJ Palette'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Color Slot #{selectedEntry.colorIndex}{' '}
                {selectedEntry.colorIndex === 0
                  ? '(Transparent / Base)'
                  : selectedEntry.colorIndex === 1
                  ? '(Light Highlight)'
                  : selectedEntry.colorIndex === 2
                  ? '(Midtone)'
                  : '(Dark / Outline)'}
                {' '}· Screen Color: <span className="text-white font-bold">{selectedEntry.hexColor}</span>
              </div>
            </div>
          </div>

          <div className="text-xs font-mono text-right text-slate-400">
            <div>VGA Video Segment: <span className="text-white font-bold">0xA000:0000</span></div>
            <div>VGA DAC Register: <span className="text-cyan-400 font-bold">#{selectedEntry.vgaDacIndex}</span></div>
          </div>
        </div>

        {/* Side-by-Side Channel Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
          {/* Left: GBC 15-Bit RGB555 Channel Breakdown */}
          <div className="bg-[#0e121c] border border-[#1d2436] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Cpu className="w-4 h-4 text-purple-400" />
                GBC 15-Bit RGB555 Architecture
              </span>
              <span className="text-cyan-400">Word: ${selectedEntry.gbcWord.toString(16).padStart(4, '0').toUpperCase()}</span>
            </div>

            <div className="space-y-2 text-slate-300">
              {/* Red 5-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-rose-400 font-bold">Red (Bits 0–4):</span>
                  <span>{selectedEntry.gbcRed} / 31 ({(selectedEntry.gbcRed / 31 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(selectedEntry.gbcRed / 31) * 100}%` }}
                  />
                </div>
              </div>

              {/* Green 5-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold">Green (Bits 5–9):</span>
                  <span>{selectedEntry.gbcGreen} / 31 ({(selectedEntry.gbcGreen / 31 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(selectedEntry.gbcGreen / 31) * 100}%` }}
                  />
                </div>
              </div>

              {/* Blue 5-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-sky-400 font-bold">Blue (Bits 10–14):</span>
                  <span>{selectedEntry.gbcBlue} / 31 ({(selectedEntry.gbcBlue / 31 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${(selectedEntry.gbcBlue / 31) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Binary Bit Layout */}
            <div className="pt-2 border-t border-[#1a2133] space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Binary Word (%0BBBBBGGGGGRRRRR):</span>
                <span className="text-white font-mono font-bold">
                  %{selectedEntry.gbcWord.toString(2).padStart(15, '0')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Little-Endian Raw Bytes:</span>
                <span className="text-cyan-300 font-mono font-bold">
                  0x{selectedEntry.rawByte0.toString(16).padStart(2, '0').toUpperCase()} (low), 0x{selectedEntry.rawByte1.toString(16).padStart(2, '0').toUpperCase()} (high)
                </span>
              </div>
            </div>
          </div>

          {/* Right: MS-DOS Mode 13h VGA 6-Bit DAC Specification */}
          <div className="bg-[#0e121c] border border-[#1d2436] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Tv className="w-4 h-4 text-cyan-400" />
                MS-DOS Mode 13h VGA 6-Bit DAC
              </span>
              <span className="text-emerald-400">DAC Register #{selectedEntry.vgaDacIndex}</span>
            </div>

            <div className="space-y-2 text-slate-300">
              {/* VGA Red 6-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-rose-400 font-bold">DAC Red (Port 03C9h):</span>
                  <span>{selectedEntry.vgaRed} / 63 ({(selectedEntry.vgaRed / 63 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(selectedEntry.vgaRed / 63) * 100}%` }}
                  />
                </div>
              </div>

              {/* VGA Green 6-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-400 font-bold">DAC Green (Port 03C9h):</span>
                  <span>{selectedEntry.vgaGreen} / 63 ({(selectedEntry.vgaGreen / 63 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(selectedEntry.vgaGreen / 63) * 100}%` }}
                  />
                </div>
              </div>

              {/* VGA Blue 6-bit */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-sky-400 font-bold">DAC Blue (Port 03C9h):</span>
                  <span>{selectedEntry.vgaBlue} / 63 ({(selectedEntry.vgaBlue / 63 * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{ width: `${(selectedEntry.vgaBlue / 63) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* x86 Real-Mode Assembly Instruction snippet */}
            <div className="pt-2 border-t border-[#1a2133] space-y-1 text-[11px] text-slate-400">
              <div className="text-[10px] text-slate-500 font-mono">Real-Mode x86 DAC Port Programming:</div>
              <pre className="bg-[#06080d] p-1.5 rounded text-[10px] text-emerald-300 font-mono">
{`MOV DX, 03C8h ; DAC Index Port
MOV AL, ${selectedEntry.vgaDacIndex}  ; Color #${selectedEntry.vgaDacIndex}
OUT DX, AL
INC DX        ; DX = 03C9h (Data)
MOV AL, ${selectedEntry.vgaRed}  ; Red 0..63
OUT DX, AL
MOV AL, ${selectedEntry.vgaGreen}  ; Green 0..63
OUT DX, AL
MOV AL, ${selectedEntry.vgaBlue}  ; Blue 0..63
OUT DX, AL`}
              </pre>
            </div>
          </div>
        </div>

        {/* Quantization & Conversion Fidelity Note */}
        <div className="p-3 bg-[#0e121c] border border-[#1b2234] rounded-lg text-xs font-mono text-slate-400 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-slate-200">Quantization Fidelity:</strong> The Game Boy Color 5-bit RGB color depth ($2^5 = 32$ levels)
            scales into the MS-DOS VGA 6-bit DAC ($2^6 = 64$ levels) via the equation <code className="text-cyan-300">VGA = round((GBC / 31) * 63)</code>.
            Because the VGA DAC provides twice the bit precision of the GBC LCD, all 32,768 possible GBC colors are reproduced without downsampling distortion.
          </div>
        </div>
      </div>
    </div>
  );
};
