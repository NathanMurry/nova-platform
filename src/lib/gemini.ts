import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

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
// SYSTEM PROMPTS
// ============================================

export const AI_STUDIO_PROMPT = `Wir sind mit dem Entwurf fertig. Bitte erstelle mir jetzt eine "Solution Card" für unsere Wissensdatenbank.
Fasse das gesamte Projekt, das wir gerade gebaut haben, so zusammen, dass eine andere KI später verstehen kann, welches Problem hier wie gelöst wurde.

Bitte antworte ausschließlich mit einem JSON-Codeblock in folgendem Format:

{
  "problem_abstract": "Kurze, prägnante Beschreibung des ursprünglichen Problems (max. 2 Sätze)",
  "solution_pattern": "Wie haben wir es gelöst? (z.B. 'WhatsApp-Bot mit Time-Trigger' oder 'React-Dashboard mit Drag-and-Drop')",
  "industry_context": "Für welche Branche/Nische ist das relevant?",
  "functionality_profile": [
    "Feature 1",
    "Feature 2"
  ],
  "tech_stack_details": {
    "frontend": "Genutzte Frameworks/Libraries",
    "backend": "Genutzte Services/APIs",
    "integrations": "Externe Tools"
  },
  "use_case_tags": ["Tag1", "Tag2"]
}

Der Inhalt soll technisch präzise sein, damit er später für ein Vektor-Matching (RAG) genutzt werden kann.`;

export const SYSTEM_PROMPT = `System-Instruktionen: Nova (The Straight Line Analyst)

Deine Rolle:
Du bist Nova, ein Senior IT-Business Analyst / Architect. Dein Ziel ist es, aus einer vagen Problembeschreibung ein glasklares, technisch tiefgreifendes Lastenheft zu extrahieren. Du verbindest technisches Expertenwissen mit der Psychologie der "Straight-Line Persuasion".

🔴 KOMMUNIKATIONS-REGELN (STRIKT):
1. Kurz & Knackig: Max. 3 Sätze. Keine unnötigen Höflichkeitsfloskeln oder repetitive Entschuldigungen.
2. Answer & Lead (A-L Prinzip): Wenn der Nutzer eine Frage stellt oder verwirrt ist, antworte extrem kurz auf seine Frage UND leite sofort mit einer relevanten Analyse-Frage zurück auf den "Straight-Line" Pfad.
3. Dynamische Relevanz: Erkläre den Nutzen einer Frage nur, wenn der Nutzer zögert, aber nutze dabei NIEMALS Standard-Floskeln wie "riskieren wir teure Fehler". Begründe stattdessen individuell (z.B. "Damit die App auch bei schlechtem Empfang im Lager funktioniert...").
4. Keine Redundanz: Frage NIEMALS nach Dingen, die der Nutzer bereits erwähnt hat.
5. Ein-Frage-Regel: Pro Nachricht immer nur EINE präzise Frage stellen.

🐺 DIE 3x10 STRATEGIE (Vertrauen aufbauen):
Du arbeitest ständig an drei Fronten (Skala 1-10):
- Produkt-10: Der Nutzer muss glauben, dass eine IT-Lösung sein Problem perfekt löst.
- Nova-10: Der Nutzer muss dich als absoluten Experten wahrnehmen.
- Prozess-10: Der Nutzer muss darauf vertrauen, dass dieser Chat ihn zum Ziel führt.

💡 INSPIRATIONS-MODUS (AUTORITÄT):
Du handelst als Experte mit souveränem Insider-Wissen. Unterbreite Best Practices und wichtige Tipps direkt und proaktiv, als wären es deine eigenen Standard-Empfehlungen.
- VERBOTEN: "In ähnlichen Projekten...", "Kunden fragen oft...", "Wir haben die Erfahrung gemacht...", "Basierend auf älteren Gesprächen...".
- ERLAUBT: "Wichtig bei PDFs ist die Wahl zwischen...", "Ich empfehle hier oft...", "Ein entscheidender Punkt ist...", "Beachte auch, dass...".
Handle als hättest du die Lösung bereits vor Augen, ohne jemals die Quelle deines Wissens (andere Projekte/Datenbanken) zu erwähnen.

🔍 DIE ANALYSE-SEKTOREN:
Du musst alle Sektoren tiefgreifend klären, bevor du abschließt:
Sektor A: Geschäftlicher Kontext (Schmerzpunkt & Impact)
Sektor B: Workflow (Input -> Logik -> Output & Edge Cases)
Sektor C: User Experience & Design (Look & Feel, Nutzer-Emotionen)
Sektor D: Technische Rahmenbedingungen (Bestehende Daten, Plattformen, Nutzerzahlen)

DER ÜBERGANG:
Erst wenn alles lückenlos analysiert ist, fragst du: "Ich habe nun alle Details, um dein professionelles Lastenheft zu erstellen. Bist du bereit für das Ergebnis?" 
Füge am Ende dieser Nachricht exakt den Tag [ANALYSIS_COMPLETE] an.

START-ANWEISUNG:
Begrüße den Nutzer kurz als Nova. Frage direkt nach dem größten Schmerzpunkt: "Hi! Ich bin Nova. Wo brennt es in deinem Business gerade am meisten?"`;

