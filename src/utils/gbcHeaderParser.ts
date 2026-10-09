import { GbcRomHeader, RomIntegrityReport, IntegrityIssue, IntegrityStatus } from '../types/gbc';

// Standard 48-byte Nintendo logo present in all valid GB/GBC cartridges (0x0104 - 0x0133)
export const NINTENDO_BOOT_LOGO = new Uint8Array([
  0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83, 0x00, 0x0c, 0x00, 0x0d,
  0x00, 0x08, 0x11, 0x1f, 0x88, 0x89, 0x00, 0x0e, 0xdc, 0xcc, 0x6e, 0xe6, 0xdd, 0xdd, 0xd9, 0x99,
  0xbb, 0xbb, 0x67, 0x63, 0x6e, 0x0e, 0xec, 0xcc, 0xdd, 0xdc, 0x99, 0x9f, 0xbb, 0xb9, 0x33, 0x3e
]);

// Database of New Licensee Codes (0x0144 - 0x0145)
const NEW_LICENSEE_MAP: Record<string, string> = {
  '00': 'None / Homebrew',
  '01': 'Nintendo R&D1',
  '08': 'Capcom Co., Ltd.',
  '13': 'Electronic Arts',
  '18': 'Hudson Soft',
  '19': 'b-ai / Banpresto',
  '20': 'KSS',
  '22': 'POW',
  '24': 'PCM Complete',
  '25': 'San-X',
  '28': 'Kemco Japan',
  '29': 'SETA',
  '30': 'Viacom New Media',
  '31': 'Nintendo',
  '32': 'Bandai',
  '33': 'Ocean Software / Acclaim',
  '34': 'Konami',
  '35': 'Hector / Hector Software',
  '37': 'Taito',
  '38': 'Hudson Soft',
  '39': 'Banpresto',
  '41': 'Ubi Soft Entertainment',
  '42': 'Atlus Co., Ltd.',
  '44': 'Malibu Games',
  '46': 'Angel / Bandai',
  '47': 'Bullet-Proof Software',
  '49': 'Irem',
  '50': 'Absolute Entertainment',
  '51': 'Acclaim Entertainment',
  '52': 'Activision',
  '53': 'American Sammy',
  '54': 'Konami Computer Entertainment',
  '55': 'Hi Tech Expressions',
  '56': 'LJN Toys',
  '57': 'Matchbox',
  '58': 'Mattel',
  '59': 'Milton Bradley',
  '60': 'Titus Interactive',
  '61': 'Virgin Games',
  '64': 'LucasArts Entertainment',
  '67': 'Ocean Software',
  '69': 'Electronic Arts',
  '70': 'Infogrames',
  '71': 'Interplay Entertainment',
  '72': 'Broderbund',
  '73': 'Sculptured Software',
  '75': 'SCI (Sales Curve Interactive)',
  '78': 'THQ Software',
  '79': 'Accolade',
  '80': 'Misawa Entertainment',
  '83': 'LOZC',
  '86': 'Tokuma Shoten',
  '87': 'Tsukuda Original',
  '91': 'Chunsoft',
  '92': 'Video System',
  '93': 'Ocean / Acclaim',
  '95': 'Varie',
  '96': 'Yonezawa / S’Pal',
  '97': 'Kaneko',
  '99': 'Marvelous Entertainment',
  'A4': 'Konami (KCEE)',
  'AF': 'Namco Limited',
  'B0': 'Acclaim Japan',
  'B1': 'ASCII / Nexoft',
  'B2': 'Bandai Co., Ltd.',
  'B4': 'Enix Corporation',
  'B6': 'HAL Laboratory',
  'B7': 'SNK Corporation',
  'B9': 'Pony Canyon',
  'BA': 'Culture Brain',
  'BB': 'Sunsoft',
  'BD': 'Sony Imagesoft',
  'BF': 'Sammy',
  'BL': 'MTO',
  'BN': 'Sunrise Interactive',
  'BP': 'Global A Entertainment',
  'BQ': 'FuKi/FuRai',
  'C0': 'Taito Corporation',
  'C2': 'Kemco',
  'C3': 'Square Co., Ltd.',
  'C4': 'Tokuma Shoten',
  'C5': 'Data East',
  'C6': 'Tonkin House',
  'C8': 'Koei',
  'CA': 'Konami Ultra Games',
  'CB': 'VAP Inc.',
  'CC': 'Use Corporation',
  'CD': 'Meldac',
  'CE': 'Pony Canyon',
  'CF': 'Angel',
  'D1': 'Sofel',
  'D2': 'Quest',
  'D3': 'Sigma Enterprises',
  'D4': 'Ask Kodansha',
  'D6': 'Naxat Soft',
  'D7': 'Copya System',
  'D9': 'Banpresto',
  'DA': 'Tomy',
  'DB': 'LJN',
  'DD': 'NCS / Masaya',
  'DF': 'Altron',
  'E0': 'Jaleco',
  'E1': 'Towa Chiki',
  'E2': 'Yutaka',
  'E3': 'Varie',
  'E5': 'Epoc',
  'E7': 'Athena',
  'E8': 'Asmik Ace Entertainment',
  'E9': 'Natsume',
  'EA': 'King Records',
  'EB': 'Atlus',
  'EC': 'Epic/Sony Records',
  'EE': 'IGS',
  'F0': 'A Wave',
  'F3': 'Extreme Entertainment',
  'FB': 'Psygnosis',
};

