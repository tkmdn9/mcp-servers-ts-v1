import { contextBridge, ipcRenderer } from 'electron';

console.log('Preload script loaded!');

contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (channel: string, data: any) => {
        ipcRenderer.send(channel, data);
    },
    onMessage: (channel: string, func: (...args: any[]) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
    },
    askAgent: (messages: { role: 'user' | 'assistant'; content: string }[]) =>
        ipcRenderer.invoke('ask-agent', messages),
});
