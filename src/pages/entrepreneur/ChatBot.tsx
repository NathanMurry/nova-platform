import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowLeft, Save, CheckCircle, Sparkles, FileText, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendMessage, getInitialMessage, resetChat } from '../../lib/gemini';
import { generateLastenheft, saveLastenheft } from '../../lib/lastenheft';
import type { ConversationMessage } from '../../lib/database.types';

interface Message {
    type: 'bot' | 'user';
    content: string;
}

const ChatBot = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Supabase State
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Lastenheft State
    const [isGeneratingLastenheft, setIsGeneratingLastenheft] = useState(false);
    const [showLastenheftButton, setShowLastenheftButton] = useState(false);

    // Initialisierung: Gemini Begrüßung holen
    useEffect(() => {
        const initChat = async () => {
            // Check for passed initial message from landing page
            const state = location.state as { initialMessage?: string } | null;

            setIsLoading(true);
            resetChat(); // Vorherige Gespräche zurücksetzen

            try {
                const greeting = await getInitialMessage();
                setMessages([{ type: 'bot', content: greeting }]);

                // If we have an initial message, send it immediately after a short delay
                if (state?.initialMessage) {
                    setTimeout(() => {
                        handleSend(state.initialMessage);
                        // Clear state history
                        window.history.replaceState({}, document.title);
                    }, 500);
                }
            } catch (err) {
                setMessages([{
                    type: 'bot',
                    content: 'Hey! 👋 Was hat dich diese Woche am meisten genervt?'
                }]);
            }

            setIsLoading(false);
        };

        // Only run once on mount
        initChat();
    }, []);

    // Supabase Konversation erstellen
    useEffect(() => {
        const createConversation = async () => {
            if (messages.length === 0) return;

            try {
                const { data, error } = await supabase
                    .from('conversations')
                    .insert({
                        entrepreneur_id: null,
                        messages: messages.map(msg => ({
                            type: msg.type,
                            content: msg.content,
                            timestamp: new Date().toISOString()
                        })),
                        status: 'active'
                    })
                    .select()
                    .single();

                if (error) {
                    console.warn('Konversation konnte nicht erstellt werden:', error.message);
                } else if (data) {
                    setConversationId(data.id);
                    console.log('✅ Neue Konversation erstellt:', data.id);
                }
            } catch (err) {
                console.warn('Supabase nicht verfügbar');
            }
        };

        if (messages.length === 1 && !conversationId) {
            createConversation();
        }
    }, [messages, conversationId]);

    // Speichere Nachrichten in Supabase
    const saveMessages = useCallback(async (newMessages: Message[]) => {
        if (!conversationId) return;

        setIsSaving(true);
        try {
            const formattedMessages: ConversationMessage[] = newMessages.map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('conversations')
                .update({ messages: formattedMessages })
                .eq('id', conversationId);

            if (!error) {
                setLastSaved(new Date());
            }
        } catch (err) {
            console.warn('Speichern fehlgeschlagen');
        } finally {
            setIsSaving(false);
        }
    }, [conversationId]);

    // Auto-save bei neuen Nachrichten
    useEffect(() => {
        if (messages.length > 1 && conversationId) {
            saveMessages(messages);
        }
    }, [messages, saveMessages, conversationId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Nachricht senden mit Gemini
    const handleSend = async (message?: string) => {
        const messageToSend = message || inputValue;
        if (!messageToSend.trim() || isTyping) return;

        // User-Nachricht hinzufügen
        setMessages(prev => [...prev, { type: 'user', content: messageToSend }]);
        setInputValue('');
        setIsTyping(true);

        try {
            // Gemini Antwort holen
            const response = await sendMessage(messageToSend);
            setMessages(prev => [...prev, { type: 'bot', content: response }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                type: 'bot',
                content: 'Entschuldigung, da ist etwas schiefgelaufen. Kannst du das nochmal sagen?'
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Lastenheft generieren
    const handleGenerateLastenheft = async () => {
        if (!conversationId || messages.length < 4) return;

        setIsGeneratingLastenheft(true);

        try {
            // Nachrichten für die Generierung vorbereiten
            const conversationMessages: ConversationMessage[] = messages.map(msg => ({
                type: msg.type,
                content: msg.content,
                timestamp: new Date().toISOString()
            }));

            // Lastenheft generieren
            const lastenheft = await generateLastenheft(conversationMessages);

            if (lastenheft) {
                // In Supabase speichern
                const lastenheftId = await saveLastenheft(conversationId, lastenheft);

                if (lastenheftId) {
                    // Zur Lastenheft-Ansicht navigieren
                    navigate(`/lastenheft/${lastenheftId}`);
                } else {
                    setMessages(prev => [...prev, {
                        type: 'bot',
                        content: 'Das Lastenheft konnte leider nicht gespeichert werden. Bitte versuche es später erneut.'
                    }]);
                }
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: 'Das Lastenheft konnte nicht erstellt werden. Lass uns noch etwas mehr über dein Problem sprechen!'
                }]);
            }
        } catch (err) {
            console.error('Lastenheft-Fehler:', err);
            setMessages(prev => [...prev, {
                type: 'bot',
                content: 'Etwas ist schiefgelaufen. Bitte versuche es später erneut.'
            }]);
        } finally {
            setIsGeneratingLastenheft(false);
        }
    };

    // Zeige Lastenheft-Button nach genug Nachrichten
    useEffect(() => {
        if (messages.length >= 10) {
            setShowLastenheftButton(true);
        }
    }, [messages]);

    // Quick Suggestions basierend auf Konversationsstand
    const getQuickSuggestions = (): string[] => {
        if (messages.length <= 1) {
            return [
                '⏰ Zu viel Bürokram',
                '📞 Kundenanfragen nerven',
                '📋 Hab keinen Überblick',
                '🤷 Weiß noch nicht genau'
            ];
        }
        if (messages.length <= 3) {
            return [
                '📄 Rechnungen schreiben',
                '📅 Termine koordinieren',
                '📧 E-Mails beantworten',
                '💬 Sag ich dir gleich'
            ];
        }
        if (messages.length <= 5) {
            return [
                '👍 Das reicht erstmal',
                '➕ Da gibt\'s noch mehr'
            ];
        }
        return [];
    };

    const suggestions = getQuickSuggestions();

    if (isLoading) {
        return (
            <div className="flex flex-col h-screen bg-gradient-to-b from-amber-50 to-white items-center justify-center">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                    <span className="text-lg text-gray-600">Nova wird geladen...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-amber-50 to-white">
            {/* Header */}
            <header className="bg-white border-b border-amber-100 px-6 py-4 flex items-center shadow-sm z-10">
                <button
                    onClick={() => navigate('/')}
                    className="mr-4 p-2 hover:bg-amber-50 rounded-full transition-colors text-gray-500"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Nova AI</h1>
                        <p className="text-sm text-green-600 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            Powered by Gemini
                        </p>
                    </div>
                </div>
                {/* Speicher-Status */}
                <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
                    {isSaving ? (
                        <>
                            <Save className="w-3 h-3 animate-pulse" />
                            <span>Speichert...</span>
                        </>
                    ) : lastSaved ? (
                        <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span>Gespeichert</span>
                        </>
                    ) : null}
                </div>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`
                                    max-w-[85%] rounded-2xl px-5 py-4 shadow-sm
                                    ${msg.type === 'user'
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                    }
                                `}
                            >
                                <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-400">Nova denkt nach...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && !isTyping && (
                <div className="px-6 py-3 bg-white border-t border-amber-50">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(suggestion)}
                                    className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lastenheft Button */}
            {showLastenheftButton && !isTyping && !isGeneratingLastenheft && (
                <div className="px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={handleGenerateLastenheft}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg active:scale-[0.98]"
                        >
                            <FileText className="w-5 h-5" />
                            Analyse abschließen & Lastenheft erstellen
                        </button>
                        <p className="text-center text-sm text-green-600 mt-2">
                            Wir fassen alles zusammen. Gib uns kurz deine E-Mail, damit wir es dir schicken können.
                        </p>
                    </div>
                </div>
            )}

            {/* Lastenheft wird generiert */}
            {isGeneratingLastenheft && (
                <div className="px-6 py-6 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-100">
                    <div className="max-w-2xl mx-auto flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                        <span className="text-amber-700 font-medium">Lastenheft wird erstellt...</span>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="bg-white border-t border-amber-100 p-4 shadow-lg">
                <div className="max-w-2xl mx-auto">
                    <div className="relative flex items-center gap-3">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                            placeholder="Schreib mir einfach..."
                            disabled={isTyping}
                            className="flex-1 pl-5 pr-4 py-4 rounded-full border-2 border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition-all text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
