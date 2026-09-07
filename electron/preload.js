const { contextBridge } = require('electron');

// Expose safe desktop platform metadata to the React renderer
contextBridge.exposeInMainWorld('projectxDesktop', {
  isDesktop: true,
  platform: process.platform,
  version: process.versions.electron,
});
