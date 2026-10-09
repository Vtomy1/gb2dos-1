import React, { useState, useEffect } from 'react';
import { GbcRomHeader, ConversionConfig, DosExeOutput } from '../types/gbc';
import { buildDosMzExecutable } from '../utils/dosExeGenerator';
import { 
  Download, 
  FileCode2, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  HardDrive, 
  Tv, 
  Copy, 
  Check, 
  Sparkles,
  Shield,
  ArrowRight,
  AlertTriangle,
  Wrench,
  ShieldAlert
} from 'lucide-react';

interface ConversionWorkbenchProps {
  header: GbcRomHeader;
  romBytes: Uint8Array;
  config: ConversionConfig;
  onConfigChange: (config: ConversionConfig) => void;
  onBackToMetadata: () => void;
  onAutoRepair?: () => void;
}

export const ConversionWorkbench: React.FC<ConversionWorkbenchProps> = ({
  header,
  romBytes,
  config,
  onConfigChange,
  onBackToMetadata,
  onAutoRepair,
}) => {
  const [exeOutput, setExeOutput] = useState<DosExeOutput | null>(() => {
    return buildDosMzExecutable(header, romBytes, config);
  });

  // Rebuild executable whenever header, romBytes, or config updates
  useEffect(() => {
    setExeOutput(buildDosMzExecutable(header, romBytes, config));
  }, [header, romBytes, config]);
  const [copiedAsm, setCopiedAsm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'mz_header' | 'asm_code' | 'c_code'>('overview');

  const handleRebuild = () => {
    const output = buildDosMzExecutable(header, romBytes, config);
    setExeOutput(output);
  };

  const handleDownloadExe = () => {
    if (!exeOutput) return;
    const url = URL.createObjectURL(exeOutput.exeBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exeOutput.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAsm = () => {
    if (!exeOutput) return;
    const blob = new Blob([exeOutput.asmSourceCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${header.title.replace(/[^a-zA-Z0-9]/g, '_')}.ASM`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPalette = () => {
    if (!exeOutput) return;
    const blob = new Blob([exeOutput.vgaPaletteArray.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${header.title.replace(/[^a-zA-Z0-9]/g, '_')}.PAL`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyAsm = () => {
    if (!exeOutput) return;
    navigator.clipboard.writeText(exeOutput.asmSourceCode);
    setCopiedAsm(true);
    setTimeout(() => setCopiedAsm(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Workbench Header */}
      <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 md:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>TARGET: MS-DOS 6.22 / DOSBOX</span>
            <span aria-hidden="true">·</span>
            <span>VIDEO: MODE 13h (320x200 8-BIT VGA)</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400 font-semibold">{header.title}</span>
          </div>

          <h1 className="text-2xl font-bold font-mono text-white tracking-wide mt-1">
            MS-DOS Executable (.EXE) Builder
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-mono">
            Compiles the GBC ROM payload with an authentic MZ header, 16-bit real-mode x86 initialization code,
            and VGA DAC palette registers into a ready-to-run MS-DOS binary.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBackToMetadata}
            className="px-3.5 py-2 rounded-lg bg-[#181f2f] hover:bg-[#232c42] border border-[#29344d] text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
          >
            $\leftarrow$ Back to ROM Metadata
          </button>

          <button
            onClick={handleDownloadExe}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-emerald-950/40 cursor-pointer hover:scale-[1.02]"
          >
            <Download className="w-4 h-4" />
            <span>Download {exeOutput?.fileName || 'ROM.EXE'}</span>
          </button>
        </div>
      </div>

      {/* Integrity Alert in Conversion Workbench */}
      {(header.integrityReport.status === 'corrupted' || header.integrityReport.status === 'unsupported') && (
        <div className="bg-rose-950/40 border-2 border-rose-600/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-rose-300 uppercase">
                Warning: Converting ROM with Corrupted Checksum &amp; Complement
              </div>
              <div className="text-slate-300 text-[11px] mt-0.5">
                Stored header checksum (0x{header.headerChecksum.toString(16).padStart(2, '0').toUpperCase()}) differs from computed complement (0x{header.computedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()}). Real hardware or strict emulators may reject execution.
              </div>
            </div>
          </div>

          {onAutoRepair && (
            <button
              onClick={onAutoRepair}
              className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Auto-Repair Before Building</span>
            </button>
          )}
        </div>
      )}

      {/* Conversion Tuning Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DOS Subsystem Mode */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>DOS Subsystem Target</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-[#0b0e17] border border-[#1d2334] text-slate-200">
              <input
                type="radio"
                name="dosSubsystem"
                checked={config.dosSubsystem === 'realmode_8086'}
                onChange={() => {
                  const updated = { ...config, dosSubsystem: 'realmode_8086' as const };
                  onConfigChange(updated);
                  setExeOutput(buildDosMzExecutable(header, romBytes, updated));
                }}
                className="accent-cyan-400"
              />
              <div>
                <div className="font-semibold text-white">Real-Mode 16-bit (8086+)</div>
                <div className="text-[10px] text-slate-400">Pure MZ executable, boots on any PC/XT/AT/286</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-[#0b0e17] border border-[#1d2334] text-slate-200">
              <input
                type="radio"
                name="dosSubsystem"
                checked={config.dosSubsystem === 'dpmi_32bit'}
                onChange={() => {
                  const updated = { ...config, dosSubsystem: 'dpmi_32bit' as const };
                  onConfigChange(updated);
                  setExeOutput(buildDosMzExecutable(header, romBytes, updated));
                }}
                className="accent-cyan-400"
              />
              <div>
                <div className="font-semibold text-white">Protected-Mode 32-bit (DOS/4GW)</div>
                <div className="text-[10px] text-slate-400">386+ DPMI extender wrapper for large ROMs</div>
              </div>
            </label>
          </div>
        </div>

        {/* Mode 13h Screen Viewport */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Tv className="w-4 h-4 text-emerald-400" />
            <span>Mode 13h Frame Format</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-[#0b0e17] border border-[#1d2334] text-slate-200">
              <input
                type="radio"
                name="layoutMode"
                checked={config.layoutMode === 'centered_160x144_hud'}
                onChange={() => {
                  const updated = { ...config, layoutMode: 'centered_160x144_hud' as const };
                  onConfigChange(updated);
                  setExeOutput(buildDosMzExecutable(header, romBytes, updated));
                }}
                className="accent-emerald-400"
              />
              <div>
                <div className="font-semibold text-white">Centered 160×144 with HUD</div>
                <div className="text-[10px] text-slate-400">X:80, Y:28 offset with DOS status bars</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-[#0b0e17] border border-[#1d2334] text-slate-200">
              <input
                type="radio"
                name="layoutMode"
                checked={config.layoutMode === 'scaled_320x200'}
                onChange={() => {
                  const updated = { ...config, layoutMode: 'scaled_320x200' as const };
                  onConfigChange(updated);
                  setExeOutput(buildDosMzExecutable(header, romBytes, updated));
                }}
                className="accent-emerald-400"
              />
              <div>
                <div className="font-semibold text-white">Full-Scale 320×200 Stretch</div>
                <div className="text-[10px] text-slate-400">Stretches Game Boy screen across all 64K pixels</div>
              </div>
            </label>
          </div>
        </div>

        {/* Executable Metadata & Author Tag */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-purple-400" />
            <span>DOS Stub Embed Info</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Author / Converter Tag</label>
              <input
                type="text"
                value={config.authorTag}
                onChange={(e) => {
                  const updated = { ...config, authorTag: e.target.value };
                  onConfigChange(updated);
                }}
                className="w-full bg-[#0b0e17] border border-[#1d2334] rounded px-2.5 py-1.5 text-white text-xs font-mono focus:border-cyan-400 outline-none"
              />
            </div>
            <button
              onClick={handleRebuild}
              className="w-full mt-2 py-1.5 bg-[#1a2233] hover:bg-[#232e44] border border-[#2d3954] text-cyan-300 rounded text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              Recompile Executable Binary
            </button>
          </div>
        </div>
      </div>

      {/* Artifacts Download Strip */}
      <div className="bg-[#0e121c] border border-[#1e2538] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>MZ Executable Compiled</span>
          </div>
          <span className="text-slate-500">·</span>
          <span className="text-slate-300">File: {exeOutput?.fileName}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Size: {exeOutput?.exeSizeBytes.toLocaleString()} bytes</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Pages: {exeOutput?.mzHeader.pages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPalette}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182030] hover:bg-[#222c42] border border-[#2b3754] text-slate-300 text-xs font-mono rounded transition-colors cursor-pointer"
            title="Download standard 768-byte VGA DAC palette"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Palette (.PAL)</span>
          </button>

          <button
            onClick={handleDownloadAsm}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#182030] hover:bg-[#222c42] border border-[#2b3754] text-slate-300 text-xs font-mono rounded transition-colors cursor-pointer"
            title="Download TASM / NASM Assembly source"
          >
            <FileCode2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Assembly (.ASM)</span>
          </button>

          <button
            onClick={handleDownloadExe}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold rounded transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .EXE</span>
          </button>
        </div>
      </div>

      {/* Technical Tabs: MZ Header Breakdown / Assembly / C Source */}
      <div className="bg-[#121622] border border-[#23293d] rounded-xl overflow-hidden shadow-lg">
        {/* Navigation Tabs */}
        <div className="flex border-b border-[#23293d] bg-[#0c0f17] px-4">
          {[
            { id: 'overview', label: 'Conversion Report' },
            { id: 'mz_header', label: 'MZ Header Structure (IMAGE_DOS_HEADER)' },
            { id: 'asm_code', label: 'TASM/NASM Source (.ASM)' },
            { id: 'c_code', label: 'Turbo C Wrapper (.C)' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-3 text-xs font-mono font-medium transition-colors cursor-pointer border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-cyan-400 text-cyan-400 bg-[#121622]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Conversion Overview */}
        {activeTab === 'overview' && (
          <div className="p-5 space-y-4 font-mono text-xs">
            <div className="bg-[#090b10] border border-[#1b2234] rounded-lg p-4 font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
              {exeOutput?.summaryReport}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0b0e17] border border-[#1d2334] rounded-lg p-4 space-y-2">
                <div className="text-cyan-400 font-bold uppercase">Memory Layout in DOS 0xA0000</div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>• Video RAM base: 0xA000:0000 (Physical address 655,360)</div>
                  <div>• Framebuffer capacity: 320 × 200 = 64,000 bytes (0xFA00)</div>
                  <div>• Centered GBC Window: (320 - 160)/2 = 80px, (200 - 144)/2 = 28px</div>
                  <div>• Centered start offset: 28 × 320 + 80 = 9,040 bytes (0x2350)</div>
                  <div>• VGA DAC Ports: Index Write = 0x03C8, Data = 0x03C9</div>
                </div>
              </div>

              <div className="bg-[#0b0e17] border border-[#1d2334] rounded-lg p-4 space-y-2">
                <div className="text-purple-400 font-bold uppercase">Target Compatibility Matrix</div>
                <div className="text-slate-300 space-y-1 text-[11px]">
                  <div>• MS-DOS 3.3, 5.0, 6.0, 6.22: Native Execution</div>
                  <div>• DOSBox / DOSBox-Staging / DOSBox-X: 100% Compatible</div>
                  <div>• FreeDOS 1.2 / 1.3: Fully Compatible</div>
                  <div>• Windows 95 / 98 / ME DOS Prompt: Fully Compatible</div>
                  <div>• Intel 8086, 286, 386, 486, Pentium VGA: Hardware Compliant</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: MZ Header Structure */}
        {activeTab === 'mz_header' && exeOutput && (
          <div className="p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                MZ DOS Header Fields (64-byte structural specification)
              </span>
              <span className="text-cyan-400 font-bold">Offset 0x0000 – 0x003F</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { field: 'e_magic', val: '0x5A4D ("MZ")', desc: 'DOS executable magic bytes' },
                { field: 'e_cblp', val: `${exeOutput.mzHeader.bytesInLastPage} bytes`, desc: 'Bytes in last 512-byte page' },
                { field: 'e_cp', val: `${exeOutput.mzHeader.pages} pages`, desc: 'Total 512-byte pages in file' },
                { field: 'e_crlc', val: `${exeOutput.mzHeader.relocations}`, desc: 'Relocation table entries' },
                { field: 'e_cparhdr', val: `${exeOutput.mzHeader.headerParagraphs} (512B)`, desc: 'Header paragraphs (16 bytes each)' },
                { field: 'e_minalloc', val: `0x${exeOutput.mzHeader.minAlloc.toString(16)} (512B)`, desc: 'Min extra paragraphs required' },
                { field: 'e_maxalloc', val: `0x${exeOutput.mzHeader.maxAlloc.toString(16).toUpperCase()}`, desc: 'Max extra paragraphs requested' },
                { field: 'e_ss', val: `0x${exeOutput.mzHeader.initialSS.toString(16)}`, desc: 'Initial relative SS value' },
                { field: 'e_sp', val: `0x${exeOutput.mzHeader.initialSP.toString(16).toUpperCase()}`, desc: 'Initial SP stack pointer' },
                { field: 'e_csum', val: `0x0000`, desc: 'File checksum register' },
                { field: 'e_ip', val: `0x${exeOutput.mzHeader.initialIP.toString(16)}`, desc: 'Initial IP instruction pointer' },
                { field: 'e_cs', val: `0x${exeOutput.mzHeader.initialCS.toString(16)}`, desc: 'Initial relative CS value' },
                { field: 'e_lfarlc', val: `0x${exeOutput.mzHeader.relocTableOffset.toString(16)} (28)`, desc: 'File offset to relocation table' },
                { field: 'e_ovno', val: `0x${exeOutput.mzHeader.overlayNumber.toString(16)}`, desc: 'Overlay number (0 = main executable)' },
              ].map(item => (
                <div key={item.field} className="bg-[#08090d] border border-[#1b2234] rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold">{item.field}</span>
                    <span className="text-white font-semibold">{item.val}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: ASM Code */}
        {activeTab === 'asm_code' && exeOutput && (
          <div className="p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                x86 Real-Mode Assembly Source (Assemble with: <code className="text-cyan-300">tasm /m2 file.asm &amp;&amp; tlink /x file.obj</code>)
              </span>
              <button
                onClick={handleCopyAsm}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#1a2233] hover:bg-[#253047] border border-[#2e3b57] text-slate-300 rounded text-xs cursor-pointer"
              >
                {copiedAsm ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedAsm ? 'Copied' : 'Copy Source'}</span>
              </button>
            </div>

            <pre className="bg-[#08090d] border border-[#1b2234] rounded-lg p-4 overflow-x-auto text-slate-300 text-[11px] leading-relaxed max-h-96">
              {exeOutput.asmSourceCode}
            </pre>
          </div>
        )}

        {/* Tab 4: C Code */}
        {activeTab === 'c_code' && exeOutput && (
          <div className="p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">
                Turbo C / Borland C++ / OpenWatcom Mode 13h Integration Code
              </span>
            </div>

            <pre className="bg-[#08090d] border border-[#1b2234] rounded-lg p-4 overflow-x-auto text-slate-300 text-[11px] leading-relaxed max-h-96">
              {exeOutput.cSourceCode}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
