import { useEffect, useRef, useState } from 'react';
import { Send, Trash2, Mic, MicOff, Volume2, Bot, User } from 'lucide-react';
import { sendChat, chatHistory, clearChat } from '../api/endpoints';
import { Card, Button, Spinner, EmptyState, PageHeader } from '../components/ui';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Assistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatHistory()
      .then((data) => {
        setMessages(
          data.map((m) => ({
            role: m.role,
            content: m.content,
            time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }))
        );
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  };

  const toggleMic = () => {
    if (!SpeechRecognition) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setLoading(true);
    try {
      const { reply } = await sendChat(message);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, something went wrong: ${err.response?.data?.message || 'try again'}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm('Clear all chat history?')) return;
    await clearChat().catch(() => {});
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)]">
      <PageHeader
        title="Assistant"
        subtitle="Ask anything about your studies — type or talk."
        action={
          messages.length > 0 && (
            <Button variant="ghost" onClick={handleClear}>
              <Trash2 size={15} /> Clear chat
            </Button>
          )
        }
      />

      <Card className="flex-1 flex flex-col overflow-hidden !p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {historyLoading ? (
            <Spinner />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={Bot}
              title="Hi! I'm your study buddy"
              hint="Ask me to explain a topic, summarize notes, quiz you, or plan your week. Try the mic to talk."
            />
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.role === 'user' ? 'bg-stone-200 text-stone-600' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div className={`max-w-[75%] ${m.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block text-left px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-amber-700 text-white rounded-tr-sm'
                        : 'bg-stone-100 text-stone-800 rounded-tl-sm'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && (
                    <button
                      onClick={() => speak(m.content)}
                      className="ml-2 text-stone-400 hover:text-amber-700"
                      title="Read aloud"
                    >
                      <Volume2 size={14} className={speaking ? 'text-amber-700' : ''} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Bot size={15} className="text-amber-800" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-stone-100 text-sm text-stone-500">
                thinking…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-stone-200 p-3">
          <div className="flex items-end gap-2">
            {SpeechRecognition && (
              <button
                onClick={toggleMic}
                className={`p-2.5 rounded-lg border ${
                  listening
                    ? 'bg-red-50 border-red-300 text-red-600'
                    : 'border-stone-300 text-stone-500 hover:bg-stone-50'
                }`}
                title={listening ? 'Stop listening' : 'Talk to assistant'}
              >
                {listening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              rows={1}
              placeholder={listening ? 'Listening…' : 'Type your question…'}
              className="flex-1 px-3 py-2.5 border border-stone-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-600/30 focus:border-amber-600"
            />
            <Button onClick={() => send()} disabled={loading || !input.trim()} className="!px-3">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
