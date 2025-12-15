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

const EXTRACTION_PROMPT = `Du bist ein erfahrener Tech-Consultant, der aus Kundengesprächen technische Lastenhefte für Entwickler erstellt.

Analysiere das folgende Gespräch zwischen einem Kleinunternehmer und "Nova". Erstelle daraus ein professionelles Lastenheft im JSON-Format.

# LASTENHEFT-STRUKTUR (Das musst du erstellen):

{
    "title": "Emoji + Kurzer Projektname (z.B. '🚀 Maler-Express Angebot')",
    "status": "Ready for Dev",
    "priority": "Hoch/Mittel/Niedrig",
    
    "zielsetzung": "Was will der Nutzer erreichen? Warum? Was ist das Hauptproblem? (2-3 Sätze)",
    
    "workflow": [
        {
            "step": 1,
            "phase": "Input",
            "beschreibung": "Was macht der Nutzer am Anfang?",
            "beispiel": "Beispiel-Input vom User"
        },
        {
            "step": 2,
            "phase": "Processing",
            "beschreibung": "Was passiert im Hintergrund?"
        },
        {
            "step": 3,
            "phase": "Output",
            "beschreibung": "Was bekommt der Nutzer als Ergebnis?"
        }
    ],
    
    "datenFelder": [
        {
            "name": "Feldname",
            "typ": "String/Int/Float/Date/Enum/File/Bool",
            "beschreibung": "Wozu wird das gebraucht?"
        }
    ],
    
    "techStackVorschlag": {
        "frontend": "z.B. WhatsApp, Web-App, Telegram",
        "backend": "z.B. Python, n8n, Make.com, Zapier",
        "datenbank": "z.B. Airtable, Google Sheets, Supabase",
        "extras": "z.B. OpenAI API, PDF Generator"
    },
    
    "definitionOfDone": [
        "✅ Erste Akzeptanzbedingung",
        "✅ Zweite Akzeptanzbedingung",
        "✅ Dritte Akzeptanzbedingung"
    ],
    
    "industry": "Branche des Kunden",
    "teamSize": "Teamgröße (falls genannt)",
    "geschaetzterAufwand": "z.B. 20-40 Stunden",
    "geschaetzteKosten": "z.B. 1.600€ - 3.200€"
}

# REGELN:
1. **Denke wie ein Entwickler:** Was braucht ein Programmierer, um das zu bauen?
2. **Konkrete Workflows:** Beschreibe den Ablauf Schritt für Schritt.
3. **Datenfelder ableiten:** Welche Informationen müssen gespeichert werden?
4. **Realistische Tech-Vorschläge:** Nutze No-Code/Low-Code wenn sinnvoll.
5. **Klare Akzeptanzkriterien:** Wann ist das Projekt "fertig"?
6. **Wenn Info fehlt:** Schreibe "nicht im Gespräch genannt".

Antworte NUR mit dem JSON, keine Erklärungen drumherum.`;

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
    lastenheft: Lastenheft,
    entrepreneurId?: string
): Promise<string | null> {
    try {
        const { data, error } = await supabase
            .from('specifications')
            .insert({
                entrepreneur_id: entrepreneurId || null,
                conversation_id: conversationId,
                title: lastenheft.title,
                problem_summary: lastenheft.problemSummary,
                requirements: lastenheft.requirements,
                industry: lastenheft.industry,
                team_size: lastenheft.teamSize,
                budget_range: lastenheft.budgetRange,
                desired_outcome: lastenheft.desiredOutcome,
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
