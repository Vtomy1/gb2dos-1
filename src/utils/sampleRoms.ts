import { NINTENDO_BOOT_LOGO } from './gbcHeaderParser';
import { SampleRomDescriptor } from '../types/gbc';

/**
 * Helper to build an authentic, valid Game Boy Color ROM byte buffer with verified checksums.
 */
function createSyntheticGbcRom(options: {
  title: string;
  manufacturerCode: string;
  cgbFlag: number;
  newLicenseeCode: string;
  sgbFlag?: number;
  cartridgeType: number;
  romSizeCode: number;
  ramSizeCode: number;
  destinationCode: number;
  maskRomVersion: number;
  patternType?: 'grid' | 'sprite_demo' | 'racing' | 'space';
}): Uint8Array {
  // Determine ROM size: min 32KB (0x8000)
  const sizeTable: Record<number, number> = {
    0x00: 32 * 1024,
    0x01: 64 * 1024,
    0x02: 128 * 1024,
    0x03: 256 * 1024,
  };
  const totalSize = sizeTable[options.romSizeCode] || 32 * 1024;
  const rom = new Uint8Array(totalSize);

  // Fill with dummy NOP / HALT or test code
  rom.fill(0x00);

  // 1. RST vectors & Interrupt vectors (0x0000 - 0x00FF)
  // Fill vector jumps (JP 0x0150)
  for (let v = 0x00; v <= 0x60; v += 0x08) {
    rom[v] = 0xc3; // JP
    rom[v + 1] = 0x50;
    rom[v + 2] = 0x01;
  }

  // 2. Entry Point (0x0100 - 0x0103)
  // Standard entry is NOP; JP 0x0150 (0x00, 0xC3, 0x50, 0x01)
  rom[0x0100] = 0x00; // NOP
  rom[0x0101] = 0xc3; // JP
  rom[0x0102] = 0x50; // low byte: 0x50
  rom[0x0103] = 0x01; // high byte: 0x01

  // 3. Nintendo Logo (0x0104 - 0x0133, 48 bytes)
  rom.set(NINTENDO_BOOT_LOGO, 0x0104);

  // 4. Title (0x0134 - 0x013E, 11 bytes) & Manufacturer Code (0x013F - 0x0142, 4 bytes)
  const titlePadded = options.title.padEnd(11, '\0').slice(0, 11);
  for (let i = 0; i < 11; i++) {
    rom[0x0134 + i] = titlePadded.charCodeAt(i);
  }

  const mfrPadded = options.manufacturerCode.padEnd(4, '\0').slice(0, 4);
  for (let i = 0; i < 4; i++) {
    rom[0x013f + i] = mfrPadded.charCodeAt(i);
  }

  // 5. CGB Flag (0x0143)
  rom[0x0143] = options.cgbFlag;

  // 6. New Licensee Code (0x0144 - 0x0145)
  const lic = options.newLicenseeCode.padEnd(2, ' ').slice(0, 2);
  rom[0x0144] = lic.charCodeAt(0);
  rom[0x0145] = lic.charCodeAt(1);

  // 7. SGB Flag (0x0146)
  rom[0x0146] = options.sgbFlag ?? 0x00;

  // 8. Cartridge Type (0x0147)
  rom[0x0147] = options.cartridgeType;

  // 9. ROM Size (0x0148)
  rom[0x0148] = options.romSizeCode;

  // 10. RAM Size (0x0149)
  rom[0x0149] = options.ramSizeCode;

  // 11. Destination Code (0x014A)
  rom[0x014a] = options.destinationCode;

  // 12. Old Licensee Code (0x014B) - 0x33 signals to use New Licensee code
  rom[0x014b] = 0x33;

  // 13. Mask ROM Version (0x014C)
  rom[0x014c] = options.maskRomVersion;

  // 14. Calculate Header Checksum (0x014D)
  // x = 0; for i = 0x0134 to 0x014C: x = (x - byte - 1) & 0xFF
  let hCheck = 0;
  for (let i = 0x0134; i <= 0x014c; i++) {
    hCheck = (hCheck - rom[i] - 1) & 0xff;
  }
  rom[0x014d] = hCheck;

  // Add dummy Game Boy tile pattern data at 0x800-0x1000 for visual preview
  // Game Boy tiles are 8x8 pixels stored in 16 bytes (2 bits per pixel)
  for (let t = 0x800; t < 0x1200; t += 16) {
    const tileIdx = (t - 0x800) / 16;
    for (let row = 0; row < 8; row++) {
      if (options.patternType === 'racing') {
        rom[t + row * 2] = (tileIdx % 2 === 0) ? (0xAA ^ (row * 17)) : (0x55 ^ (row * 31));
        rom[t + row * 2 + 1] = (tileIdx % 3 === 0) ? 0xFF : 0x00;
      } else if (options.patternType === 'space') {
        rom[t + row * 2] = (row === 3 || row === 4) ? 0x3C : 0x18;
        rom[t + row * 2 + 1] = (row % 2 === 0) ? 0x7E : 0x24;
      } else {
        rom[t + row * 2] = (tileIdx + row) * 23;
        rom[t + row * 2 + 1] = (tileIdx * 3 + row) * 11;
      }
    }
  }

  // 15. Calculate Global Checksum (0x014E - 0x014F)
  let gCheck = 0;
  for (let i = 0; i < rom.length; i++) {
    if (i !== 0x014e && i !== 0x014f) {
      gCheck = (gCheck + rom[i]) & 0xffff;
    }
  }
  rom[0x014e] = (gCheck >> 8) & 0xff;
  rom[0x014f] = gCheck & 0xff;

  return rom;
}

