import React, { useState } from 'react';
import { GbcRomHeader, IntegrityIssue } from '../types/gbc';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Wrench, 
  ShieldCheck, 
  Info, 
  Cpu, 
  HardDrive, 
  ArrowRight,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Terminal,
  Lock
} from 'lucide-react';

interface RomIntegrityCheckerProps {
  header: GbcRomHeader;
  onAutoRepair?: () => void;
  onCorruptForTest?: () => void;
}

export const RomIntegrityChecker: React.FC<RomIntegrityCheckerProps> = ({
  header,
  onAutoRepair,
  onCorruptForTest,
}) => {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);
  const report = header.integrityReport;

  // Determine top alert styling
  const isCorrupted = report.status === 'corrupted';
  const isUnsupported = report.status === 'unsupported';
  const isWarning = report.status === 'warning';
  const isHealthy = report.status === 'healthy';

  const alertBorderColor = isCorrupted
    ? 'border-rose-600/80 bg-rose-950/30'
    : isUnsupported
    ? 'border-amber-600/80 bg-amber-950/30'
    : isWarning
    ? 'border-yellow-600/70 bg-yellow-950/20'
    : 'border-emerald-600/70 bg-emerald-950/20';

  const statusTextColor = isCorrupted
    ? 'text-rose-400'
    : isUnsupported
    ? 'text-amber-400'
    : isWarning
    ? 'text-yellow-400'
    : 'text-emerald-400';

  return (
    <div className="space-y-5">
      {/* 1. Main ROM Integrity Alert Banner */}
      <div className={`border-2 rounded-xl p-5 md:p-6 shadow-xl transition-all ${alertBorderColor}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${
              isCorrupted
                ? 'bg-rose-900/60 text-rose-300'
                : isUnsupported
                ? 'bg-amber-900/60 text-amber-300'
                : isWarning
                ? 'bg-yellow-900/60 text-yellow-300'
                : 'bg-emerald-900/60 text-emerald-300'
            }`}>
              {isCorrupted ? (
                <ShieldAlert className="w-7 h-7" />
              ) : isUnsupported ? (
                <AlertTriangle className="w-7 h-7" />
              ) : isWarning ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <ShieldCheck className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-base md:text-lg font-bold font-mono uppercase tracking-wide ${statusTextColor}`}>
                  {isCorrupted && 'Critical Error: Corrupted GBC ROM Detected'}
                  {isUnsupported && 'Unsupported Cartridge Specification'}
                  {isWarning && 'ROM Header Integrity Warning'}
                  {isHealthy && 'ROM Header Integrity Verified (100% Healthy)'}
                </span>

                <span className="text-xs text-slate-400 font-mono">
                  · Health Score: <span className={`font-bold ${statusTextColor}`}>{report.healthScore}%</span>
                </span>
              </div>

              <p className="text-xs md:text-sm text-slate-300 max-w-3xl leading-relaxed">
                {report.summary}
              </p>

              {/* Quick issue count indicator */}
              {report.issues.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
                  <span className="text-rose-400 font-semibold">
                    {report.issues.filter(i => i.severity === 'critical').length} Critical Faults
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-yellow-400 font-semibold">
                    {report.issues.filter(i => i.severity === 'warning').length} Warnings
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400">
                    {report.issues.filter(i => i.severity === 'info').length} Informational
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {report.issues.some(i => i.canAutoFix) && onAutoRepair && (
              <button
                onClick={onAutoRepair}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-emerald-950/50 cursor-pointer hover:scale-[1.02]"
                title="Recalculates 0x014D Checksum/Complement, fixes Global checksum, and restores valid Nintendo Logo"
              >
                <Wrench className="w-4 h-4" />
                <span>Auto-Repair ROM Checksums</span>
              </button>
            )}

            {onCorruptForTest && (
              <button
                onClick={onCorruptForTest}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a2233] hover:bg-[#253047] border border-[#2c3954] text-slate-300 hover:text-white text-xs font-mono transition-colors cursor-pointer"
                title="Invert checksum byte at 0x014D to test detection"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inject Test Corruption</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Detailed Technical Check Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Check 1: Header Checksum & Complement Byte (0x014D) */}
        <div className={`bg-[#121622] border rounded-xl p-4.5 space-y-3 ${
          report.headerChecksumDetails.isValid ? 'border-[#23293d]' : 'border-rose-800/80 bg-rose-950/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Header Checksum &amp; Complement</span>
            </div>
            {report.headerChecksumDetails.isValid ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VALID
              </span>
            ) : (
              <span className="text-rose-400 text-xs font-mono font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                CORRUPTED
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Stored Byte (0x014D):</span>
              <span className={`font-bold ${report.headerChecksumDetails.isValid ? 'text-white' : 'text-rose-400'}`}>
                0x{report.headerChecksumDetails.stored.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Expected Complement:</span>
              <span className="text-emerald-400 font-bold">
                0x{report.headerChecksumDetails.computed.toString(16).padStart(2, '0').toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-[#1a1f2e]">
              <span className="text-slate-500">Complement Sum:</span>
              <span className={`font-bold ${report.headerChecksumDetails.isComplementValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                0x{report.headerChecksumDetails.complementSum.toString(16).padStart(2, '0').toUpperCase()}
                {' '}({report.headerChecksumDetails.isComplementValid ? 'Expected 0x00: PASS' : 'FAIL'})
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              {report.headerChecksumDetails.isValid
                ? 'Hardware boot ROM will successfully verify this byte and branch to cart entry.'
                : 'CRITICAL: Real Game Boy Boot ROM locks in an infinite spinloop upon seeing this mismatch.'}
            </p>
          </div>
        </div>

        {/* Check 2: 16-Bit Global Checksum (0x014E - 0x014F) */}
        <div className={`bg-[#121622] border rounded-xl p-4.5 space-y-3 ${
          report.globalChecksumDetails.isValid ? 'border-[#23293d]' : 'border-yellow-800/80 bg-yellow-950/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>16-Bit Global Checksum</span>
            </div>
            {report.globalChecksumDetails.isValid ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VERIFIED
              </span>
            ) : (
              <span className="text-yellow-400 text-xs font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                MISMATCH
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Stored Word (0x014E-4F):</span>
              <span className={`font-bold ${report.globalChecksumDetails.isValid ? 'text-white' : 'text-yellow-300'}`}>
                0x{report.globalChecksumDetails.stored.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Whole Cartridge Sum:</span>
              <span className="text-emerald-400 font-bold">
                0x{report.globalChecksumDetails.computed.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-[#1a1f2e]">
              <span className="text-slate-500">Checksum Difference:</span>
              <span className="text-slate-300">
                {report.globalChecksumDetails.difference === 0 ? '0 (Exact)' : `${report.globalChecksumDetails.difference} bytes`}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Sum of all bytes in the cartridge except bytes 0x014E & 0x014F. Used by GoodGB & No-Intro dat archives.
            </p>
          </div>
        </div>

        {/* Check 3: Nintendo Boot Logo Graphic (0x0104 - 0x0133) */}
        <div className={`bg-[#121622] border rounded-xl p-4.5 space-y-3 ${
          report.logoDetails.isValid ? 'border-[#23293d]' : 'border-rose-800/80 bg-rose-950/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Boot Logo Check (48 Bytes)</span>
            </div>
            {report.logoDetails.isValid ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                AUTHENTIC
              </span>
            ) : (
              <span className="text-rose-400 text-xs font-mono font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                CORRUPTED
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Mismatched Bytes:</span>
              <span className={`font-bold ${report.logoDetails.isValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                {report.logoDetails.mismatchedBytes} / 48 bytes
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Hardware Lockout Risk:</span>
              <span className={`font-bold ${report.logoDetails.hardwareLockoutRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                {report.logoDetails.hardwareLockoutRisk ? 'ACTIVE (Will Lock Console)' : 'None (Boots Normally)'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300 pt-1 border-t border-[#1a1f2e]">
              <span className="text-slate-500">Boot ROM Mask Match:</span>
              <span className="text-slate-300">
                {report.logoDetails.isValid ? '100% Bit-Identical' : 'Logo Altered/Damaged'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              {report.logoDetails.isValid
                ? 'Authentic 48-byte graphical tile bitmap matches the Nintendo console boot ROM.'
                : 'Console boot ROM checks this bitmap before executing any game code.'}
            </p>
          </div>
        </div>

        {/* Check 4: Entry Point Vector (0x0100 - 0x0103) */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Entry Point Vector (0x0100)</span>
            </div>
            {report.entryPointDetails.isValid ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                VALID
              </span>
            ) : (
              <span className="text-yellow-400 text-xs font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                NON-STANDARD
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Opcodes Decoded:</span>
              <span className="font-bold text-white">
                {report.entryPointDetails.opcodeMnemonic}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Jump Target Address:</span>
              <span className="text-amber-300 font-bold">
                ${report.entryPointDetails.jumpTarget.toString(16).padStart(4, '0').toUpperCase()}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1a1f2e] leading-relaxed">
              CPU jumps to this address right after bootrom validation. Standard is $0150.
            </p>
          </div>
        </div>

        {/* Check 5: File Truncation & ROM Size */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>File Size &amp; Bank Geometry</span>
            </div>
            {!report.fileSizeDetails.isTruncated ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                COMPLETE
              </span>
            ) : (
              <span className="text-rose-400 text-xs font-mono font-bold flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                TRUNCATED
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Declared Capacity:</span>
              <span className="text-white font-bold">
                {report.fileSizeDetails.declaredBytes.toLocaleString()} bytes
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Actual File on Disk:</span>
              <span className={report.fileSizeDetails.isTruncated ? 'text-rose-400 font-bold' : 'text-white font-bold'}>
                {report.fileSizeDetails.actualBytes.toLocaleString()} bytes
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1a1f2e] leading-relaxed">
              {report.fileSizeDetails.statusText}
            </p>
          </div>
        </div>

        {/* Check 6: Hardware Controller & Emulation Support */}
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-4.5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Hardware &amp; DOS Feasibility</span>
            </div>
            {report.hardwareSupportDetails.isSupportedByDosMode13h ? (
              <span className="text-emerald-400 text-xs font-mono font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SUPPORTED
              </span>
            ) : (
              <span className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                UNSUPPORTED
              </span>
            )}
          </div>

          <div className="bg-[#0b0e17] border border-[#1b2234] rounded-lg p-3 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">GBC Hardware Boot:</span>
              <span className={report.hardwareSupportDetails.isSupportedByGbc ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {report.hardwareSupportDetails.isSupportedByGbc ? 'Passes Boot ROM' : 'Boot ROM Rejection'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-500">Mode 13h Wrapper:</span>
              <span className={report.hardwareSupportDetails.isSupportedByDosMode13h ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                {report.hardwareSupportDetails.isSupportedByDosMode13h ? 'Ready for Conversion' : 'Incompatible MBC'}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 pt-1 border-t border-[#1a1f2e] leading-relaxed">
              {header.cartridgeTypeDescription} controller compatible with DOS VGA Mode 13h memory map.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Detailed Integrity Issue Inspector (if any detected) */}
      {report.issues.length > 0 && (
        <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white font-mono tracking-wide uppercase">
                Detected Integrity Diagnostics ({report.issues.length})
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Ranked by hardware execution severity
            </span>
          </div>

          <div className="space-y-2.5">
            {report.issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3.5 rounded-lg border font-mono text-xs space-y-1.5 ${
                  issue.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : issue.severity === 'warning'
                    ? 'bg-yellow-950/20 border-yellow-800/60'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      issue.severity === 'critical'
                        ? 'bg-rose-900/80 text-rose-200'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-900/80 text-yellow-200'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {issue.severity}
                    </span>
                    <span className="text-white">{issue.title}</span>
                    <span className="text-slate-500">[{issue.offsetHex}]</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Stored: <span className="text-rose-300 font-bold">{issue.storedHex}</span>
                    {' '}· Expected: <span className="text-emerald-300 font-bold">{issue.expectedHex}</span>
                  </div>
                </div>

                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {issue.description}
                </p>

                <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span><strong className="text-slate-300">Technical:</strong> {issue.technicalDetail}</span>
                  <span><strong className="text-slate-300">Impact:</strong> {issue.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Mathematical Formula Explainer */}
      <div className="bg-[#0b0e17] border border-[#1b2234] rounded-xl p-4 text-xs font-mono space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>How the Game Boy Header Checksum and Complement Math Works</span>
          </button>
          <span className="text-[10px] text-slate-500">Pan Docs &amp; RGBDS Specification</span>
        </div>

        {showFormulaDetails && (
          <div className="pt-2 text-slate-300 space-y-2 text-[11px] border-t border-[#1a1f2e] leading-relaxed">
            <p>
              The Game Boy boot ROM validates the cartridge header by running an 8-bit complement loop across the 25 bytes from <code className="text-cyan-300">0x0134</code> (Title) through <code className="text-cyan-300">0x014C</code> (Mask ROM Version):
            </p>
            <pre className="bg-[#05070a] p-2.5 rounded border border-slate-800 text-cyan-300 text-[10px]">
{`uint8_t x = 0;
for (int i = 0x0134; i <= 0x014C; i++) {
    x = (x - rom[i] - 1);
}
// Stored in cartridge at offset 0x014D`}
            </pre>
            <p>
              In assembly, the boot ROM verifies this using an 8-bit complement sum:
              <br />
              <code className="text-emerald-400 font-bold">(sum(0x0134..0x014C) + [0x014D] + 25) mod 256 == 0</code>
            </p>
            <p className="text-slate-400">
              If the complement sum is non-zero, the CPU executes an infinite halt loop and never jumps to the user game. Our Auto-Repair engine recalculates this byte and rewrites byte <code className="text-cyan-300">0x014D</code> so the ROM boots cleanly on all hardware and emulators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
