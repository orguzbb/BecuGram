import path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  detectedMimeType?: string;
  reason?: string;
}

// Dangerous executable and script signatures
const EXECUTABLE_SIGNATURES = [
  { name: 'Windows PE / DOS Executable (MZ)', bytes: [0x4d, 0x5a] },
  { name: 'Linux ELF Binary', bytes: [0x7f, 0x45, 0x4c, 0x46] },
  { name: 'Java Class / Mach-O Fat', bytes: [0xca, 0xfe, 0xba, 0xbe] },
  { name: 'Mach-O 64-bit (Little Endian)', bytes: [0xcf, 0xfa, 0xed, 0xfe] },
  { name: 'Mach-O 64-bit (Big Endian)', bytes: [0xfe, 0xed, 0xfa, 0xcf] },
  { name: 'Shell Script Shebang (#!)', bytes: [0x23, 0x21] },
];

// Dangerous file extensions blacklist
export const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.msi', '.dll', '.com', '.vbs', '.ps1', '.scr',
  '.pif', '.jar', '.apk', '.bin', '.run', '.appimage', '.deb', '.rpm', '.iso',
  '.php', '.phtml', '.php3', '.php4', '.php5', '.phps', '.cgi', '.pl', '.py',
  '.asp', '.aspx', '.jsp', '.jspx', '.htm', '.html', '.xhtml', '.svgz'
]);

function bufferStartsWith(buffer: Buffer, bytes: number[]): boolean {
  if (buffer.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i++) {
    if (buffer[i] !== bytes[i]) return false;
  }
  return true;
}

/**
 * Validates file buffer against magic bytes and detects content type
 */
export function validateFileContent(
  buffer: Buffer,
  originalname: string,
  claimedMimeType?: string
): FileValidationResult {
  if (!buffer || buffer.length === 0) {
    return { isValid: false, reason: 'File buffer is empty.' };
  }

  const ext = path.extname(originalname).toLowerCase();

  // 1. Extension check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      reason: `Forbidden file extension: ${ext} is blocked for security reasons.`,
    };
  }

  // 2. Immediate check for dangerous executable binary signatures
  for (const sig of EXECUTABLE_SIGNATURES) {
    if (bufferStartsWith(buffer, sig.bytes)) {
      return {
        isValid: false,
        reason: `Dangerous binary detected: Contains ${sig.name} signature.`,
      };
    }
  }

  // Check for dangerous script tags in first 512 bytes
  const headerText = buffer.subarray(0, Math.min(buffer.length, 512)).toString('utf-8').toLowerCase();
  if (
    headerText.includes('<?php') ||
    headerText.includes('<script') ||
    headerText.includes('<%') ||
    headerText.includes('<!doctype html') ||
    headerText.includes('<html')
  ) {
    return {
      isValid: false,
      reason: 'Executable web script or HTML tags detected in uploaded content.',
    };
  }

  // 3. MIME category verification
  const isImageClaim = claimedMimeType?.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico'].includes(ext);
  const isAudioClaim = claimedMimeType?.startsWith('audio/') || ['.mp3', '.ogg', '.wav', '.webm', '.aac', '.m4a'].includes(ext);
  const isVideoClaim = claimedMimeType?.startsWith('video/') || ['.mp4', '.webm', '.mov', '.mkv', '.avi'].includes(ext);

  // PNG
  if (bufferStartsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { isValid: true, detectedMimeType: 'image/png' };
  }

  // JPEG / JPG
  if (bufferStartsWith(buffer, [0xff, 0xd8, 0xff])) {
    return { isValid: true, detectedMimeType: 'image/jpeg' };
  }

  // GIF
  if (bufferStartsWith(buffer, [0x47, 0x49, 0x46, 0x38])) {
    return { isValid: true, detectedMimeType: 'image/gif' };
  }

  // WebP / RIFF container
  if (bufferStartsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && buffer.length >= 12) {
    const subType = buffer.subarray(8, 12).toString('ascii');
    if (subType === 'WEBP') {
      return { isValid: true, detectedMimeType: 'image/webp' };
    }
    if (subType === 'WAVE') {
      return { isValid: true, detectedMimeType: 'audio/wav' };
    }
  }

  // BMP
  if (bufferStartsWith(buffer, [0x42, 0x4d])) {
    return { isValid: true, detectedMimeType: 'image/bmp' };
  }

  // WebM / Matroska
  if (bufferStartsWith(buffer, [0x1a, 0x45, 0xdf, 0xa3])) {
    const mime = isAudioClaim ? 'audio/webm' : 'video/webm';
    return { isValid: true, detectedMimeType: mime };
  }

  // MP4 / MOV / M4A (ftyp box at byte 4)
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    const mime = isAudioClaim ? 'audio/mp4' : 'video/mp4';
    return { isValid: true, detectedMimeType: mime };
  }

  // Ogg container
  if (bufferStartsWith(buffer, [0x4f, 0x67, 0x67, 0x53])) {
    return { isValid: true, detectedMimeType: isVideoClaim ? 'video/ogg' : 'audio/ogg' };
  }

  // MP3 ID3 or sync word
  if (bufferStartsWith(buffer, [0x49, 0x44, 0x33]) || (buffer.length >= 2 && buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
    return { isValid: true, detectedMimeType: 'audio/mpeg' };
  }

  // PDF Document
  if (bufferStartsWith(buffer, [0x25, 0x50, 0x44, 0x46])) {
    return { isValid: true, detectedMimeType: 'application/pdf' };
  }

  // ZIP-based document (ZIP, DOCX, XLSX, PPTX)
  if (bufferStartsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) || bufferStartsWith(buffer, [0x50, 0x4b, 0x05, 0x06])) {
    let mime = 'application/zip';
    if (ext === '.docx') mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (ext === '.xlsx') mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.pptx') mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    return { isValid: true, detectedMimeType: mime };
  }

  // If user claimed it was an image or audio/video, but magic bytes failed to match any known media header:
  if (isImageClaim) {
    return {
      isValid: false,
      reason: 'Claimed image file does not contain valid image header/magic bytes.',
    };
  }

  // For arbitrary text/data documents: check for null bytes or binary corruption
  const hasNullBytes = buffer.subarray(0, Math.min(buffer.length, 512)).includes(0x00);
  if (!hasNullBytes || ['.txt', '.json', '.csv', '.xml', '.md'].includes(ext)) {
    return { isValid: true, detectedMimeType: claimedMimeType || 'text/plain' };
  }

  // Default binary document (e.g. custom data)
  return { isValid: true, detectedMimeType: claimedMimeType || 'application/octet-stream' };
}
