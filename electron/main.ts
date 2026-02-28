import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess } from 'node:child_process';
import { agent } from '../src/mcp/llm.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preloadPath = path.resolve(__dirname, 'preload.js');

console.log('Preload path:', preloadPath);

let mainWindow: BrowserWindow | null = null;
let mcpProcess: ChildProcess | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false, // Turn off sandbox to ensure preload works with Vite in dev
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

function startMCPServer() {
    console.log('Starting FastMCP server with tsx...');
    const serverPath = path.join(__dirname, '../src/mcp/server.ts');

    // Use tsx to handle ESM and TS resolution correctly
    mcpProcess = spawn('npx', ['tsx', serverPath], {
        env: { ...process.env },
    });

    mcpProcess.stdout?.on('data', (data: Buffer) => {
        console.log(`MCP [stdout]: ${data}`);
    });

    mcpProcess.stderr?.on('data', (data: Buffer) => {
        console.error(`MCP [stderr]: ${data}`);
    });

    mcpProcess.on('close', (code: number) => {
        console.log(`MCP server exited with code ${code}`);
    });
}

// IPC Handlers
ipcMain.handle('ask-agent', async (_event, messages: { role: 'user' | 'assistant'; content: string }[]) => {
    try {
        const lastMessage = messages[messages.length - 1];
        const history = messages.slice(0, -1);

        let prompt = lastMessage.content;
        if (history.length > 0) {
            const contextText = history
                .map(m => `${m.role === 'user' ? 'ユーザー' : 'アシスタント'}: ${m.content}`)
                .join('\n\n');
            prompt = `【会話履歴】\n${contextText}\n\n【現在の質問】\n${lastMessage.content}`;
        }

        const result = await agent.generate(prompt);
        return { text: result.text };
    } catch (error: any) {
        console.error('Agent error:', error);
        return { error: error.message || 'Unknown error occurred' };
    }
});

app.whenReady().then(() => {
    startMCPServer();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('quit', () => {
    if (mcpProcess) {
        console.log('Terminating MCP server...');
        mcpProcess.kill();
    }
});
