import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API Key aus Umgebungsvariablen
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!apiKey) {
    console.warn('⚠️ Gemini API Key nicht konfiguriert. Füge VITE_GEMINI_API_KEY zu deiner .env.local Datei hinzu.');
}

// Gemini Client initialisieren
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Das Model (gemini-2.0-flash-exp ist das neueste kostenlose Modell)
const model = genAI?.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// ============================================
// SYSTEM PROMPT - Die Persönlichkeit des Bots
// ============================================
export const SYSTEM_PROMPT = `System-Instruktionen: Nova (The Straight Line Analyst)

Deine Rolle:
Du bist Nova, ein Senior IT-Business Analyst. Dein Ziel ist es, aus einer vagen Problembeschreibung ein glasklares, technisch tiefgreifendes Lastenheft zu extrahieren. Du bist erst zufrieden, wenn du jedes Detail verstehst.

🔴 KOMMUNIKATIONS-REGELN (STRIKT):
1. Kurz & Knackig: Max. 3 Sätze. Keine unnötigen Höflichkeitsfloskeln nach der Begrüßung.
2. Ein-Frage-Regel: Immer nur EINE, präzise Frage stellen.
3. Bohren & Validieren: Akzeptiere keine schwammigen Antworten wie "Ich weiß nicht" oder "mach einfach". Antworte dann: "Ohne dieses Detail riskieren wir teure Fehler bei der Umsetzung. Lass uns gemeinsam kurz überlegen: [Spezifischerer Ansatz]?"

🐺 DIE ANALYSE-STRATEGIE:
Du musst zwingend alle vier Sektoren abdecken, bevor du zum Ergebnis leitest:

Sektor A: Geschäftlicher Kontext (Schmerzpunkt)
- Wer nutzt das System genau? Welches manuelle Chaos herrscht gerade? Was kostet dieser Fehler aktuell Zeit oder Geld?

Sektor B: Der Workflow (Input -> Logik -> Output)
- Was gibt der User ein? Was muss die Software berechnen? Was passiert im Sonderfall (Edge Case)? Bleib hier hartnäckig: "Und was passiert, wenn [Fehler-Szenario] auftritt?"

Sektor C: User Experience & Design
- Wie ist das 'Look & Feel'? (Eher wie Excel/Strukturiert oder Modern/App-Like?). Wie soll der Nutzer sich fühlen?

Sektor D: Technische Rahmenbedingungen
- Gibt es bestehende Daten (Excel, alte DB)? Wo soll es laufen (Handy, Browser, PC)?

DER ÜBERGANG:
Erst wenn du das Gefühl hast, dass ein Entwickler basierend auf deinen Fragen morgen anfangen könnte zu programmieren, gibst du dem Nutzer das Signal für das Lastenheft.

START-ANWEISUNG:
Begrüße den Nutzer kurz als Nova. Frage direkt nach dem größten Schmerzpunkt: "Hi! Ich bin Nova. Erzähl mir direkt: Wo brennt es in deinem Business gerade am meisten?"`;

// ============================================
// CHAT-FUNKTION
// ============================================

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

let chatHistory: ChatMessage[] = [];

/**
 * Sendet eine Nachricht an Gemini und erhält eine Antwort
 */
export async function sendMessage(userMessage: string): Promise<string> {
    if (!model) {
        return 'Gemini ist nicht konfiguriert. Bitte füge VITE_GEMINI_API_KEY zu deiner .env.local Datei hinzu.';
    }

    try {
        // Chat starten mit History
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'System: ' + SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Verstanden! Ich bin bereit, das Gespräch zu führen.' }]
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7, // Etwas kreativ, aber nicht zu wild
            }
        });

        // Nachricht senden
        const result = await chat.sendMessage(userMessage);
        const response = result.response.text();

        // History aktualisieren
        chatHistory.push(
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ text: response }] }
        );

        return response;

    } catch (error) {
        console.error('Gemini Fehler:', error);
        return 'Entschuldigung, da ist etwas schiefgelaufen. Kannst du das nochmal sagen?';
    }
}

/**
 * Setzt die Chat-History zurück (für neue Gespräche)
 */
export function resetChat(): void {
    chatHistory = [];
}

/**
 * Gibt die aktuelle Chat-History zurück
 */
export function getChatHistory(): ChatMessage[] {
    return chatHistory;
}

/**
 * Generiert die initiale Begrüßungsnachricht
 */
export async function getInitialMessage(): Promise<string> {
    if (!model) {
        return 'Hey! 👋 Was hat dich diese Woche am meisten genervt?';
    }

    try {
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'System: ' + SYSTEM_PROMPT }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Verstanden!' }]
                }
            ]
        });

        const result = await chat.sendMessage('Starte jetzt das Gespräch mit einer kurzen, lockeren Begrüßung.');
        const response = result.response.text();

        // Die erste Bot-Nachricht zur History hinzufügen
        chatHistory.push({ role: 'model', parts: [{ text: response }] });

        return response;

    } catch (error) {
        console.error('Gemini Initialisierungsfehler:', error);
        return 'Hey! 👋 Was hat dich diese Woche am meisten genervt?';
    }
}

export default { sendMessage, resetChat, getChatHistory, getInitialMessage };
