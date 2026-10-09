import React, { useState, useTransition, useRef } from 'react';
import { GbcRomHeader, ConversionConfig, SampleRomDescriptor } from './types/gbc';
import { parseGbcRomHeader, autoRepairRomHeader, createCorruptedTestRom } from './utils/gbcHeaderParser';
import { SAMPLE_GBC_ROMS } from './utils/sampleRoms';
import { GbcRomMetadataDisplay } from './components/GbcRomMetadataDisplay';
import { Mode13hCanvas } from './components/Mode13hCanvas';
import { ConversionWorkbench } from './components/ConversionWorkbench';
import { RomHexViewer } from './components/RomHexViewer';
import { 
  Upload, 
  Terminal, 
  Tv, 
  FileCode2, 
  Binary, 
  Sparkles, 
  Gamepad2, 
  AlertCircle,
  HelpCircle,
  Disc,
  FolderOpen,
  ShieldAlert,
  Wrench,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [selectedRomIndex, setSelectedRomIndex] = useState<number>(0);
  const [romBytes, setRomBytes] = useState<Uint8Array>(SAMPLE_GBC_ROMS[0].romData);
  const [header, setHeader] = useState<GbcRomHeader>(() =>
    parseGbcRomHeader(SAMPLE_GBC_ROMS[0].romData, `${SAMPLE_GBC_ROMS[0].name}.GBC`)
  );
  const [activeTab, setActiveTab] = useState<'metadata' | 'mode13h' | 'conversion' | 'hex'>('metadata');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [repairSuccessMsg, setRepairSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Conversion options
  const [config, setConfig] = useState<ConversionConfig>({
    targetVideoMode: 'mode13h_320x200',
    layoutMode: 'centered_160x144_hud',
    dosSubsystem: 'realmode_8086',
    vgaPaletteStrategy: 'dynamic_gbc_rgb555',
    authorTag: 'GBC-to-DOS Mode 13h Studio',
    dosBannerNotice: 'MS-DOS 320x200 Mode 13h GBC Runtime',
    includeDiagnosticHUD: true,
    enableScanlineEmulation: true,
    enableSoundBlasterStub: true,
  });

  // Handle ROM file upload (.gb / .gbc)
  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setRepairSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) return;
        const bytes = new Uint8Array(buffer);
        const parsedHeader = parseGbcRomHeader(bytes, file.name);

        startTransition(() => {
          setRomBytes(bytes);
          setHeader(parsedHeader);
          setSelectedRomIndex(-1); // Custom ROM loaded
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse Game Boy ROM header';
        setErrorMsg(message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleSelectSampleRom = (idx: number) => {
    setErrorMsg(null);
    setRepairSuccessMsg(null);
    const sample = SAMPLE_GBC_ROMS[idx];
    startTransition(() => {
      setSelectedRomIndex(idx);
      setRomBytes(sample.romData);
      setHeader(parseGbcRomHeader(sample.romData, `${sample.name}.GBC`));
    });
  };

  // Auto-repair corrupted ROM header checksum & complement
  const handleAutoRepair = () => {
    try {
      const repairedBytes = autoRepairRomHeader(romBytes);
      const repairedHeader = parseGbcRomHeader(repairedBytes, header.fileName);
      startTransition(() => {
        setRomBytes(repairedBytes);
        setHeader(repairedHeader);
        setRepairSuccessMsg(
          `Header checksum patched to 0x${repairedHeader.headerChecksum.toString(16).toUpperCase()} and complement verified (sum = 0x00). Nintendo Logo & global checksum restored!`
        );
        setTimeout(() => setRepairSuccessMsg(null), 6000);
      });
    } catch (err: unknown) {
      setErrorMsg('Failed to auto-repair ROM header');
    }
  };

  // Inject intentional checksum corruption for test/verification
  const handleCorruptForTest = () => {
    const corruptedBytes = createCorruptedTestRom(romBytes);
    const corruptedHeader = parseGbcRomHeader(corruptedBytes, header.fileName);
    startTransition(() => {
      setRomBytes(corruptedBytes);
      setHeader(corruptedHeader);
      setRepairSuccessMsg(null);
    });
  };

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] flex flex-col font-mono selection:bg-cyan-500/30 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-[#1b2234] bg-[#0d1017]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-wider text-white">GBC $\rightarrow$ MS-DOS</span>
                <span className="text-[11px] text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                  MODE 13h
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Game Boy Color ROM to 320x200 8-Bit MS-DOS Executable Converter
              </div>
            </div>
          </div>

          {/* Quick upload & ROM selector controls */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".gb,.gbc,.bin"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172031] hover:bg-[#202c42] border border-[#27344e] text-slate-200 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              title="Upload your own .gb or .gbc ROM file"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Load ROM (.GBC/.GB)</span>
            </button>
          </div>
        </div>

        {/* Primary View Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex border-t border-[#161d2d] bg-[#0a0d14]">
          {[
            { id: 'metadata', label: 'ROM Header Metadata', icon: Terminal },
            { id: 'mode13h', label: 'Virtual Mode 13h (320x200)', icon: Tv },
            { id: 'conversion', label: 'MS-DOS EXE Conversion', icon: FileCode2 },
            { id: 'hex', label: 'Binary Hex Inspector', icon: Binary },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold cursor-pointer border-b-2 transition-colors -mb-px ${
                  isActive
                    ? 'border-cyan-400 text-cyan-300 bg-[#121622]/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workbench Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full space-y-6">
        {/* Sample ROM Fast Selector Bar */}
        <div className="bg-[#10141e] border border-[#1e2538] rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Disc className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">Preset ROM Samples:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_GBC_ROMS.map((rom, idx) => {
              const isSelected = selectedRomIndex === idx;
              return (
                <button
                  key={rom.id}
                  onClick={() => handleSelectSampleRom(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-500 text-white font-bold shadow-sm'
                      : 'bg-[#151b29] hover:bg-[#1e263a] border-[#242e44] text-slate-400 hover:text-slate-200'
                  }`}
                  title={`${rom.subtitle} - ${rom.mbc}`}
                >
                  <span>{rom.name}</span>
                  <span className="ml-1 text-[10px] text-slate-500">({rom.cgbType})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error notification if corrupt ROM loaded */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => handleSelectSampleRom(0)}
              className="px-3 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-white text-[11px] cursor-pointer"
            >
              Reset to Valid Preset
            </button>
          </div>
        )}

        {/* Repair success notification */}
        {repairSuccessMsg && (
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/80 text-emerald-200 text-xs flex items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{repairSuccessMsg}</span>
            </div>
            <button
              onClick={() => setRepairSuccessMsg(null)}
              className="text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Tab Views */}
        {activeTab === 'metadata' && (
          <GbcRomMetadataDisplay
            header={header}
            onProceedToConversion={() => setActiveTab('conversion')}
            onLaunchVirtualDos={() => setActiveTab('mode13h')}
            onAutoRepair={handleAutoRepair}
            onCorruptForTest={handleCorruptForTest}
          />
        )}

        {activeTab === 'mode13h' && (
          <Mode13hCanvas
            header={header}
            romBytes={romBytes}
            config={config}
            onConfigChange={setConfig}
          />
        )}

        {activeTab === 'conversion' && (
          <ConversionWorkbench
            header={header}
            romBytes={romBytes}
            config={config}
            onConfigChange={setConfig}
            onBackToMetadata={() => setActiveTab('metadata')}
            onAutoRepair={handleAutoRepair}
          />
        )}

        {activeTab === 'hex' && (
          <RomHexViewer
            romBytes={romBytes}
            header={header}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1b2234] bg-[#0a0d14] py-4 text-xs font-mono text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Game Boy Color to MS-DOS Mode 13h Architecture Suite · IBM VGA 320×200 @ 256 Colors
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Pan Docs Header Compliant</span>
            <span aria-hidden="true">·</span>
            <span>MZ Executable Opcodes</span>
            <span aria-hidden="true">·</span>
            <span>VGA DAC Ports 0x03C8/9</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
