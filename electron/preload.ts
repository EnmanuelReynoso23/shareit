const { contextBridge, ipcRenderer } = require('electron');

// Define the API that will be exposed to the renderer process
export interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  platform: NodeJS.Platform;
  isElectron: boolean;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI: ElectronAPI = {
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  platform: process.platform,
  isElectron: true,
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Declare global interface for TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}