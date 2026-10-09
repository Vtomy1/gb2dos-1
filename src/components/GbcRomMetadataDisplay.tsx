import React, { useEffect, useRef, useState } from 'react';
import { GbcRomHeader } from '../types/gbc';
import { decodeNintendoLogoPixels } from '../utils/gbcHeaderParser';
import { RomIntegrityChecker } from './RomIntegrityChecker';
import { 
  CheckCircle2, 
  XCircle, 
  Cpu, 
  HardDrive, 
  Building2, 
  Globe, 
  ShieldCheck, 
  Terminal, 
  Sparkles,
  Layers,
  Zap,
  Info,
  HelpCircle,
  FileCode2,
  Tv,
  Lock,
  Wrench
} from 'lucide-react';

interface GbcRomMetadataDisplayProps {
  header: GbcRomHeader;
  onProceedToConversion?: () => void;
  onLaunchVirtualDos?: () => void;
  onAutoRepair?: () => void;
  onCorruptForTest?: () => void;
}

export const GbcRomMetadataDisplay: React.FC<GbcRomMetadataDisplayProps> = ({
  header,
  onProceedToConversion,
  onLaunchVirtualDos,
  onAutoRepair,
  onCorruptForTest,
}) => {
  const logoCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedHeaderByte, setSelectedHeaderByte] = useState<number | null>(null);

  // Render the 48-byte Nintendo boot logo on canvas
  useEffect(() => {
    if (!logoCanvasRef.current) return;
    const canvas = logoCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelGrid = decodeNintendoLogoPixels(header.nintendoLogoBitmap);
    ctx.fillStyle = '#08090d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scale = 3;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 48; c++) {
        if (pixelGrid[r][c]) {
          ctx.fillStyle = header.nintendoLogoValid ? '#38bdf8' : '#f87171';
          ctx.fillRect(c * scale, r * scale, scale - 0.5, scale - 0.5);
        }
      }
    }
  }, [header]);

  // Byte zone mapping for interactive header matrix
  const getByteZone = (offset: number) => {
    const abs = 0x0100 + offset;
    if (abs >= 0x0100 && abs <= 0x0103) return { name: 'Entry Point Vector', color: 'text-amber-400 bg-amber-950/40 border-amber-800/60', desc: 'Entry jump instruction (NOP; JP $0150)' };
    if (abs >= 0x0104 && abs <= 0x0133) return { name: 'Nintendo Boot Logo', color: 'text-sky-400 bg-sky-950/40 border-sky-800/60', desc: '48-byte graphical logo checked by boot ROM' };
    if (abs >= 0x0134 && abs <= 0x013e) return { name: 'Cartridge Title', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60', desc: 'Uppercase ASCII title string' };
    if (abs >= 0x013f && abs <= 0x0142) return { name: 'Manufacturer Code', color: 'text-purple-400 bg-purple-950/40 border-purple-800/60', desc: '4-character manufacturer ID on CGB' };
    if (abs === 0x0143) return { name: 'CGB Hardware Flag', color: 'text-pink-400 bg-pink-950/40 border-pink-800/60', desc: '0x80 (Dual CGB/DMG) or 0xC0 (CGB Only)' };
    if (abs >= 0x0144 && abs <= 0x0145) return { name: 'New Licensee Code', color: 'text-teal-400 bg-teal-950/40 border-teal-800/60', desc: '2-byte publisher identification code' };
    if (abs === 0x0146) return { name: 'Super Game Boy Flag', color: 'text-blue-400 bg-blue-950/40 border-blue-800/60', desc: '0x03 = SGB enhancements enabled' };
    if (abs === 0x0147) return { name: 'Cartridge / MBC Type', color: 'text-orange-400 bg-orange-950/40 border-orange-800/60', desc: 'Memory Bank Controller & auxiliary hardware' };
    if (abs === 0x0148) return { name: 'ROM Size Code', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/60', desc: 'Total ROM capacity and 16 KiB bank count' };
    if (abs === 0x0149) return { name: 'RAM Size Code', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/60', desc: 'External save RAM capacity' };
    if (abs === 0x014a) return { name: 'Destination Code', color: 'text-violet-400 bg-violet-950/40 border-violet-800/60', desc: '0x00 = Japan, 0x01 = Overseas' };
    if (abs === 0x014b) return { name: 'Old Licensee Code', color: 'text-slate-400 bg-slate-900 border-slate-700', desc: 'Legacy publisher indicator (0x33 -> New Licensee)' };
    if (abs === 0x014c) return { name: 'Mask ROM Version', color: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/60', desc: 'Cartridge release revision number' };
    if (abs === 0x014d) return { name: 'Header Checksum', color: 'text-rose-400 bg-rose-950/40 border-rose-800/60', desc: 'Pan Docs 8-bit checksum over 0x0134-0x014C' };
    if (abs >= 0x014e && abs <= 0x014f) return { name: 'Global Checksum', color: 'text-lime-400 bg-lime-950/40 border-lime-800/60', desc: '16-bit big-endian sum of entire cartridge' };
    return { name: 'Header Data', color: 'text-slate-400 bg-slate-900 border-slate-800', desc: 'Internal Cartridge Header' };
  };

  const selectedZone = selectedHeaderByte !== null ? getByteZone(selectedHeaderByte) : null;

  return (
    <div className="space-y-6">
      {/* 1. Primary Header Identification Banner */}
      <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tracking-wider">
              <span>INTERNAL GBC ROM HEADER</span>
              <span aria-hidden="true">·</span>
              <span>OFFSET 0x0100 - 0x014F</span>
              <span aria-hidden="true">·</span>
              <span className="text-cyan-400">{header.fileName}</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl md:text-3xl font-bold font-mono tracking-wide text-white">
                {header.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                <span className="text-slate-500">MFR:</span>
                <span className="text-purple-300 font-semibold">{header.manufacturerCode}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">REV:</span>
                <span className="text-yellow-300 font-semibold">{header.versionFormatted}</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-500">ENTRY:</span>
                <span className="text-amber-300">
                  {header.entryPoint.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase()).join(' ')}
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              {header.cgbDescription}. Managed by <span className="text-white font-medium">{header.cartridgeTypeDescription}</span> with{' '}
              <span className="text-white font-medium">{header.romSizeFormatted}</span> ROM and{' '}
              <span className="text-white font-medium">{header.ramSizeFormatted}</span> RAM.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {onLaunchVirtualDos && (
              <button
                onClick={onLaunchVirtualDos}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a2133] hover:bg-[#222c44] border border-[#2c3755] text-cyan-300 text-xs font-mono font-medium transition-colors cursor-pointer shadow-sm hover:shadow"
              >
                <Tv className="w-4 h-4 text-cyan-400" />
                <span>Simulate Mode 13h</span>
              </button>
            )}

            {onProceedToConversion && (
              <button
                onClick={onProceedToConversion}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all shadow-md cursor-pointer hover:scale-[1.02] ${
                  header.integrityReport.status === 'corrupted'
                    ? 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-950/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                }`}
              >
                <Zap className="w-4 h-4 text-white fill-white" />
                <span>Convert to MS-DOS EXE</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Detailed ROM Integrity & Checksum/Complement Verification Checker */}
      <RomIntegrityChecker
        header={header}
        onAutoRepair={onAutoRepair}
        onCorruptForTest={onCorruptForTest}
      />

      {/* 3. Structured Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Core Hardware & Compatibility */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Hardware Target</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-slate-500">CGB Flag (0x0143)</div>
              <div className="text-white font-medium">
                0x{header.cgbFlag.toString(16).padStart(2, '0').toUpperCase()}
                {' '}-{' '}
                <span className={header.isCgbOnly ? 'text-pink-400' : header.isCgbEnhanced ? 'text-emerald-400' : 'text-slate-300'}>
                  {header.isCgbOnly ? 'CGB Exclusive' : header.isCgbEnhanced ? 'Dual CGB / DMG' : 'Monochrome DMG'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-slate-500">Super Game Boy (0x0146)</div>
              <div className="text-slate-300">
                0x{header.sgbFlag.toString(16).padStart(2, '0').toUpperCase()}
                {' '}-{' '}
                <span className={header.sgbFlag === 0x03 ? 'text-sky-400' : 'text-slate-400'}>
                  {header.sgbFlag === 0x03 ? 'SGB Functions Supported' : 'Standard Game Boy'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-slate-500">Mode 13h Fit</div>
              <div className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>160x144 Centered in 320x200</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Memory & Controller Architecture */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-orange-400" />
            <span>Cartridge & Memory</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-slate-500">Memory Controller (0x0147)</div>
              <div className="text-orange-300 font-medium truncate" title={header.cartridgeTypeDescription}>
                {header.cartridgeTypeDescription}
              </div>
            </div>

            <div>
              <div className="text-slate-500">ROM Capacity (0x0148)</div>
              <div className="text-white font-medium">
                {header.romSizeFormatted}
                <span className="text-slate-500 text-[11px] ml-1">({header.romBanks} banks of 16 KiB)</span>
              </div>
            </div>

            <div>
              <div className="text-slate-500">RAM Capacity (0x0149)</div>
              <div className="text-white font-medium">
                {header.ramSizeFormatted}
                {header.ramBanks > 0 && (
                  <span className="text-slate-500 text-[11px] ml-1">({header.ramBanks} banks)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Publisher & Regional Distribution */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-teal-400" />
            <span>Publisher & Origin</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div>
              <div className="text-slate-500">New Licensee (0x0144)</div>
              <div className="text-teal-300 font-medium truncate" title={header.licenseeName}>
                "{header.newLicenseeCode}" - {header.licenseeName}
              </div>
            </div>

            <div>
              <div className="text-slate-500">Manufacturer (0x013F)</div>
              <div className="text-purple-300 font-medium">
                {header.manufacturerCode || 'Unassigned'}
              </div>
            </div>

            <div>
              <div className="text-slate-500">Destination (0x014A)</div>
              <div className="text-white">
                0x{header.destinationCode.toString(16).padStart(2, '0').toUpperCase()}
                {' '}-{' '}
                <span className="text-slate-300">{header.destinationDescription}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Hardware Auxiliary Features */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Auxiliary Features</span>
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between py-1 border-b border-[#1f2434]">
              <span className="text-slate-400">Battery Save:</span>
              <span className={header.hasBattery ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {header.hasBattery ? 'YES (NVRAM)' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#1f2434]">
              <span className="text-slate-400">Real-Time Clock:</span>
              <span className={header.hasRtc ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                {header.hasRtc ? 'YES (RTC)' : 'NO'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Rumble Motor:</span>
              <span className={header.hasRumble ? 'text-pink-400 font-semibold' : 'text-slate-500'}>
                {header.hasRumble ? 'YES' : 'NO'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Verification & Integrity Suite (Checksums + Nintendo Logo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Nintendo Logo Verification */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Nintendo Logo (0x0104-0x0133)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              {header.nintendoLogoValid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  AUTHENTIC
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  MISMATCH
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#08090d] border border-[#1d2334] rounded-lg p-3 flex flex-col items-center justify-center space-y-2">
            <canvas
              ref={logoCanvasRef}
              width={144}
              height={24}
              className="pixel-art rounded"
              title="Decoded 48-byte Nintendo graphic logo bitmap"
            />
            <div className="text-[10px] text-slate-500 font-mono text-center">
              48 bytes · Decoded 2-row 12-tile graphic matrix verified against boot ROM
            </div>
          </div>
        </div>

        {/* Header Checksum & Complement (0x014D) */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              <span>Checksum &amp; Complement (0x014D)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              {header.isHeaderChecksumValid && header.isHeaderComplementValid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  CORRUPTED
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0b0e17] border border-[#1d2334] rounded-lg p-3 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Stored Byte:</span>
              <span className={`font-bold ${header.isHeaderChecksumValid ? 'text-white' : 'text-rose-400'}`}>
                0x{header.headerChecksum.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Computed Complement:</span>
              <span className="text-emerald-400 font-bold">
                0x{header.computedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-[#1a1f2e]">
              <span className="text-slate-500">Complement Sum:</span>
              <span className={header.isHeaderComplementValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                0x{header.headerComplementSum.toString(16).padStart(2, '0').toUpperCase()} (0x00 required)
              </span>
            </div>
          </div>
        </div>

        {/* Global Checksum (0x014E-0x014F) */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-lime-400" />
              <span>Global Checksum (0x014E-4F)</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
              {header.isGlobalChecksumValid ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PASSED
                </span>
              ) : (
                <span className="text-rose-400 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  INVALID
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0b0e17] border border-[#1d2334] rounded-lg p-3 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Stored 16-bit:</span>
              <span className="text-white font-bold">
                0x{header.globalChecksum.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Calculated 16-bit:</span>
              <span className={header.isGlobalChecksumValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                0x{header.computedGlobalChecksum.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 pt-1 border-t border-[#1a1f2e]">
              Algorithm: 16-bit sum of all bytes in ROM (excluding checksum bytes)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Interactive Header Byte Matrix (0x0100 - 0x014F) */}
      <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Header Byte Matrix (Offset 0x0100 – 0x014F)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Hover or click any byte to inspect field assignment
          </span>
        </div>

        {/* Selected Byte Inspector Banner */}
        {selectedZone && selectedHeaderByte !== null ? (
          <div className={`p-3 rounded-lg border text-xs font-mono flex items-center justify-between ${selectedZone.color}`}>
            <div className="flex items-center gap-2">
              <span className="font-bold">
                Offset 0x{(0x0100 + selectedHeaderByte).toString(16).toUpperCase()}:
              </span>
              <span>{selectedZone.name}</span>
              <span aria-hidden="true">·</span>
              <span className="opacity-80">{selectedZone.desc}</span>
            </div>
            <span className="font-bold">
              Value: 0x{header.rawHeaderBytes[selectedHeaderByte].toString(16).padStart(2, '0').toUpperCase()} ({header.rawHeaderBytes[selectedHeaderByte]})
            </span>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg border border-dashed border-[#23293d] text-xs font-mono text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500 shrink-0" />
            <span>Interactive field inspector active. Select any hexadecimal byte below to inspect its purpose.</span>
          </div>
        )}

        {/* Hex Matrix Table */}
        <div className="overflow-x-auto bg-[#08090d] border border-[#1a1f2e] rounded-lg p-3">
          <div className="min-w-[620px] font-mono text-xs space-y-1">
            {Array.from({ length: 5 }).map((_, row) => {
              const rowBase = row * 16;
              const rowAddr = 0x0100 + rowBase;

              return (
                <div key={row} className="flex items-center gap-3 py-0.5 hover:bg-slate-900/50 px-1 rounded transition-colors">
                  {/* Address */}
                  <span className="text-slate-500 w-16 select-none font-bold">
                    0x{rowAddr.toString(16).padStart(4, '0').toUpperCase()}:
                  </span>

                  {/* 16 Hex Bytes */}
                  <div className="flex items-center gap-1.5 flex-1">
                    {Array.from({ length: 16 }).map((_, col) => {
                      const byteIdx = rowBase + col;
                      const byteVal = header.rawHeaderBytes[byteIdx];
                      const zone = getByteZone(byteIdx);
                      const isSelected = selectedHeaderByte === byteIdx;

                      return (
                        <button
                          key={col}
                          type="button"
                          onMouseEnter={() => setSelectedHeaderByte(byteIdx)}
                          onClick={() => setSelectedHeaderByte(byteIdx)}
                          className={`w-7 h-6 flex items-center justify-center rounded text-[11px] font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 bg-cyan-900/60 text-white z-10'
                              : 'hover:bg-slate-800 text-slate-300'
                          } ${
                            byteIdx >= 0x34 && byteIdx <= 0x3e
                              ? 'text-emerald-400'
                              : byteIdx >= 0x3f && byteIdx <= 0x42
                              ? 'text-purple-400'
                              : byteIdx === 0x43
                              ? 'text-pink-400'
                              : byteIdx === 0x4d
                              ? 'text-rose-400'
                              : byteIdx >= 0x4e
                              ? 'text-lime-400'
                              : ''
                          }`}
                          title={`Offset 0x${(0x0100 + byteIdx).toString(16).toUpperCase()}: ${zone.name}`}
                        >
                          {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                        </button>
                      );
                    })}
                  </div>

                  {/* ASCII Representation */}
                  <div className="flex items-center gap-0.5 text-slate-400 w-36 select-none border-l border-slate-800 pl-3">
                    {Array.from({ length: 16 }).map((_, col) => {
                      const byteVal = header.rawHeaderBytes[rowBase + col];
                      const char = byteVal >= 32 && byteVal <= 126 ? String.fromCharCode(byteVal) : '·';
                      return (
                        <span key={col} className={byteVal >= 32 && byteVal <= 126 ? 'text-slate-200' : 'text-slate-600'}>
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-slate-400 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500/80" />
            <span>0x0104-33: Logo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
            <span>0x0134-3E: Title</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/80" />
            <span>0x013F-42: Manufacturer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-pink-500/80" />
            <span>0x0143: CGB Flag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/80" />
            <span>0x0147: Cartridge Type</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500/80" />
            <span>0x014D: Header Checksum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-lime-500/80" />
            <span>0x014E-4F: Global Checksum</span>
          </div>
        </div>
      </div>

      {/* 5. Pre-Conversion Mode 13h Technical Feasibility Report */}
      <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              MS-DOS Mode 13h (320x200 8-Bit VGA) Conversion Feasibility
            </h3>
          </div>
          <span className="text-xs text-emerald-400 font-mono font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            CONVERSION READY
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
          <div className="bg-[#0b0e17] border border-[#1d2334] p-3 rounded-lg space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Resolution Transformation</span>
            </div>
            <div className="text-white">
              GBC 160×144 $\rightarrow$ VGA 320×200
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Centers 160×144 inside 320×200 with 80px left/right margins and 28px top/bottom margins. Perfectly accommodates DOS diagnostic HUD.
            </p>
          </div>

          <div className="bg-[#0b0e17] border border-[#1d2334] p-3 rounded-lg space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <span>VGA DAC Palette Mapping</span>
            </div>
            <div className="text-white">
              15-bit RGB $\rightarrow$ 6-bit DAC (0..63)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Standard 8 BG and 8 OBJ color palettes dynamically mapped to VGA DAC ports 0x03C8 and 0x03C9 with zero quantization artifacts.
            </p>
          </div>

          <div className="bg-[#0b0e17] border border-[#1d2334] p-3 rounded-lg space-y-1">
            <div className="text-slate-400 font-semibold flex items-center gap-1.5">
              <span>Executable MZ Header Layout</span>
            </div>
            <div className="text-white">
              Standard 16-bit MZ Stub (0x5A4D)
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Generates genuine MS-DOS MZ header with relocation table and real-mode x86 entry point for native DOS / DOSBox compatibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
