import React, { useState } from 'react';
import { GbcRomHeader } from '../types/gbc';
import { Binary, Search, ArrowRight, CornerDownRight } from 'lucide-react';

interface RomHexViewerProps {
  romBytes: Uint8Array;
  header: GbcRomHeader;
}

export const RomHexViewer: React.FC<RomHexViewerProps> = ({ romBytes, header }) => {
  const [offset, setOffset] = useState<number>(0x0100);
  const bytesPerRow = 16;
  const rowsToShow = 16;
  const maxOffset = Math.max(0, romBytes.length - bytesPerRow * rowsToShow);

  const jumpTo = (targetOffset: number) => {
    setOffset(Math.max(0, Math.min(maxOffset, targetOffset)));
  };

  const currentRows = Array.from({ length: rowsToShow }).map((_, r) => {
    const rowAddr = offset + r * bytesPerRow;
    return {
      addr: rowAddr,
      bytes: Array.from({ length: bytesPerRow }).map((_, c) => {
        const byteAddr = rowAddr + c;
        return byteAddr < romBytes.length ? romBytes[byteAddr] : null;
      }),
    };
  });

  return (
    <div className="bg-[#121622] border border-[#23293d] rounded-xl p-5 space-y-4">
      {/* Hex Viewer Title & Jumps */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Binary className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-mono tracking-wide uppercase">
            ROM Binary Hex Viewer &amp; Disassembler
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            ({romBytes.length.toLocaleString()} bytes total)
          </span>
        </div>

        {/* Quick jump navigation */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 mr-1">Quick Jump:</span>
          {[
            { label: '0x0000 (RST Vectors)', addr: 0x0000 },
            { label: '0x0100 (Header)', addr: 0x0100 },
            { label: '0x0104 (Logo)', addr: 0x0104 },
            { label: '0x0134 (Title/MFR)', addr: 0x0130 },
            { label: '0x014D (Checksum)', addr: 0x0140 },
            { label: '0x0800 (Tiles)', addr: 0x0800 },
          ].map(target => (
            <button
              key={target.addr}
              onClick={() => jumpTo(target.addr)}
              className="px-2 py-1 bg-[#182030] hover:bg-[#222c42] border border-[#27324c] text-cyan-300 rounded text-[11px] cursor-pointer transition-colors"
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hex display table */}
      <div className="overflow-x-auto bg-[#08090d] border border-[#1b2234] rounded-lg p-3 font-mono text-xs">
        <div className="min-w-[650px] space-y-1">
          {/* Header offset row */}
          <div className="flex items-center gap-3 text-slate-500 text-[11px] pb-1 border-b border-slate-900 select-none">
            <span className="w-20 font-bold">OFFSET</span>
            <div className="flex items-center gap-1.5 flex-1 font-semibold">
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-7 text-center">
                  {i.toString(16).toUpperCase()}
                </span>
              ))}
            </div>
            <span className="w-36 text-center">ASCII TEXT</span>
          </div>

          {/* Data rows */}
          {currentRows.map(row => (
            <div
              key={row.addr}
              className={`flex items-center gap-3 py-0.5 rounded px-1 transition-colors ${
                row.addr >= 0x0100 && row.addr < 0x0150 ? 'bg-cyan-950/20' : 'hover:bg-slate-900/50'
              }`}
            >
              <span className="text-slate-500 w-20 font-bold select-none">
                0x{row.addr.toString(16).padStart(6, '0').toUpperCase()}
              </span>

              <div className="flex items-center gap-1.5 flex-1">
                {row.bytes.map((b, idx) => {
                  const addr = row.addr + idx;
                  const isHeader = addr >= 0x0100 && addr <= 0x014f;
                  const isTitle = addr >= 0x0134 && addr <= 0x0142;
                  const isLogo = addr >= 0x0104 && addr <= 0x0133;

                  return (
                    <span
                      key={idx}
                      className={`w-7 text-center font-bold text-[11px] ${
                        b === null
                          ? 'text-slate-700'
                          : isTitle
                          ? 'text-emerald-400'
                          : isLogo
                          ? 'text-sky-400'
                          : isHeader
                          ? 'text-cyan-300'
                          : b === 0
                          ? 'text-slate-600'
                          : 'text-slate-300'
                      }`}
                    >
                      {b !== null ? b.toString(16).padStart(2, '0').toUpperCase() : '--'}
                    </span>
                  );
                })}
              </div>

              <div className="w-36 flex items-center gap-0.5 text-slate-400 border-l border-slate-800 pl-3 select-none">
                {row.bytes.map((b, idx) => {
                  const char = b !== null && b >= 32 && b <= 126 ? String.fromCharCode(b) : '·';
                  return (
                    <span
                      key={idx}
                      className={b !== null && b >= 32 && b <= 126 ? 'text-slate-200' : 'text-slate-600'}
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - bytesPerRow * rowsToShow))}
            disabled={offset === 0}
            className="px-3 py-1 bg-[#182030] hover:bg-[#222c42] disabled:opacity-40 disabled:cursor-not-allowed border border-[#27324c] rounded cursor-pointer"
          >
            $\leftarrow$ Previous Page
          </button>
          <button
            onClick={() => setOffset(Math.min(maxOffset, offset + bytesPerRow * rowsToShow))}
            disabled={offset >= maxOffset}
            className="px-3 py-1 bg-[#182030] hover:bg-[#222c42] disabled:opacity-40 disabled:cursor-not-allowed border border-[#27324c] rounded cursor-pointer"
          >
            Next Page $\rightarrow$
          </button>
        </div>

        <div>
          Showing 0x{offset.toString(16).toUpperCase()} – 0x{(offset + bytesPerRow * rowsToShow - 1).toString(16).toUpperCase()}
        </div>
      </div>
    </div>
  );
};