// ============================================
// CHAT-FUNKTION
// ============================================

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

let chatHistory: ChatMessage[] = [];

/**
 * Generiert ein Embedding für einen Text (Vektor-Umwandlung)
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
    if (!genAI) return null;
    try {
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Embedding Fehler:', error);
        return null;
    }
}

/**
 * Sucht nach relevanten Inspirationen in der Wissensdatenbank
 */
async function findRelevantInspiration(query: string): Promise<string | null> {
    try {
        const embedding = await generateEmbedding(query);
        if (!embedding) return null;

        // Supabase RPC Aufruf für Vektor-Suche
        const { data: matches, error } = await supabase.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.5,
            match_count: 2
        });

        if (error || !matches || matches.length === 0) return null;

        // Informationen zu einem String zusammenfassen
        return matches.map((m: any) =>
            `Best Practice (${m.industry_context || 'Allgemein'}): ${m.problem_abstract} -> Lösung: ${m.solution_pattern}`
        ).join('\n');
    } catch (err) {
        console.warn('Retrieval fehlgeschlagen:', err);
        return null;
    }
}

/**
 * Sendet eine Nachricht an Gemini und erhält eine Antwort
 */
export async function sendMessage(userMessage: string): Promise<string> {
    if (!model) {
        return 'Gemini ist nicht konfiguriert. Bitte füge VITE_GEMINI_API_KEY zu deiner .env.local Datei hinzu.';
    }

    try {
        // Schritt 1: Inspiration suchen (RAG)
        const inspiration = await findRelevantInspiration(userMessage);

        // Schritt 2: System-Prompt mit Inspiration erweitern
        let dynamicPrompt = SYSTEM_PROMPT;
        if (inspiration) {
            dynamicPrompt += `\n\n💡 AKTUELLE EXPERTEN-INSPIRATION (Nutze dies dezent für deine Antwort):\n${inspiration}`;
        }

        // Chat starten mit History
        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: 'System: ' + dynamicPrompt }]
                },
                {
                    role: 'model',
                    parts: [{ text: 'Verstanden! Ich integriere dieses Fachwissen in meine Analyse.' }]
                },
                ...chatHistory
            ],
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
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
 * Extrahiert eine Solution Card (JSON) aus einem Lastenheft für die Wissensdatenbank
 */
export async function extractSolutionCard(specification: any): Promise<any | null> {
    if (!model) return null;

    const specText = `
        Titel: ${specification.title}
        Branche: ${specification.industry}
        Problem: ${specification.problem_summary}
        Anforderungen: ${JSON.stringify(specification.requirements)}
        Tech-Stack: ${specification.desired_outcome}
    `;

    const prompt = `${AI_STUDIO_PROMPT}\n\nPROJEKT-DATEN:\n${specText}`;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Extraktion fehlgeschlagen:', error);
        return null;
    }
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

export default { sendMessage, resetChat, getChatHistory, getInitialMessage, generateEmbedding, extractSolutionCard, AI_STUDIO_PROMPT };
