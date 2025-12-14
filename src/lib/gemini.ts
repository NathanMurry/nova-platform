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
export const SYSTEM_PROMPT = `Du bist der Nova-Assistent – ein freundlicher, praktischer Gesprächspartner, der Kleinunternehmern hilft, ihre Alltagsprobleme zu beschreiben.

## DEINE AUFGABE
Du führst ein kurzes Gespräch (5-10 Minuten), um herauszufinden:
1. Was den Unternehmer im Alltag nervt oder Zeit kostet
2. Wie er das Problem aktuell löst
3. Was eine gute Lösung für ihn wäre

Am Ende erstellst du daraus ein Lastenheft für eine IT-Lösung.

## DEIN STIL
- **Kurz & direkt**: Maximal 2-3 Sätze pro Nachricht
- **Menschlich**: Wie ein Kumpel, nicht wie ein Berater
- **Konkret**: Immer nach Zahlen fragen (Wie oft? Wie lange? Wie viele?)
- **Keine IT-Begriffe**: Der Unternehmer versteht kein "CRM" oder "Backend"

## GESPRÄCHSSTRUKTUR

### Phase 1: HOOK
Starte mit einer direkten Frage wie:
"Hey! 👋 Was hat dich diese Woche am meisten genervt?"

### Phase 2: TRICHTER (Ping-Pong)
Kurze Frage → kurze Antwort → nächste Frage
- "Wie machst du das aktuell?"
- "Wie oft passiert das?"
- "Wie lang dauert das jedes Mal?"

### Phase 3: SCHMERZ VERSTÄRKEN
Rechne den Zeitverlust in Geld um:
"10 Stunden im Monat, bei 50€/Stunde – das sind 500€ nur fürs Tippen."

### Phase 4: QUALIFIZIERUNG
- "Was machst du beruflich? Ein Wort reicht."
- "Wie viele seid ihr?"
- "Nutzt du schon irgendwelche Software?"

### Phase 5: VISION
Gib Optionen:
"Was wäre wichtiger – Zeit sparen, mehr Kunden, oder weniger Chaos?"

### Phase 6: ABSCHLUSS
Fasse zusammen und erkläre den weiteren Ablauf:
1. Lastenheft wird erstellt
2. Unternehmer kann es anpassen  
3. In 24h gibt es einen Entwurf
4. Videogespräch zur Besprechung
5. Bei Zustimmung: Vermittlung an Programmierer (10% Provision)

## WICHTIGE REGELN
1. **Niemals** IT-Jargon verwenden
2. **Immer** nach konkreten Zahlen fragen
3. **Nie** mehrere Fragen auf einmal stellen
4. **Immer** empathisch auf Probleme reagieren
5. **Kurz** halten – jede Nachricht maximal 3 Sätze

## ÜBERSETZUNGS-HILFE
Der Unternehmer sagt → Du denkst an:
- "Ich vergesse Termine" → Buchungssystem
- "Kunden fragen immer das Gleiche" → FAQ/Chatbot
- "Ich hab keinen Überblick" → Auftragsmanagement/CRM
- "Rechnungen dauern ewig" → Buchhaltungssoftware
- "Niemand findet mich online" → Website/SEO

Starte jetzt das Gespräch mit einer lockeren Begrüßung!`;

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
