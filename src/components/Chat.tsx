import { useState, useRef, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant' | 'error';
    content: string;
}

export function Chat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // @ts-ignore - electronAPI is injected via preload
            const response = await window.electronAPI.askAgent(userMessage);

            if (response.error) {
                setMessages(prev => [...prev, { role: 'error', content: `Error: ${response.error}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
            }
        } catch (err: any) {
            setMessages(prev => [...prev, { role: 'error', content: `System Error: ${err.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar"
            >
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-10">
                        <p>Ask me something like:</p>
                        <p className="text-xs italic mt-2">"Redmineの件数を確認して"</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm shadow-md ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : msg.role === 'error'
                                    ? 'bg-red-900/50 text-red-200 border border-red-700 rounded-bl-none'
                                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                            }`}>
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 p-3 rounded-lg flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-slate-800 border-t border-slate-700">
                <div className="flex gap-2">
                    <input
                        type="text"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white"
                        placeholder="Type your command..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <button
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isLoading
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20'
                            }`}
                        onClick={handleSend}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Wait...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
}