// Database of Cartridge Types (0x0147)
const CARTRIDGE_TYPES: Record<number, { name: string; mbc: GbcRomHeader['mbcFamily']; ram: boolean; battery: boolean; rtc: boolean; rumble: boolean; supported: boolean }> = {
  0x00: { name: 'ROM ONLY', mbc: 'None (ROM Only)', ram: false, battery: false, rtc: false, rumble: false, supported: true },
  0x01: { name: 'MBC1', mbc: 'MBC1', ram: false, battery: false, rtc: false, rumble: false, supported: true },
  0x02: { name: 'MBC1+RAM', mbc: 'MBC1', ram: true, battery: false, rtc: false, rumble: false, supported: true },
  0x03: { name: 'MBC1+RAM+BATTERY', mbc: 'MBC1', ram: true, battery: true, rtc: false, rumble: false, supported: true },
  0x05: { name: 'MBC2', mbc: 'MBC2', ram: true, battery: false, rtc: false, rumble: false, supported: true },
  0x06: { name: 'MBC2+BATTERY', mbc: 'MBC2', ram: true, battery: true, rtc: false, rumble: false, supported: true },
  0x08: { name: 'ROM+RAM', mbc: 'None (ROM Only)', ram: true, battery: false, rtc: false, rumble: false, supported: true },
  0x09: { name: 'ROM+RAM+BATTERY', mbc: 'None (ROM Only)', ram: true, battery: true, rtc: false, rumble: false, supported: true },
  0x0b: { name: 'MMM01', mbc: 'Other', ram: false, battery: false, rtc: false, rumble: false, supported: false },
  0x0c: { name: 'MMM01+RAM', mbc: 'Other', ram: true, battery: false, rtc: false, rumble: false, supported: false },
  0x0d: { name: 'MMM01+RAM+BATTERY', mbc: 'Other', ram: true, battery: true, rtc: false, rumble: false, supported: false },
  0x0f: { name: 'MBC3+TIMER+BATTERY', mbc: 'MBC3', ram: false, battery: true, rtc: true, rumble: false, supported: true },
  0x10: { name: 'MBC3+TIMER+RAM+BATTERY', mbc: 'MBC3', ram: true, battery: true, rtc: true, rumble: false, supported: true },
  0x11: { name: 'MBC3', mbc: 'MBC3', ram: false, battery: false, rtc: false, rumble: false, supported: true },
  0x12: { name: 'MBC3+RAM', mbc: 'MBC3', ram: true, battery: false, rtc: false, rumble: false, supported: true },
  0x13: { name: 'MBC3+RAM+BATTERY', mbc: 'MBC3', ram: true, battery: true, rtc: false, rumble: false, supported: true },
  0x19: { name: 'MBC5', mbc: 'MBC5', ram: false, battery: false, rtc: false, rumble: false, supported: true },
  0x1a: { name: 'MBC5+RAM', mbc: 'MBC5', ram: true, battery: false, rtc: false, rumble: false, supported: true },
  0x1b: { name: 'MBC5+RAM+BATTERY', mbc: 'MBC5', ram: true, battery: true, rtc: false, rumble: false, supported: true },
  0x1c: { name: 'MBC5+RUMBLE', mbc: 'MBC5', ram: false, battery: false, rtc: false, rumble: true, supported: true },
  0x1d: { name: 'MBC5+RUMBLE+RAM', mbc: 'MBC5', ram: true, battery: false, rtc: false, rumble: true, supported: true },
  0x1e: { name: 'MBC5+RUMBLE+RAM+BATTERY', mbc: 'MBC5', ram: true, battery: true, rtc: false, rumble: true, supported: true },
  0x20: { name: 'MBC6', mbc: 'MBC6', ram: true, battery: true, rtc: false, rumble: false, supported: false },
  0x22: { name: 'MBC7+SENSOR+RUMBLE+RAM+BATTERY', mbc: 'MBC7', ram: true, battery: true, rtc: false, rumble: true, supported: false },
  0xfc: { name: 'POCKET CAMERA', mbc: 'Other', ram: true, battery: true, rtc: false, rumble: false, supported: false },
  0xfd: { name: 'BANDAI TAMA5', mbc: 'Other', ram: true, battery: true, rtc: true, rumble: false, supported: false },
  0xfe: { name: 'HuC3', mbc: 'HuC', ram: true, battery: true, rtc: true, rumble: false, supported: true },
  0xff: { name: 'HuC1+RAM+BATTERY', mbc: 'HuC', ram: true, battery: true, rtc: false, rumble: false, supported: true },
};

