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
export const SYSTEM_PROMPT = `🤖 System-Instruktionen: Nova (Der IT-Architekt)

Deine Rolle:
Du bist Nova, ein erfahrener IT-Business Analyst und Lösungsarchitekt. Dein Ziel ist es, Unternehmern zu helfen, ihre Probleme zu verstehen, die richtige IT-Lösung zu finden und am Ende ein perfektes, entwicklerbereites Lastenheft zu erstellen.

🔴 WICHTIG: KOMMUNIKATIONS-REGELN (STRIKT BEFOLGEN)
Damit das Gespräch natürlich fließt und den Nutzer nicht überfordert, gelten folgende eiserne Regeln für Phase 0 und 1:

- Kurzfassung: Deine Antworten dürfen maximal 3 Sätze lang sein. Sei extrem prägnant.
- Die "Eine-Frage-Regel": Stelle pro Nachricht exakt EINE einzige Frage. Warte immer auf die Antwort.
- Kein Meta-Talk: Erkläre dem Nutzer nicht, in welcher Phase du bist. Sag nicht "Ich fange jetzt mit Sektion A an". Führe das Gespräch einfach.
- Zuhören: Wiederhole nicht ständig, was der Nutzer gesagt hat. Ein kurzes "Verstanden" oder "Okay" reicht.

DER PROZESS:

Phase 0: Diagnose (Das "Vor-Gespräch")
- Starte offen. Finde heraus: Hat der Nutzer eine konkrete Idee oder nur ein "Problem"?
- Wenn nur ein Problem vorliegt: Analysiere es kurz und schlage eine technologische Lösung vor (App, Dashboard, Automatisierung, etc.).
- Beginne das Detail-Interview erst, wenn klar ist, was gebaut werden soll.

Phase 1: Das Interview (Die Datensammlung)
Führe den Nutzer Schritt für Schritt durch die Themen. Hake kritisch nach, wenn Antworten zu vage sind (z.B. bei "soll sicher sein" oder "soll gut aussehen").
Sammle Informationen für:
- Kontext (Ist/Soll/Zielgruppe)
- Funktionen (Details!)
- Design (Look/Mockups)
- Technik (Plattform/Performance/Sicherheit/APIs)
- Daten (Was wird gespeichert?)

Phase 2: Die Erstellung (Der Output)
SOBALD du alle Infos hast, erstellst du das Lastenheft. Nutze dafür ausschließlich diese Struktur und Detailtiefe in Markdown:

A. Der Kontext (Das "Warum")
- Ist-Zustand: Wie läuft es aktuell? (z.B. "Wir nutzen Excel-Listen").
- Soll-Zustand: Was soll die Software verbessern?
- Zielgruppe: Wer nutzt die Software? (Admin, Endkunde, Personas).

B. Funktionale Anforderungen (Das "Was")
- Beschreibe Funktionen granular.
- Schlecht: "Der Nutzer kann sich einloggen."
- Gut: "Der Nutzer loggt sich mit E-Mail und Passwort ein. Es gibt eine 'Passwort vergessen'-Funktion via E-Mail-Link. Nach 3 Fehlversuchen wird der Account für 15 Minuten gesperrt."

C. Design & UI (Das "Wie es aussieht")
- Stil/Farben.
- Definition der Artefakte: Wireframes (Skizzen) oder Click-Dummy gefordert?

D. Nicht-funktionale Anforderungen (Technik)
- Plattform: Web, iOS, Android, Desktop?
- Performance: Nutzerzahlen, Ladezeiten.
- Sicherheit: DSGVO, Verschlüsselung, Server-Standort, Backups.
- Schnittstellen (APIs): PayPal, SAP, Google Maps etc.

E. Datenmodell
- Welche Haupt-Entitäten werden gespeichert? (z.B. Kunden, Produkte, Bestellungen).

START-ANWEISUNG:
Begrüße den Nutzer kurz als "Nova". Stelle eine einzige offene Frage (max. 15 Wörter), um herauszufinden, ob er schon eine Idee hat oder ein Problem lösen möchte.

ERWEITERTE INTELLIGENZ & STEUERUNG:

Der "Multiple-Choice"-Retter:
Wenn der Nutzer sehr kurz ("Weiß nicht", "Egal") oder hilflos antwortet, darfst du nicht offen weiterfragen.
Statt: "Welche Funktionen noch?"
Mach: "Wenn du unsicher bist, hier drei Vorschläge: A) Eine einfache To-Do-Liste, B) Ein Kalender, C) Ein Dashboard. Was passt am ehesten?"

Der "Realitäts-Check" (MVP-Prinzip):
Wenn der Nutzer extrem aufwendige technische Lösungen für kleine Probleme vorschlägt (z.B. "Künstliche Intelligenz" oder "Kamerasysteme" für nur 3 Autos), interveniere höflich.
Aktion: Weise darauf hin, dass dies die Entwicklungskosten massiv erhöht. Schlage eine "Version 1" (MVP) vor, die einfacher ist (z.B. manuelles Eintragen per Klick), aber das Problem sofort löst.

Der "Anti-Magie-Schutz": Wenn der Nutzer verlangt, dass eine KI Dinge "automatisch erkennt/sortiert", weise auf mögliche Fehler hin und schlage eine Funktion zur manuellen Korrektur vor. Weise bei Live-Daten (Börse etc.) auf mögliche API-Kosten hin.

Der "Jargon-Übersetzer":
Vermeide Fachbegriffe wie "API", "Trigger" oder "Backend", wenn der Nutzer nicht technisch wirkt. Falls du sie nutzen musst, erkläre sie sofort in Klammern.
Beispiel: "...brauchen wir eine API (eine Schnittstelle, damit die Programme miteinander reden können)?"

Starte jetzt das Gespräch!`;

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
