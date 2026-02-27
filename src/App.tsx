import { Chat } from './components/Chat.tsx'

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            Enterprise MCP Bridge
          </h1>
          <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
            AI-Powered Gateway
            <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
            Redmine & ServiceNow
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-slate-600 font-mono uppercase">System Node</div>
          <div className="text-xs text-blue-400 font-mono">v1.2.0-stable</div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-160px)]">
        {/* Left Column: Stats & Tools */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          {/* Status Card */}
          <section className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-2xl">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></span>
              Live Status
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/30">
                <span className="text-slate-400 text-sm">MCP Engine</span>
                <span className="text-emerald-400 font-mono text-xs font-bold">ACTIVE</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-xl border border-slate-800/30">
                <span className="text-slate-400 text-sm">Mastra Agent</span>
                <span className="text-blue-400 font-mono text-xs font-bold">READY</span>
              </div>
            </div>
          </section>

          {/* Tools Card */}
          <section className="bg-slate-900/50 backdrop-blur-xl p-5 rounded-2xl border border-slate-800/50 shadow-2xl flex-1 overflow-hidden flex flex-col">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registry Tools</h2>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {[
                { name: 'getRedmineIssues', color: 'blue' },
                { name: 'createRedmineIssue', color: 'blue' },
                { name: 'getServiceNowIncidents', color: 'emerald' },
                { name: 'createServiceNowIncident', color: 'emerald' },
                { name: 'getServiceNowRecords', color: 'emerald' },
                { name: 'createServiceNowRecord', color: 'emerald' }
              ].map(tool => (
                <div key={tool.name} className="group cursor-default">
                  <div className={`p-3 bg-slate-950/50 rounded-xl border border-slate-800/20 group-hover:border-${tool.color}-500/30 transition-all flex items-center gap-3`}>
                    <div className={`w-1.5 h-1.5 rounded-full bg-${tool.color}-500/50 group-hover:bg-${tool.color}-400 transition-colors`}></div>
                    <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors">{tool.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Chat Interaction */}
        <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
          <section className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl flex-1 flex flex-col overflow-hidden relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 opacity-30"></div>
            <div className="p-4 border-b border-slate-800/50 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-200">Mastra Brain Terminal</h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
                <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <Chat />
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-6 flex justify-between items-center text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em]">
        <span>&copy; 2026 Antigravity Systems</span>
        <div className="flex gap-4">
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Documentation</span>
          <span className="hover:text-slate-400 cursor-pointer transition-colors">Security Audit</span>
        </div>
      </footer>
    </div>
  )
}

export default App