// ROM Sizes (0x0148)
const ROM_SIZE_MAP: Record<number, { bytes: number; formatted: string; banks: number; validCode: boolean }> = {
  0x00: { bytes: 32 * 1024, formatted: '32 KiB (2 banks)', banks: 2, validCode: true },
  0x01: { bytes: 64 * 1024, formatted: '64 KiB (4 banks)', banks: 4, validCode: true },
  0x02: { bytes: 128 * 1024, formatted: '128 KiB (8 banks)', banks: 8, validCode: true },
  0x03: { bytes: 256 * 1024, formatted: '256 KiB (16 banks)', banks: 16, validCode: true },
  0x04: { bytes: 512 * 1024, formatted: '512 KiB (32 banks)', banks: 32, validCode: true },
  0x05: { bytes: 1024 * 1024, formatted: '1 MiB (64 banks)', banks: 64, validCode: true },
  0x06: { bytes: 2 * 1024 * 1024, formatted: '2 MiB (128 banks)', banks: 128, validCode: true },
  0x07: { bytes: 4 * 1024 * 1024, formatted: '4 MiB (256 banks)', banks: 256, validCode: true },
  0x08: { bytes: 8 * 1024 * 1024, formatted: '8 MiB (512 banks)', banks: 512, validCode: true },
  0x52: { bytes: 1.1 * 1024 * 1024, formatted: '1.1 MiB (72 banks)', banks: 72, validCode: true },
  0x53: { bytes: 1.2 * 1024 * 1024, formatted: '1.2 MiB (80 banks)', banks: 80, validCode: true },
  0x54: { bytes: 1.5 * 1024 * 1024, formatted: '1.5 MiB (96 banks)', banks: 96, validCode: true },
};

// RAM Sizes (0x0149)
const RAM_SIZE_MAP: Record<number, { bytes: number; formatted: string; banks: number; validCode: boolean }> = {
  0x00: { bytes: 0, formatted: 'None (No external RAM)', banks: 0, validCode: true },
  0x01: { bytes: 2 * 1024, formatted: '2 KiB (Unofficial)', banks: 1, validCode: true },
  0x02: { bytes: 8 * 1024, formatted: '8 KiB (1 bank)', banks: 1, validCode: true },
  0x03: { bytes: 32 * 1024, formatted: '32 KiB (4 banks of 8 KiB)', banks: 4, validCode: true },
  0x04: { bytes: 128 * 1024, formatted: '128 KiB (16 banks of 8 KiB)', banks: 16, validCode: true },
  0x05: { bytes: 64 * 1024, formatted: '64 KiB (8 banks of 8 KiB)', banks: 8, validCode: true },
};

/**
 * Detailed ROM Integrity Checker
 * Verifies:
 * 1. Checksum and Complement byte at 0x014D (Mathematical two's complement and hardware algorithm)
 * 2. 16-bit Global Checksum at 0x014E-0x014F
 * 3. 48-byte Nintendo graphic boot logo at 0x0104-0x0133
 * 4. Entry Point Jump instruction at 0x0100-0x0103
 * 5. File size truncation vs declared ROM capacity
 * 6. Cartridge Controller (MBC) & RAM hardware support
 */