// Built-in sample ROMs ready to be loaded with a single click
export const SAMPLE_GBC_ROMS: SampleRomDescriptor[] = [
  {
    id: 'cgb_challenge',
    name: 'GBC-CHALLENGE',
    subtitle: 'Color Game Boy Exclusive (CGB-Only)',
    description: 'Nintendo official-format GBC cartridge featuring MBC5 memory controller, external battery-backed SRAM, and exclusive CGB color capabilities.',
    cgbType: 'CGB Only',
    romSize: '64 KiB',
    ramSize: '32 KiB',
    mbc: 'MBC5+RAM+BATTERY',
    publisher: 'Nintendo R&D1',
    version: 'v1.1',
    romData: createSyntheticGbcRom({
      title: 'CHALLENGE',
      manufacturerCode: 'NINT',
      cgbFlag: 0xc0, // CGB Only
      newLicenseeCode: '01', // Nintendo
      sgbFlag: 0x00,
      cartridgeType: 0x1b, // MBC5+RAM+BATTERY
      romSizeCode: 0x01, // 64 KiB
      ramSizeCode: 0x03, // 32 KiB
      destinationCode: 0x01, // Overseas
      maskRomVersion: 0x01, // v1.1
      patternType: 'grid',
    }),
  },
  {
    id: 'space_cradle',
    name: 'SPACE CRADLE',
    subtitle: 'Dual CGB / DMG Compatible',
    description: 'Backwards-compatible Game Boy Color title published by Capcom with MBC3 real-time clock and battery save system.',
    cgbType: 'Dual CGB/DMG',
    romSize: '128 KiB',
    ramSize: '32 KiB',
    mbc: 'MBC3+TIMER+RAM+BATTERY',
    publisher: 'Capcom Co., Ltd.',
    version: 'v1.0',
    romData: createSyntheticGbcRom({
      title: 'SPACECRADLE',
      manufacturerCode: 'CAPC',
      cgbFlag: 0x80, // Dual CGB / DMG
      newLicenseeCode: '08', // Capcom
      sgbFlag: 0x03, // SGB supported
      cartridgeType: 0x10, // MBC3+TIMER+RAM+BATTERY
      romSizeCode: 0x02, // 128 KiB
      ramSizeCode: 0x03, // 32 KiB
      destinationCode: 0x01, // Overseas
      maskRomVersion: 0x00, // v1.0
      patternType: 'space',
    }),
  },
  {
    id: 'retro_racer_98',
    name: 'RETRO RACER 98',
    subtitle: 'High-Speed Mode 13h Candidate',
    description: 'Konami arcade port with MBC1 bank switching, optimized for fast raster refresh and 8-bit VGA DAC conversion.',
    cgbType: 'Dual CGB/DMG',
    romSize: '64 KiB',
    ramSize: '8 KiB',
    mbc: 'MBC1+RAM+BATTERY',
    publisher: 'Konami (KCEE)',
    version: 'v1.2',
    romData: createSyntheticGbcRom({
      title: 'RETRORACER',
      manufacturerCode: 'KONM',
      cgbFlag: 0x80, // Dual CGB
      newLicenseeCode: 'A4', // Konami
      sgbFlag: 0x00,
      cartridgeType: 0x03, // MBC1+RAM+BATTERY
      romSizeCode: 0x01, // 64 KiB
      ramSizeCode: 0x02, // 8 KiB
      destinationCode: 0x00, // Japan
      maskRomVersion: 0x02, // v1.2
      patternType: 'racing',
    }),
  },
  {
    id: 'mode13h_benchmark',
    name: 'VGA-320x200 TEST',
    subtitle: 'Mode 13h DAC Calibration ROM',
    description: 'Dedicated test ROM designed to verify GBC 15-bit RGB to VGA 256-color DAC mapping and 320x200 layout centering.',
    cgbType: 'CGB Only',
    romSize: '32 KiB',
    ramSize: 'None',
    mbc: 'ROM ONLY',
    publisher: 'Ubi Soft Entertainment',
    version: 'v2.0',
    romData: createSyntheticGbcRom({
      title: 'MODE13HTEST',
      manufacturerCode: 'VGA8',
      cgbFlag: 0xc0, // CGB Only
      newLicenseeCode: '41', // Ubisoft
      sgbFlag: 0x00,
      cartridgeType: 0x00, // ROM ONLY
      romSizeCode: 0x00, // 32 KiB
      ramSizeCode: 0x00, // None
      destinationCode: 0x01, // Overseas
      maskRomVersion: 0x00, // v1.0
      patternType: 'grid',
    }),
  },
  {
    id: 'corrupt_checksum_test',
    name: 'CORRUPTED ROM',
    subtitle: 'Invalid Checksum & Complement Test',
    description: 'Intentionally corrupted Game Boy Color ROM with an invalid Header Checksum byte at 0x014D and modified logo to demonstrate the integrity alert and recovery engine.',
    cgbType: 'CGB Only',
    romSize: '64 KiB',
    ramSize: '8 KiB',
    mbc: 'MBC5',
    publisher: 'Corrupted Dump / Bad Rip',
    version: 'v9.9',
    romData: (() => {
      const rom = createSyntheticGbcRom({
        title: 'CORRUPT_GBC',
        manufacturerCode: 'BAD!',
        cgbFlag: 0xc0,
        newLicenseeCode: '00',
        cartridgeType: 0x19, // MBC5
        romSizeCode: 0x01,
        ramSizeCode: 0x02,
        destinationCode: 0x01,
        maskRomVersion: 0x09,
        patternType: 'grid',
      });
      // Corrupt the header checksum byte at 0x014D
      rom[0x014d] = (rom[0x014d] ^ 0xaa) & 0xff;
      // Corrupt 2 bytes in the logo
      rom[0x0110] = 0x00;
      rom[0x0111] = 0x00;
      // Corrupt global checksum
      rom[0x014e] = 0xde;
      rom[0x014f] = 0xad;
      return rom;
    })(),
  },
];
