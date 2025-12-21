import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';
import type { ConversationMessage } from './database.types';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI?.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

// ============================================
// LASTENHEFT GENERIERUNG
// ============================================

export interface Lastenheft {
    title: string;
    problemSummary: string;
    requirements: Requirement[];
    industry: string;
    teamSize: string;
    budgetRange: string;
    desiredOutcome: string;
    estimatedHours: number;
    estimatedCost: string;
}

export interface Requirement {
    id: string;
    category: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

const EXTRACTION_PROMPT = `Du bist ein Senior IT-Architect und Business Analyst. Deine Aufgabe ist es, aus einem Nutzergespräch ein hochprofessionelles, detailliertes Lastenheft zu extrahieren.

# DEIN ANALYSE-FOKUS:
1. **Fakten-Treue (CRITICAL):** Nutze NUR Informationen, die im Gespräch gefallen sind. Wenn Details wie Mitarbeiterzahl oder Budget fehlen, schreibe "Nicht im Gespräch spezifiziert". Erfinde NIEMALS Fakten.
2. **Systematische Analyse:** Beschreibe nicht nur Symptome ("Chaos"), sondern analysiere das defekte Teilsystem (z.B. "Fehlende synchrone Datenhaltung zwischen Excel und Außendienst").
3. **Technische Ableitung:** Übe "Technical Discernment" aus. Wenn der Nutzer sagt "Ich will Termine besser planen", leite daraus funktionale Anforderungen ab (z.B. "Zentraler Kalender-Endpunkt", "Konflikt-Check Logik"), aber bleibe dabei nah am geschilderten Problem.
4. **Tiefe statt Breite:** Gehe bei den vorhandenen Infos extrem ins Detail, anstatt überall ein bisschen was zu erfinden.

# LASTENHEFT-STRUKTUR (JSON):
{
    "title": "Emoji + Präziser Projektname",
    "status": "Ready for Dev",
    "priority": "Basierend auf Business-Impact (Hoch/Mittel/Niedrig)",
    
    "zielsetzung": "Tiefgehende Analyse (min. 150-200 Wörter). Erkläre: 
        1. IST-Zustand (Das Schmerz-System), 
        2. SOLL-Zustand (Die präzise IT-Lösung), 
        3. Quantifizierbarer Nutzen (Zeit/Geld-Ersparnis basierend auf Nutzerangaben).",
    
    "workflow": [
        {
            "id": "WF-001",
            "category": "Modul/Phase Name",
            "description": "Technisch präzise Beschreibung der Funktion. Keine Prosa, sondern Entwickler-Anweisungen.",
            "priority": "high/medium/low"
        }
    ],
    
    "datenFelder": [
        {
            "name": "Feldname",
            "typ": "Datentyp (String/Int/JSON/etc.)",
            "beschreibung": "Wozu dient dieses Feld konkret?"
        }
    ],
    
    "techStackVorschlag": {
        "frontend": "Modernste Empfehlung (z.B. Next.js/React)",
        "backend": "Passende Architektur (z.B. Supabase/Node.js)",
        "datenbank": "Spezifische Wahl (PostgreSQL/NoSQL)",
        "extras": "APIs (Stripe, SendGrid, etc.)"
    },
    
    "definitionOfDone": [
        "✅ Kriterium 1: [Konkreter technischer Check]",
        "✅ Kriterium 2: [Nutzer-Abnahme-Szenario]"
    ],
    
    "industry": "Exakte Branche aus dem Gespräch",
    "teamSize": "Anzahl Personen (nur falls genannt, sonst 'Nicht angegeben')",
    "geschaetzterAufwand": "Realistische Schätzung (z.B. 40-60h)",
    "geschaetzteKosten": "Realistischer Eurobereich basierend auf Aufwand"
}

# STRIKTE REGELN:
- **Keine Platzhalter:** Nutze keine Phrasen wie [Hier Text einfügen]. Wenn Info fehlt, sag das es fehlt.
- **Deutsch:** Das gesamte Dokument ist auf Deutsch.
- **Entwickler-Sprache:** Schreib so, dass ein Senior Dev sofort anfangen kann zu coden.

Antworte NUR mit dem validen JSON.`;

/**
 * Generiert ein Lastenheft aus einem Gesprächsverlauf
 */
export async function generateLastenheft(
    messages: ConversationMessage[]
): Promise<Lastenheft | null> {
    if (!model) {
        console.error('Gemini nicht konfiguriert');
        return null;
    }

    try {
        // Gespräch als Text formatieren
        const conversationText = messages
            .map(msg => `${msg.type === 'bot' ? 'Nova' : 'Unternehmer'}: ${msg.content}`)
            .join('\n\n');

        const prompt = `${EXTRACTION_PROMPT}\n\n---\n\nGESPRÄCH:\n\n${conversationText}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // JSON aus der Antwort extrahieren
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('Kein JSON in der Antwort gefunden');
            return null;
        }

        const lastenheft = JSON.parse(jsonMatch[0]) as Lastenheft;
        return lastenheft;

    } catch (error) {
        console.error('Fehler bei der Lastenheft-Generierung:', error);
        return null;
    }
}

/**
 * Speichert ein Lastenheft in Supabase
 */
export async function saveLastenheft(
    conversationId: string,
    lastenheft: any,
    entrepreneurId?: string
): Promise<string | null> {
    try {
        // Das neue Lastenheft-Format speichern
        // Wir speichern die komplexen Felder als JSON-String in problem_summary
        const { data, error } = await supabase
            .from('specifications')
            .insert({
                entrepreneur_id: entrepreneurId || null,
                conversation_id: conversationId,
                title: lastenheft.title || 'Neues Lastenheft',
                problem_summary: lastenheft.zielsetzung || lastenheft.problemSummary || '',
                requirements: lastenheft.workflow || lastenheft.requirements || [],
                industry: lastenheft.industry || 'nicht angegeben',
                team_size: lastenheft.teamSize || 'nicht angegeben',
                budget_range: lastenheft.geschaetzteKosten || lastenheft.budgetRange || 'nicht angegeben',
                desired_outcome: JSON.stringify({
                    techStack: lastenheft.techStackVorschlag,
                    datenFelder: lastenheft.datenFelder,
                    definitionOfDone: lastenheft.definitionOfDone,
                    aufwand: lastenheft.geschaetzterAufwand
                }),
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Fehler beim Speichern des Lastenhefts:', error);
            return null;
        }

        return data.id;
    } catch (error) {
        console.error('Supabase Fehler:', error);
        return null;
    }
}

/**
 * Lädt ein Lastenheft aus Supabase
 */
export async function loadLastenheft(specificationId: string) {
    try {
        const { data, error } = await supabase
            .from('specifications')
            .select('*')
            .eq('id', specificationId)
            .single();

        if (error) {
            console.error('Fehler beim Laden des Lastenhefts:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Supabase Fehler:', error);
        return null;
    }
}

/**
 * Aktualisiert ein Lastenheft (z.B. nach Kommentaren)
 */
export async function updateLastenheft(
    specificationId: string,
    updates: Partial<{
        title: string;
        problem_summary: string;
        requirements: Requirement[];
        status: string;
    }>
) {
    try {
        const { data, error } = await supabase
            .from('specifications')
            .update(updates)
            .eq('id', specificationId)
            .select()
            .single();

        if (error) {
            console.error('Fehler beim Aktualisieren des Lastenhefts:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Supabase Fehler:', error);
        return null;
    }
}

/**
 * Fügt einen Kommentar zum Lastenheft hinzu
 */
export async function addComment(
    specificationId: string,
    author: 'entrepreneur' | 'nova',
    content: string
) {
    try {
        // Aktuelle Kommentare laden
        const { data: spec } = await supabase
            .from('specifications')
            .select('comments')
            .eq('id', specificationId)
            .single();

        const comments = (spec?.comments as any[]) || [];

        // Neuen Kommentar hinzufügen
        comments.push({
            id: `comment-${Date.now()}`,
            author,
            content,
            timestamp: new Date().toISOString()
        });

        // Speichern
        const { data, error } = await supabase
            .from('specifications')
            .update({ comments })
            .eq('id', specificationId)
            .select()
            .single();

        if (error) {
            console.error('Fehler beim Hinzufügen des Kommentars:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Supabase Fehler:', error);
        return null;
    }
}

export default {
    generateLastenheft,
    saveLastenheft,
    loadLastenheft,
    updateLastenheft,
    addComment
};