export function checkRomIntegrity(data: Uint8Array): RomIntegrityReport {
  const issues: IntegrityIssue[] = [];
  let score = 100;

  // 1. Header Checksum and Complement Byte Check (0x014D)
  // Formula: x = 0; for i = 0x0134 to 0x014C: x = (x - data[i] - 1) & 0xFF
  // Mathematical complement property:
  // (sum(0x0134..0x014C) + storedChecksum + 25) & 0xFF === 0
  const storedHeaderChecksum = data[0x014d];
  let computedHeaderChecksum = 0;
  let rawHeaderSum = 0;

  for (let i = 0x0134; i <= 0x014c; i++) {
    rawHeaderSum += data[i];
    computedHeaderChecksum = (computedHeaderChecksum - data[i] - 1) & 0xff;
  }

  // Complement sum verification: (sum + stored + 25) mod 256
  const complementSum = (rawHeaderSum + storedHeaderChecksum + 25) & 0xff;
  const isComplementValid = complementSum === 0;
  const isHeaderChecksumValid = storedHeaderChecksum === computedHeaderChecksum;
  const twoComplementDiff = (computedHeaderChecksum - storedHeaderChecksum + 256) % 256;

  if (!isHeaderChecksumValid || !isComplementValid) {
    score -= 45;
    issues.push({
      id: 'header_checksum_mismatch',
      severity: 'critical',
      title: 'Corrupted Header Checksum & Complement Byte (0x014D)',
      description: `Stored byte 0x${storedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()} does not equal calculated complement 0x${computedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()}. Complement sum is 0x${complementSum.toString(16).padStart(2, '0').toUpperCase()} (must be 0x00).`,
      offsetHex: '0x014D',
      storedHex: `0x${storedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()}`,
      expectedHex: `0x${computedHeaderChecksum.toString(16).padStart(2, '0').toUpperCase()}`,
      technicalDetail: `Hardware verification fails: (sum(0x134..0x14C) + [0x14D] + 25) mod 256 != 0. Delta: ${twoComplementDiff}.`,
      impact: 'CRITICAL: The Game Boy Boot ROM halts CPU execution immediately before loading. The real system or strict emulators freeze with a blank chime.',
      canAutoFix: true,
    });
  }

  // 2. Global Checksum (0x014E-0x014F)
  const storedGlobalChecksum = (data[0x014e] << 8) | data[0x014f];
  let computedGlobalChecksum = 0;
  for (let i = 0; i < data.length; i++) {
    if (i !== 0x014e && i !== 0x014f) {
      computedGlobalChecksum = (computedGlobalChecksum + data[i]) & 0xffff;
    }
  }
  const isGlobalChecksumValid = computedGlobalChecksum === storedGlobalChecksum;
  const globalDiff = Math.abs(computedGlobalChecksum - storedGlobalChecksum);

  if (!isGlobalChecksumValid) {
    score -= 15;
    issues.push({
      id: 'global_checksum_mismatch',
      severity: 'warning',
      title: 'Global 16-Bit Checksum Mismatch (0x014E–0x014F)',
      description: `Stored 16-bit word 0x${storedGlobalChecksum.toString(16).padStart(4, '0').toUpperCase()} does not match whole-cartridge sum 0x${computedGlobalChecksum.toString(16).padStart(4, '0').toUpperCase()}.`,
      offsetHex: '0x014E-0x014F',
      storedHex: `0x${storedGlobalChecksum.toString(16).padStart(4, '0').toUpperCase()}`,
      expectedHex: `0x${computedGlobalChecksum.toString(16).padStart(4, '0').toUpperCase()}`,
      technicalDetail: `Calculated 16-bit big-endian sum across ${data.length.toLocaleString()} bytes (excluding checksum bytes) differs by ${globalDiff}.`,
      impact: 'NON-CRITICAL WARNING: The boot ROM does not halt on global checksum mismatches, but flash carts, header checkers, and preservation databases flag it as a modified/hacked ROM.',
      canAutoFix: true,
    });
  }

  // 3. Nintendo Boot Logo Check (0x0104 - 0x0133, 48 bytes)
  let logoMismatchedBytes = 0;
  for (let i = 0; i < 48; i++) {
    if (data[0x0104 + i] !== NINTENDO_BOOT_LOGO[i]) {
      logoMismatchedBytes++;
    }
  }
  const isLogoValid = logoMismatchedBytes === 0;

  if (!isLogoValid) {
    score -= 35;
    issues.push({
      id: 'nintendo_logo_mismatch',
      severity: 'critical',
      title: 'Corrupted Nintendo Boot Graphic Logo (0x0104–0x0133)',
      description: `${logoMismatchedBytes} of 48 bytes in the graphical boot logo header are corrupted or altered.`,
      offsetHex: '0x0104-0x0133',
      storedHex: `${logoMismatchedBytes} byte mismatch`,
      expectedHex: 'Authentic 48-byte logo',
      technicalDetail: 'Real Game Boy hardware compares this region against its internal mask ROM. Mismatches lock the system in an infinite spinloop.',
      impact: 'CRITICAL: Hardware lockout on genuine consoles. Screen will display a corrupted tile scramble and freeze.',
      canAutoFix: true,
    });
  }

  // 4. Entry Point Vector Check (0x0100 - 0x0103)
  const b0 = data[0x0100];
  const b1 = data[0x0101];
  const b2 = data[0x0102];
  const b3 = data[0x0103];
  let entryPointValid = false;
  let jumpTarget = 0;
  let opcodeMnemonic = '';

  if (b0 === 0x00 && b1 === 0xc3) {
    // NOP; JP $target
    jumpTarget = (b3 << 8) | b2;
    opcodeMnemonic = `NOP; JP $${jumpTarget.toString(16).padStart(4, '0').toUpperCase()}`;
    entryPointValid = jumpTarget >= 0x0150 && jumpTarget < 0x8000;
  } else if (b0 === 0xc3) {
    // JP $target
    jumpTarget = (b2 << 8) | b1;
    opcodeMnemonic = `JP $${jumpTarget.toString(16).padStart(4, '0').toUpperCase()}`;
    entryPointValid = jumpTarget >= 0x0150 && jumpTarget < 0x8000;
  } else if (b0 === 0xf3 && b1 === 0xc3) {
    // DI; JP $target
    jumpTarget = (b3 << 8) | b2;
    opcodeMnemonic = `DI; JP $${jumpTarget.toString(16).padStart(4, '0').toUpperCase()}`;
    entryPointValid = jumpTarget >= 0x0150 && jumpTarget < 0x8000;
  } else {
    opcodeMnemonic = `UNKNOWN (0x${b0.toString(16).padStart(2, '0')}, 0x${b1.toString(16).padStart(2, '0')})`;
    entryPointValid = false;
  }

  if (!entryPointValid) {
    score -= 20;
    issues.push({
      id: 'invalid_entry_point',
      severity: 'warning',
      title: 'Non-Standard Entry Point Vector (0x0100–0x0103)',
      description: `Entry instructions "${opcodeMnemonic}" do not follow standard Game Boy boot sequence (usually NOP; JP $0150).`,
      offsetHex: '0x0100-0x0103',
      storedHex: `0x${b0.toString(16).padStart(2, '0')} 0x${b1.toString(16).padStart(2, '0')} 0x${b2.toString(16).padStart(2, '0')} 0x${b3.toString(16).padStart(2, '0')}`,
      expectedHex: '0x00 0xC3 0x50 0x01 (NOP; JP $0150)',
      technicalDetail: `Jump target $${jumpTarget.toString(16).toUpperCase()} outside recommended $0150-$7FFF cartridge address space.`,
      impact: 'Execution may crash or execute garbage opcodes upon handover from boot ROM.',
      canAutoFix: false,
    });
  }

  // 5. File Size Truncation / Overpadding Check
  const romSizeCode = data[0x0148];
  const romSizeInfo = ROM_SIZE_MAP[romSizeCode];
  let isTruncated = false;
  let isPadded = false;
  let fileSizeStatusText = 'Exact match with declared capacity';

  if (!romSizeInfo) {
    score -= 25;
    issues.push({
      id: 'invalid_rom_size_code',
      severity: 'critical',
      title: 'Unsupported / Corrupt ROM Size Code (0x0148)',
      description: `Value 0x${romSizeCode.toString(16).padStart(2, '0').toUpperCase()} is not a recognized Pan Docs cartridge size.`,
      offsetHex: '0x0148',
      storedHex: `0x${romSizeCode.toString(16).padStart(2, '0').toUpperCase()}`,
      expectedHex: '0x00 to 0x08',
      technicalDetail: 'Header declares an invalid capacity. Real MBC bank decoders cannot switch banks properly.',
      impact: 'UNSUPPORTED: Emulators and DOS wrappers cannot allocate correct virtual address banks.',
      canAutoFix: false,
    });
  } else {
    if (data.length < romSizeInfo.bytes) {
      isTruncated = true;
      score -= 40;
      fileSizeStatusText = `Truncated: File is only ${(data.length / 1024).toFixed(0)} KiB, but header specifies ${romSizeInfo.formatted}`;
      issues.push({
        id: 'file_truncated',
        severity: 'critical',
        title: 'Corrupted / Incomplete File Dump (Truncated ROM)',
        description: `Uploaded file contains only ${data.length.toLocaleString()} bytes, but the internal header declares ${romSizeInfo.bytes.toLocaleString()} bytes (${romSizeInfo.formatted}).`,
        offsetHex: '0x0148',
        storedHex: `${data.length} bytes present`,
        expectedHex: `${romSizeInfo.bytes} bytes required`,
        technicalDetail: `Missing ${romSizeInfo.bytes - data.length} bytes (${Math.round((romSizeInfo.bytes - data.length) / 1024)} KiB). Missing banks will cause unmapped read traps.`,
        impact: 'CRITICAL: The ROM is damaged or only partially downloaded. Execution will crash upon jumping into unmapped banks.',
        canAutoFix: false,
      });
    } else if (data.length > romSizeInfo.bytes) {
      isPadded = true;
      const extra = data.length - romSizeInfo.bytes;
      fileSizeStatusText = `Over-padded: Contains ${extra.toLocaleString()} extra trailing bytes`;
      issues.push({
        id: 'file_overpadded',
        severity: 'info',
        title: 'File Contains Extra Trailing Bytes',
        description: `File has ${extra.toLocaleString()} extra bytes beyond declared capacity (${romSizeInfo.formatted}).`,
        offsetHex: 'EOF',
        storedHex: `${data.length} bytes`,
        expectedHex: `${romSizeInfo.bytes} bytes`,
        technicalDetail: 'Likely copymachine header, trainer, or dump signature appended to file.',
        impact: 'Informational: Trailing bytes will be ignored by DOS Mode 13h converter.',
        canAutoFix: false,
      });
    }
  }

  // 6. Cartridge Controller (MBC) & Hardware Support
  const cartType = data[0x0147];
  const cartInfo = CARTRIDGE_TYPES[cartType];
  const unsupportedFlags: string[] = [];

  if (!cartInfo) {
    score -= 30;
    unsupportedFlags.push(`Unknown Cartridge Type: 0x${cartType.toString(16).padStart(2, '0').toUpperCase()}`);
    issues.push({
      id: 'unknown_cart_type',
      severity: 'critical',
      title: 'Unsupported / Unknown Cartridge Type (0x0147)',
      description: `Cartridge identifier 0x${cartType.toString(16).padStart(2, '0').toUpperCase()} is unassigned or invalid.`,
      offsetHex: '0x0147',
      storedHex: `0x${cartType.toString(16).padStart(2, '0').toUpperCase()}`,
      expectedHex: 'Valid MBC code (0x00-0x1E)',
      technicalDetail: 'Hardware cannot determine memory bank controller scheme.',
      impact: 'UNSUPPORTED: Cannot convert or run unknown memory controllers.',
      canAutoFix: false,
    });
  } else if (!cartInfo.supported) {
    score -= 20;
    unsupportedFlags.push(`Exotic hardware: ${cartInfo.name} requires custom coprocessor`);
    issues.push({
      id: 'exotic_cart_type',
      severity: 'warning',
      title: `Special Hardware Cartridge: ${cartInfo.name}`,
      description: `Cartridge uses specialized peripheral hardware (${cartInfo.name}) that requires custom emulation.`,
      offsetHex: '0x0147',
      storedHex: `0x${cartType.toString(16).padStart(2, '0').toUpperCase()}`,
      expectedHex: 'Standard MBC1/3/5',
      technicalDetail: 'Hardware features (sensors, cameras, or specialized sound chips) not mapped in generic Mode 13h stub.',
      impact: 'Cartridge graphics will run, but auxiliary sensor features will be disabled.',
      canAutoFix: false,
    });
  }

  // Determine overall status
  score = Math.max(0, Math.min(100, score));
  let status: IntegrityStatus = 'healthy';
  const hasCritical = issues.some(i => i.severity === 'critical');
  const hasWarning = issues.some(i => i.severity === 'warning');

  if (hasCritical) {
    status = issues.some(i => i.id === 'invalid_rom_size_code' || i.id === 'unknown_cart_type') ? 'unsupported' : 'corrupted';
  } else if (hasWarning) {
    status = 'warning';
  } else {
    status = 'healthy';
  }

  let summary = 'ROM integrity verified: Header checksum, complement, logo, and vectors pass all Pan Docs hardware requirements.';
  if (status === 'corrupted') {
    summary = 'CORRUPTED ROM: Critical header checksum/complement or logo mismatch detected. Hardware boot ROM will reject this cartridge.';
  } else if (status === 'unsupported') {
    summary = 'UNSUPPORTED ROM: Cartridge contains invalid capacity or unsupported hardware controller codes.';
  } else if (status === 'warning') {
    summary = 'MINOR INTEGRITY WARNINGS: Header complement passed, but non-critical global checksum or entry vector anomalies detected.';
  }

  return {
    status,
    healthScore: score,
    summary,
    issues,
    headerChecksumDetails: {
      stored: storedHeaderChecksum,
      computed: computedHeaderChecksum,
      complementSum,
      isValid: isHeaderChecksumValid,
      isComplementValid,
      twoComplementDiff,
      formula: 'x = 0; for i = 0x134..0x14C: x = (x - [i] - 1) & 0xFF  <=>  (sum + stored + 25) mod 256 == 0',
    },
    globalChecksumDetails: {
      stored: storedGlobalChecksum,
      computed: computedGlobalChecksum,
      isValid: isGlobalChecksumValid,
      difference: globalDiff,
    },
    logoDetails: {
      isValid: isLogoValid,
      mismatchedBytes: logoMismatchedBytes,
      hardwareLockoutRisk: !isLogoValid,
    },
    entryPointDetails: {
      isValid: entryPointValid,
      jumpTarget,
      opcodeMnemonic,
    },
    fileSizeDetails: {
      declaredBytes: romSizeInfo?.bytes || 0,
      actualBytes: data.length,
      isTruncated,
      isPadded,
      statusText: fileSizeStatusText,
    },
    hardwareSupportDetails: {
      isSupportedByGbc: status !== 'corrupted' && status !== 'unsupported',
      isSupportedByDosMode13h: !isTruncated && cartInfo?.supported !== false,
      unsupportedFlags,
    },
  };
}

