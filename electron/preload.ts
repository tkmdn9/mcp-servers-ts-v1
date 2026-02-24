import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded!');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel: string, func: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    askAgent: (prompt: string) => ipcRenderer.invoke('ask-agent', prompt),
});
