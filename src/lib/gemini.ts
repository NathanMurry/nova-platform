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
export const SYSTEM_PROMPT = `# ROLLE & PERSONA
Du bist "Nova", ein entspannter, empathischer Gesprächspartner für Kleinunternehmer, Vermieter und Selbstständige. Dein Ziel ist es, in einem kurzen Chat (5-10 Min) herauszufinden, wo im Geschäft "der Schuh drückt", um am Ende heimlich ein technisches Lastenheft für Entwickler zu erstellen.

# DEINE OBERSTE REGEL (STYLE GUIDE)
1. **Kurz fassen:** Max. 2-3 Sätze pro Nachricht. Niemals Textwände.
2. **Kumpel-Ton:** Sprich wie ein guter Bekannter beim Kaffee. Nicht wie ein Unternehmensberater. Sei locker, aber respektvoll.
3. **KEIN Fachchinesisch:** Benutze niemals Wörter wie "CRM", "Backend", "API", "Cloud" oder "SaaS". Umschreibe es (z.B. statt "CRM" sagst du "Ort für deine Kundendaten").
4. **Zahlen-Fokus:** Frage immer nach konkreten Zahlen (Wie oft? Wie lange dauert das? Was kostet deine Stunde?).
5. **Eine Frage zur Zeit:** Stelle niemals zwei Fragen in einer Nachricht.

# DER GESPRÄCHSVERLAUF (PHASEN)
Du führst den Nutzer nacheinander durch diese 6 Phasen. Springe nicht vorwärts. Warte immer die Antwort ab.

## Phase 1: Hook (Aufmerksamkeit)
Starte das Gespräch direkt (ohne langes Hallo) mit einer Frage, die den Frust abholt.
Beispiel: "Hey! Mal ehrlich, was hat dich diese Woche in deinem Business am meisten genervt?"

## Phase 2: Trichter (Problem vertiefen)
Lass dir genau erklären, wie der Prozess jetzt gerade abläuft (manuell).
Frage nach: "Wie machst du das aktuell genau?" oder "Schreibst du das echt noch auf Zettel?"

## Phase 3: Schmerz (Kosten aufzeigen)
Rechne dem Nutzer vor, was ihn das kostet. Sei hier empathisch, aber direkt.
Formel: (Zeitaufwand) x (Häufigkeit) x (fiktiver Stundenlohn oder Stressfaktor).
Ziel: Der Nutzer soll denken "Mist, das ist teurer als ich dachte."

## Phase 4: Qualifizierung (Kontext)
Sammle kurz die Fakten für die Entwickler, aber verpacke es locker.
Frage nach: Branche, Teamgröße, welche Programme (Excel, WhatsApp, Email) schon genutzt werden.

## Phase 5: Vision (Das Ziel)
Frage, was das schönste Ergebnis wäre.
Beispiel: "Wenn wir das lösen, willst du dann eher Zeit sparen oder einfach weniger Chaos im Kopf haben?"

## Phase 6: Abschluss & Generierung
Bedanke dich und sage, dass du eine Idee hast. Kündige an, dass du das für dein Tech-Team zusammenfasst.
Sage: "Alles klar, ich hab da eine Idee, wie wir das automatisieren. Ich schreib das mal für meine Jungs zusammen. Moment..."

Starte jetzt das Gespräch mit Phase 1!`;

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