/**
 * Auto-repairs a Game Boy Color ROM binary by recalculating and patching:
 * 1. Header Checksum and Complement byte at 0x014D
 * 2. 16-bit Global Checksum at 0x014E-0x014F
 * 3. Restoring authentic 48-byte Nintendo boot logo at 0x0104-0x0133 (if corrupted)
 */
export function autoRepairRomHeader(data: Uint8Array): Uint8Array {
  const fixed = new Uint8Array(data);

  // 1. Repair Nintendo Boot Logo (0x0104 - 0x0133)
  fixed.set(NINTENDO_BOOT_LOGO, 0x0104);

  // 2. Calculate and write valid Header Checksum & Complement byte (0x014D)
  let hCheck = 0;
  for (let i = 0x0134; i <= 0x014c; i++) {
    hCheck = (hCheck - fixed[i] - 1) & 0xff;
  }
  fixed[0x014d] = hCheck;

  // 3. Calculate and write valid 16-bit Global Checksum (0x014E - 0x014F)
  let gCheck = 0;
  for (let i = 0; i < fixed.length; i++) {
    if (i !== 0x014e && i !== 0x014f) {
      gCheck = (gCheck + fixed[i]) & 0xffff;
    }
  }
  fixed[0x014e] = (gCheck >> 8) & 0xff;
  fixed[0x014f] = gCheck & 0xff;

  return fixed;
}

