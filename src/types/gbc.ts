/**
 * Game Boy Color ROM Internal Header & Conversion Types
 * Reference: Pan Docs & GB/GBC Hardware Specification
 */

export interface GbcRomHeader {
  // Primary Identifiers
  title: string;
  rawTitleBytes: Uint8Array;
  manufacturerCode: string; // 0x013F-0x0142 (4 characters in CGB)
  cgbFlag: number; // 0x0143 (0x80 = Dual/Backwards, 0xC0 = CGB Only, 0x00 = DMG)
  cgbDescription: string;
  isCgbOnly: boolean;
  isCgbEnhanced: boolean;
  
  // Publisher / Licensee
  newLicenseeCode: string; // 0x0144-0x0145 (2 ASCII characters)
  oldLicenseeCode: number; // 0x014B
  licenseeName: string;
  
  // Hardware Capabilities
  sgbFlag: number; // 0x0146 (0x03 = SGB features supported)
  sgbDescription: string;
  cartridgeType: number; // 0x0147 (MBC Type)
  cartridgeTypeDescription: string;
  mbcFamily: 'None (ROM Only)' | 'MBC1' | 'MBC2' | 'MBC3' | 'MBC5' | 'MBC6' | 'MBC7' | 'HuC' | 'Other';
  hasBattery: boolean;
  hasRam: boolean;
  hasRtc: boolean;
  hasRumble: boolean;
  
  // Storage Sizes
  romSizeCode: number; // 0x0148
  romSizeBytes: number;
  romSizeFormatted: string;
  romBanks: number;
  
  ramSizeCode: number; // 0x0149
  ramSizeBytes: number;
  ramSizeFormatted: string;
  ramBanks: number;
  
  // Regional & Version
  destinationCode: number; // 0x014A (0x00 = Japan, 0x01 = Overseas)
  destinationDescription: string;
  maskRomVersion: number; // 0x014C
  versionFormatted: string;
  
  // Checksums & Validation
  headerChecksum: number; // 0x014D (Header Checksum / Complement)
  computedHeaderChecksum: number;
  isHeaderChecksumValid: boolean;
  headerComplementSum: number; // Complement check sum
  isHeaderComplementValid: boolean;
  
  globalChecksum: number; // 0x014E-0x014F (16-bit big-endian)
  computedGlobalChecksum: number;
  isGlobalChecksumValid: boolean;
  
  nintendoLogoValid: boolean;
  nintendoLogoBitmap: Uint8Array; // 48 bytes at 0x0104-0x0133
  logoMismatchedBytes: number;
  entryPoint: number[]; // 4 bytes at 0x0100-0x0103
  entryPointValid: boolean;
  entryPointJumpAddress: number;
  
  // Integrity & Health Assessment
  integrityReport: RomIntegrityReport;

  // Raw Data Buffers
  rawHeaderBytes: Uint8Array; // 0x0100 to 0x014F (80 bytes)
  totalFileSizeBytes: number;
  fileName: string;
}

export type IntegrityStatus = 'healthy' | 'warning' | 'corrupted' | 'unsupported';

export interface IntegrityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  offsetHex: string;
  storedHex: string;
  expectedHex: string;
  technicalDetail: string;
  impact: string;
  canAutoFix: boolean;
}

export interface RomIntegrityReport {
  status: IntegrityStatus;
  healthScore: number; // 0 - 100
  summary: string;
  issues: IntegrityIssue[];
  headerChecksumDetails: {
    stored: number;
    computed: number;
    complementSum: number;
    isValid: boolean;
    isComplementValid: boolean;
    twoComplementDiff: number;
    formula: string;
  };
  globalChecksumDetails: {
    stored: number;
    computed: number;
    isValid: boolean;
    difference: number;
  };
  logoDetails: {
    isValid: boolean;
    mismatchedBytes: number;
    hardwareLockoutRisk: boolean;
  };
  entryPointDetails: {
    isValid: boolean;
    jumpTarget: number;
    opcodeMnemonic: string;
  };
  fileSizeDetails: {
    declaredBytes: number;
    actualBytes: number;
    isTruncated: boolean;
    isPadded: boolean;
    statusText: string;
  };
  hardwareSupportDetails: {
    isSupportedByGbc: boolean;
    isSupportedByDosMode13h: boolean;
    unsupportedFlags: string[];
  };
}

export interface ConversionConfig {
  targetVideoMode: 'mode13h_320x200';
  layoutMode: 'centered_160x144_hud' | 'scaled_320x200' | 'aspect_letterbox';
  dosSubsystem: 'realmode_8086' | 'dpmi_32bit';
  vgaPaletteStrategy: 'dynamic_gbc_rgb555' | 'high_contrast' | 'classic_phosphor_green';
  authorTag: string;
  dosBannerNotice: string;
  includeDiagnosticHUD: boolean;
  enableScanlineEmulation: boolean;
  enableSoundBlasterStub: boolean;
}

export interface MzHeaderStructure {
  magic: string;             // 0x00: 0x5A4D ("MZ")
  bytesInLastPage: number;   // 0x02: Bytes in last 512-byte page
  pages: number;             // 0x04: 512-byte pages in file
  relocations: number;       // 0x06: Number of relocation entries
  headerParagraphs: number;  // 0x08: Header size in 16-byte paragraphs
  minAlloc: number;          // 0x0A: Minimum extra paragraphs
  maxAlloc: number;          // 0x0C: Maximum extra paragraphs
  initialSS: number;         // 0x0E: Initial SS relative to load segment
  initialSP: number;         // 0x10: Initial SP register
  checksum: number;          // 0x12: Checksum (usually 0)
  initialIP: number;         // 0x14: Initial IP register
  initialCS: number;         // 0x16: Initial CS relative to load segment
  relocTableOffset: number;  // 0x18: Offset to relocation table
  overlayNumber: number;     // 0x1A: Overlay number
}

export interface DosExeOutput {
  fileName: string;
  exeBlob: Blob;
  exeArrayBuffer: Uint8Array;
  exeSizeBytes: number;
  mzHeader: MzHeaderStructure;
  asmSourceCode: string;
  cSourceCode: string;
  vgaPaletteArray: Uint8Array; // 768 bytes (256 * 3 bytes RGB 0..63)
  conversionTimestamp: string;
  summaryReport: string;
}

export interface SampleRomDescriptor {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  cgbType: 'CGB Only' | 'Dual CGB/DMG' | 'DMG Compatible';
  romSize: string;
  ramSize: string;
  mbc: string;
  publisher: string;
  version: string;
  romData: Uint8Array;
}
