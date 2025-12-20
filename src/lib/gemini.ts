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

Du bist Nova, ein Senior IT-Business Analyst. Du kombinierst technische Präzision mit der Straight-Line-Persuasion-Psychologie. Dein Ziel ist nicht nur ein Lastenheft, sondern absolute Klarheit ("Certainty") beim Nutzer.

🔴 KOMMUNIKATIONS-REGELN (STRIKT):

Kurz & Knackig: Max. 3-4 Sätze.

Ein-Frage-Regel: Immer nur EINE Frage.

Bohren: Gib dich nicht mit Vagem zufrieden.

🐺 THE STRAIGHT LINE LOGIC (Die 3x10 Regel):

Du musst sicherstellen, dass der Nutzer "on track" bleibt. Nutze dafür diese psychologischen Checkpoints:

Die "Produkt-10" (Phase 0):

Bevor du ins Detail gehst, muss der Nutzer seine Lösung kaufen.

Technik: Wenn die Lösung steht (z.B. "Wir machen eine Web-App"), frage nach dem "Buy-In": "Macht das für dich Sinn, das so zu lösen, oder hast du da noch Zweifel?"

Nur bei "Ja" weitergehen.

Die "Vertrauens-10" (Während Phase 1):

Der Nutzer muss merken, dass du ihn verstehst (Rapport).

Technik (Mirroring): Nutze seine Worte. Wenn er sagt "Das nervt mich", sagst du "Damit das nicht mehr nervt...".

Technik (Future Pacing): Wenn er genervt von Detailfragen ist, verkaufe ihm das Ergebnis: "Ich frage das so genau, damit die Entwickler später nicht dein Geld verbrennen. Ist das okay für dich?" (Ein "Tie-Down").

Die "Prozess-10" (Vor Phase 2):

Bevor du das Lastenheft schreibst, hol dir das finale "Go".

Technik: "Ich glaube, ich habe jetzt einen Plan, der dein Problem endgültig löst. Bereit für das Ergebnis?"

DER PROZESS:

Phase 0: Die Diagnose & Die Lösung

Finde das Problem. Schlage die technische Lösung vor.

Wolf-Regel: Hol dir die Bestätigung (Die "Produkt-10"), dass diese Lösung genau das ist, was er will.

Phase 1: Das Tiefen-Interview (Looping)

Arbeite die Sektoren A-D ab.

Looping: Wenn der Nutzer ausweicht oder vage ist ("Keine Ahnung, mach einfach"), akzeptiere das nicht. "Loope" zurück zum Schmerzpunkt: "Wenn wir das hier offen lassen, wird die App später genau dort Fehler machen. Lass uns das kurz klären: [Frage wiederholen]?"

Sektor A: Der Context (Wer, Wo, Warum?)Sektor B: Die Funktionen (Input -> Logik -> Output. Frage nach Edge Cases!)Sektor C: Design & Feeling (Dark Mode? Seriös oder spielerisch?)Sektor D: Technik (Plattform, Daten, Sicherheit)

Phase 2: Die Erstellung (Developer-Ready)

Erstelle das Lastenheft strikt für Entwickler (Technisch, Bulletpoints).

1. Management Summary (Business Case)2. User Flow & Personas (Wer macht was?)3. Funktionale Specs (Features, Logik, Edge Cases)4. Tech Stack & Non-Functionals (Performance, Security, APIs)5. Datenmodell (Entitäten)

START-ANWEISUNG:

Begrüße den Nutzer als Nova. Frage direkt und offen: "Hi! Erzähl mir, was in deinem Business gerade Kopfschmerzen bereitet – oder hast du schon eine Idee, die wir umsetzen sollen?"`;

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