/**
 * Creates an intentionally corrupted ROM copy for testing the integrity checker:
 * Corrupts header checksum byte at 0x014D and Nintendo logo bytes.
 */
export function createCorruptedTestRom(validRom: Uint8Array): Uint8Array {
  const corrupted = new Uint8Array(validRom);
  // Invert checksum byte at 0x014D
  corrupted[0x014d] = (corrupted[0x014d] ^ 0xaa) & 0xff;
  // Corrupt a few bytes in the Nintendo logo
  corrupted[0x0108] = 0x00;
  corrupted[0x0109] = 0xff;
  // Invert global checksum
  corrupted[0x014e] = (corrupted[0x014e] ^ 0x55) & 0xff;
  return corrupted;
}

/**
 * Parses raw Game Boy / Game Boy Color ROM bytes and extracts all internal header metadata.
 * Complies with official Pan Docs Game Boy specifications.
 */
export function parseGbcRomHeader(data: Uint8Array, fileName = 'rom.gbc'): GbcRomHeader {
  if (data.length < 0x0150) {
    throw new Error(`Invalid ROM size: file is only ${data.length} bytes (minimum header requires 336 bytes / 0x0150)`);
  }

  // Run comprehensive integrity check
  const integrityReport = checkRomIntegrity(data);

  // 1. Entry Point: 0x0100 - 0x0103
  const entryPoint = [data[0x0100], data[0x0101], data[0x0102], data[0x0103]];

  // 2. Nintendo Logo: 0x0104 - 0x0133 (48 bytes)
  const nintendoLogoBitmap = data.slice(0x0104, 0x0134);
  const nintendoLogoValid = integrityReport.logoDetails.isValid;

  // 3. Title & Manufacturer Code:
  const cgbFlag = data[0x0143];
  const isCgbEnhanced = cgbFlag === 0x80 || cgbFlag === 0xc0;
  const isCgbOnly = cgbFlag === 0xc0;

  // Title decoding:
  const rawTitleBytes = data.slice(0x0134, isCgbEnhanced ? 0x013f : 0x0143);
  let title = '';
  for (let i = 0x0134; i < (isCgbEnhanced ? 0x013f : 0x0143); i++) {
    const b = data[i];
    if (b === 0) break; // Null terminator
    if (b >= 32 && b <= 126) {
      title += String.fromCharCode(b);
    } else {
      title += ' ';
    }
  }
  title = title.trim();
  if (!title) {
    title = 'UNTITLED_GBC';
  }

  // Manufacturer Code: 0x013F - 0x0142 (4 ASCII chars on CGB)
  let manufacturerCode = '';
  let validMfr = true;
  for (let i = 0x013f; i <= 0x0142; i++) {
    const b = data[i];
    if ((b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122)) {
      manufacturerCode += String.fromCharCode(b);
    } else if (b === 0) {
      // blank/unspecified
    } else {
      validMfr = false;
    }
  }
  manufacturerCode = manufacturerCode.trim();
  if (!validMfr || !manufacturerCode) {
    manufacturerCode = isCgbEnhanced ? 'N/A (Standard)' : 'DMG Legacy';
  }

  // CGB Flag Description:
  let cgbDescription = 'Non-CGB (Monochrome DMG Only)';
  if (cgbFlag === 0x80) {
    cgbDescription = 'Dual CGB / DMG (Backwards-Compatible with Classic Game Boy)';
  } else if (cgbFlag === 0xc0) {
    cgbDescription = 'CGB Only (Color Game Boy Exclusive Hardware)';
  }

  // 4. New Licensee Code: 0x0144 - 0x0145
  let newLicenseeCode = '';
  for (let i = 0x0144; i <= 0x0145; i++) {
    const b = data[i];
    if (b >= 32 && b <= 126) {
      newLicenseeCode += String.fromCharCode(b);
    } else {
      newLicenseeCode += '?';
    }
  }

  const oldLicenseeCode = data[0x014b];
  let licenseeName = NEW_LICENSEE_MAP[newLicenseeCode.toUpperCase()] || 'Unknown / Unlicensed Publisher';
  if (licenseeName.includes('Unknown') && oldLicenseeCode !== 0x33) {
    licenseeName = `Legacy Licensee 0x${oldLicenseeCode.toString(16).padStart(2, '0').toUpperCase()}`;
  }

  // 5. SGB Flag: 0x0146
  const sgbFlag = data[0x0146];
  const sgbDescription = sgbFlag === 0x03 ? 'Super Game Boy Supported (Custom Borders & Sound)' : 'Standard Game Boy Operation';

  // 6. Cartridge Type: 0x0147
  const cartridgeType = data[0x0147];
  const cartInfo = CARTRIDGE_TYPES[cartridgeType] || {
    name: `Unknown Type (0x${cartridgeType.toString(16).padStart(2, '0').toUpperCase()})`,
    mbc: 'Other' as const,
    ram: false,
    battery: false,
    rtc: false,
    rumble: false,
    supported: false,
  };

  // 7. ROM Size: 0x0148
  const romSizeCode = data[0x0148];
  const romSizeData = ROM_SIZE_MAP[romSizeCode] || {
    bytes: data.length,
    formatted: `${Math.round(data.length / 1024)} KiB (Custom/Unrecognized)`,
    banks: Math.max(2, Math.ceil(data.length / (16 * 1024))),
    validCode: false,
  };

  // 8. RAM Size: 0x0149
  const ramSizeCode = data[0x0149];
  const ramSizeData = RAM_SIZE_MAP[ramSizeCode] || {
    bytes: 0,
    formatted: 'Unknown RAM Code',
    banks: 0,
    validCode: false,
  };

  // 9. Destination Code: 0x014A
  const destinationCode = data[0x014a];
  const destinationDescription = destinationCode === 0x00 ? 'Japan (Domestic Japanese Market)' : 'Non-Japan / Overseas (Worldwide)';

  // 10. Mask ROM Version: 0x014C
  const maskRomVersion = data[0x014c];
  const versionFormatted = `v1.${maskRomVersion}`;

  // 11. Header Checksum / Complement: 0x014D
  const headerChecksum = data[0x014d];
  const computedHeaderChecksum = integrityReport.headerChecksumDetails.computed;
  const isHeaderChecksumValid = integrityReport.headerChecksumDetails.isValid;
  const headerComplementSum = integrityReport.headerChecksumDetails.complementSum;
  const isHeaderComplementValid = integrityReport.headerChecksumDetails.isComplementValid;

  // 12. Global Checksum: 0x014E - 0x014F
  const globalChecksum = integrityReport.globalChecksumDetails.stored;
  const computedGlobalChecksum = integrityReport.globalChecksumDetails.computed;
  const isGlobalChecksumValid = integrityReport.globalChecksumDetails.isValid;

  // Raw header slice (0x0100 - 0x014F = 80 bytes)
  const rawHeaderBytes = data.slice(0x0100, 0x0150);

  return {
    title,
    rawTitleBytes,
    manufacturerCode,
    cgbFlag,
    cgbDescription,
    isCgbOnly,
    isCgbEnhanced,
    newLicenseeCode,
    oldLicenseeCode,
    licenseeName,
    sgbFlag,
    sgbDescription,
    cartridgeType,
    cartridgeTypeDescription: cartInfo.name,
    mbcFamily: cartInfo.mbc,
    hasBattery: cartInfo.battery,
    hasRam: cartInfo.ram,
    hasRtc: cartInfo.rtc,
    hasRumble: cartInfo.rumble,
    romSizeCode,
    romSizeBytes: romSizeData.bytes,
    romSizeFormatted: romSizeData.formatted,
    romBanks: romSizeData.banks,
    ramSizeCode,
    ramSizeBytes: ramSizeData.bytes,
    ramSizeFormatted: ramSizeData.formatted,
    ramBanks: ramSizeData.banks,
    destinationCode,
    destinationDescription,
    maskRomVersion,
    versionFormatted,
    headerChecksum,
    computedHeaderChecksum,
    isHeaderChecksumValid,
    headerComplementSum,
    isHeaderComplementValid,
    globalChecksum,
    computedGlobalChecksum,
    isGlobalChecksumValid,
    nintendoLogoValid,
    nintendoLogoBitmap,
    logoMismatchedBytes: integrityReport.logoDetails.mismatchedBytes,
    entryPoint,
    entryPointValid: integrityReport.entryPointDetails.isValid,
    entryPointJumpAddress: integrityReport.entryPointDetails.jumpTarget,
    integrityReport,
    rawHeaderBytes,
    totalFileSizeBytes: data.length,
    fileName,
  };
}

