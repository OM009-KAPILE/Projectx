import { StorageService } from '../../src/services/storage.service';

describe('Storage Security & File Validation Unit Tests', () => {
  it('should block dangerous and executable file extensions', () => {
    const dangerousFiles = [
      'trojan.exe',
      'script.sh',
      'payload.bat',
      'command.cmd',
      'backdoor.php',
      'app.jsp',
      'server.asp',
      'service.aspx',
      'script.vbs',
      'library.dll',
      'firmware.bin',
      'package.jar',
      'web.war',
      'malicious.html',
      'page.htm',
      'inject.js',
      'run.scr',
    ];

    for (const filename of dangerousFiles) {
      expect(() => {
        StorageService.validateFile(filename, 1024);
      }).toThrow('blocked for security reasons');
    }
  });

  it('should reject file sizes larger than 25MB', () => {
    const oversized = 26 * 1024 * 1024; // 26MB
    expect(() => {
      StorageService.validateFile('dataset.csv', oversized);
    }).toThrow('exceeds the 25MB limit');
  });

  it('should allow valid student research, project, and code assets under 25MB', () => {
    const validFiles = [
      { name: 'report.pdf', size: 5 * 1024 * 1024 },
      { name: 'architecture.png', size: 2 * 1024 * 1024 },
      { name: 'photo.jpg', size: 1 * 1024 * 1024 },
      { name: 'dataset.csv', size: 10 * 1024 * 1024 },
      { name: 'source.zip', size: 20 * 1024 * 1024 },
      { name: 'model_train.py', size: 64 * 1024 },
      { name: 'experiment.ipynb', size: 512 * 1024 },
      { name: 'contract.docx', size: 1 * 1024 * 1024 },
      { name: 'schema.json', size: 128 * 1024 },
      { name: 'component.tsx', size: 32 * 1024 },
      { name: 'app.dart', size: 16 * 1024 },
    ];

    for (const file of validFiles) {
      expect(() => {
        StorageService.validateFile(file.name, file.size);
      }).not.toThrow();
    }
  });

  it('should throw an error if filename is missing or empty', () => {
    expect(() => {
      StorageService.validateFile('', 1024);
    }).toThrow('File name is required');
  });
});
