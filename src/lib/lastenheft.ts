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
1. **Das System verstehen:** Beschreibe nicht nur das Problem, sondern das fehlerhafte System dahinter.
2. **Detailtiefe:** Sei extrem spezifisch. Wenn der Nutzer "Chaos" sagt, beschreibe genau, wo Informationen verloren gehen.
3. **Technische Präzision:** Leite aus vagen Wünschen konkrete funktionale Anforderungen für Entwickler ab.

# LASTENHEFT-STRUKTUR (JSON):

{
    "title": "Emoji + Präziser Projektname",
    "status": "Ready for Dev",
    "priority": "Hoch/Mittel/Niedrig",
    
    "zielsetzung": "Umfassende Analyse (min. 150 Wörter). Erkläre: 
        1. IST-Zustand (Das Chaos-System), 
        2. SOLL-Zustand (Die systematische Lösung), 
        3. Business Impact (Warum ist das wichtig?).",
    
    "workflow": [
        {
            "id": "WF-001",
            "category": "Phase Name",
            "description": "Detaillierte technische Beschreibung des Teilsystems.",
            "priority": "high/medium/low"
        }
    ],
    
    "datenFelder": [
        {
            "name": "Feldname",
            "typ": "String/Int/Bool/etc.",
            "beschreibung": "Genaue Verwendung"
        }
    ],
    
    "techStackVorschlag": {
        "frontend": "Konkrete Empfehlung",
        "backend": "Konkrete Empfehlung",
        "datenbank": "Konkrete Empfehlung",
        "extras": "APIs, Tools etc."
    },
    
    "definitionOfDone": [
        "✅ Konkretes Abnahmekriterium 1",
        "✅ Konkretes Abnahmekriterium 2"
    ],
    
    "industry": "Genaue Branche (oder 'Nicht angegeben')",
    "teamSize": "Anzahl Personen (oder 'Nicht angegeben')",
    "geschaetzterAufwand": "Stundenbereich (z.B. 30-50h)",
    "geschaetzteKosten": "Eurobereich (z.B. 2.400€ - 4.000€)"
}

# STRIKTE REGELN:
- **Fakten-Check:** Erfinde NIEMALS spezifische Zahlen (z.B. Mitarbeiterzahl, Budget), die nicht genannt wurden. Nutzung "Nicht angegeben" ist besser als eine Lüge.
- **Logische Ableitung:** Bei fehlenden funktionalen Details darfst du logische Schlüsse ziehen (z.B. "Login benötigt" bei sensiblen Daten), aber kennzeichne dies.
- **Entwickler-Fokus:** Die Beschreibungen müssen so klar sein, dass man sie in Jira-Tickets umwandeln kann.
- **Sprache:** Deutsch.

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