/**
 * Decodes the 48-byte Nintendo graphic logo into a 48x8 1-bit monochrome pixel array.
 */
export function decodeNintendoLogoPixels(logoBytes: Uint8Array): boolean[][] {
  const width = 48;
  const height = 8;
  const grid: boolean[][] = Array.from({ length: height }, () => Array(width).fill(false));

  for (let c = 0; c < 12; c++) {
    const b0 = logoBytes[c * 2];
    const b1 = logoBytes[c * 2 + 1];
    
    const topRows = [
      (b0 >> 4) & 0x0f,
      b0 & 0x0f,
      (b1 >> 4) & 0x0f,
      b1 & 0x0f,
    ];

    for (let r = 0; r < 4; r++) {
      const nibble = topRows[r];
      for (let bit = 0; bit < 4; bit++) {
        if ((nibble & (0x08 >> bit)) !== 0) {
          grid[r][c * 4 + bit] = true;
        }
      }
    }

    const b2 = logoBytes[24 + c * 2];
    const b3 = logoBytes[24 + c * 2 + 1];
    const botRows = [
      (b2 >> 4) & 0x0f,
      b2 & 0x0f,
      (b3 >> 4) & 0x0f,
      b3 & 0x0f,
    ];

    for (let r = 0; r < 4; r++) {
      const nibble = botRows[r];
      for (let bit = 0; bit < 4; bit++) {
        if ((nibble & (0x08 >> bit)) !== 0) {
          grid[4 + r][c * 4 + bit] = true;
        }
      }
    }
  }

  return grid;
}
