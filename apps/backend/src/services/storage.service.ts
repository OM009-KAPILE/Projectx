import fs from 'fs';
import path from 'path';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const DANGEROUS_EXTENSIONS = new Set([
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.vbs',
  '.php',
  '.jsp',
  '.asp',
  '.aspx',
  '.cgi',
  '.pl',
  '.dll',
  '.bin',
  '.jar',
  '.war',
  '.html',
  '.htm',
  '.xhtml',
  '.js',
  '.mjs',
  '.scr',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.zip',
  '.tar',
  '.gz',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.txt',
  '.csv',
  '.json',
  '.md',
  '.py',
  '.ipynb',
  '.cpp',
  '.c',
  '.h',
  '.hpp',
  '.rs',
  '.go',
  '.ts',
  '.tsx',
  '.jsx',
  '.dart',
  '.yaml',
  '.yml',
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export class StorageService {
  private static uploadDir = path.resolve(config.storage.uploadDir);

  public static init() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validates file safety, extension, and file size
   */
  public static validateFile(originalName: string, bufferSize: number): void {
    if (!originalName) {
      throw new AppError('File name is required.', 400);
    }

    if (bufferSize > MAX_FILE_SIZE) {
      throw new AppError('File size exceeds the 25MB limit.', 400);
    }

    const ext = path.extname(originalName).toLowerCase();

    if (DANGEROUS_EXTENSIONS.has(ext)) {
      throw new AppError(`File type "${ext}" is blocked for security reasons.`, 400);
    }

    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new AppError(`File extension "${ext}" is not permitted.`, 400);
    }
  }

  public static async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    subFolder: string = 'general'
  ): Promise<string> {
    this.init();

    // 1. Validate file extension and size
    this.validateFile(originalName, fileBuffer.length);

    // 2. Sanitize subfolder to prevent path traversal
    const safeSubFolder = path.basename(subFolder).replace(/[^a-zA-Z0-9_-]/g, '');
    const folder = path.join(this.uploadDir, safeSubFolder);

    // Verify folder resides strictly inside uploadDir
    if (!folder.startsWith(this.uploadDir)) {
      throw new AppError('Invalid storage path.', 400);
    }

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }

    // 3. Generate secure random filename
    const ext = path.extname(originalName).toLowerCase();
    const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
    const filename = `${Date.now()}_${sanitizedBase}_${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(folder, filename);

    await fs.promises.writeFile(filePath, fileBuffer);
    return `/uploads/${safeSubFolder}/${filename}`;
  }

  public static async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl || !fileUrl.startsWith('/uploads/')) return false;

      // Prevent directory traversal via path.resolve checks
      const relativePath = fileUrl.replace('/uploads/', '');
      const fullPath = path.resolve(this.uploadDir, relativePath);

      if (!fullPath.startsWith(this.uploadDir)) {
        return false;
      }

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
