-- =====================================================
-- NOVA Datenbank Schema für Supabase
-- =====================================================
-- Führe dieses SQL im Supabase Dashboard aus:
-- SQL Editor → New Query → Paste & Run
-- =====================================================

-- =====================================================
-- ERWEITERUNGEN
-- =====================================================
-- Enable pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================
-- SEQUENCES
-- =====================================================
-- Projekt-Nummern-Generator (z.B. für P-2025-0001)
CREATE SEQUENCE IF NOT EXISTS project_number_seq START 1;

-- 1. UNTERNEHMER (entrepreneurs)
-- =====================================================
CREATE TABLE IF NOT EXISTS entrepreneurs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    industry TEXT, -- z.B. 'Handwerk', 'Gastro', 'Dienstleistung'
    team_size TEXT, -- z.B. 'Nur ich', '2-5', '6-15'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Email-Suche
CREATE INDEX IF NOT EXISTS idx_entrepreneurs_email ON entrepreneurs(email);

-- 2. GESPRÄCHE (conversations)
-- =====================================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb, -- Array von {type, content, timestamp, suggestions}
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'project', 'archived')),
    is_reference BOOLEAN DEFAULT FALSE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    archive_reason_status TEXT, -- Speichert den Status vor der Archivierung
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Index für Unternehmer-Gespräche
CREATE INDEX IF NOT EXISTS idx_conversations_entrepreneur ON conversations(entrepreneur_id);

-- 3. LASTENHEFTE (specifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS specifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_number TEXT UNIQUE, -- z.B. 'P-2025-0042'
    entrepreneur_id UUID REFERENCES entrepreneurs(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    problem_summary TEXT NOT NULL, -- Zusammenfassung des Problems
    requirements JSONB DEFAULT '[]'::jsonb, -- Array von {id, category, description, priority}
    industry TEXT,
    team_size TEXT,
    budget_range TEXT, -- z.B. '50-100€/Monat', '100-250€/Monat'
    desired_outcome TEXT, -- z.B. '5h pro Woche sparen'
    
    -- Projekt-Management Felder
    design_url TEXT, -- Link zu Figma/Entwurf
    is_design_paid BOOLEAN DEFAULT FALSE,
    released_to_dev BOOLEAN DEFAULT FALSE,
    dev_notes TEXT,
    
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'in_progress', 'completed')),
    comments JSONB DEFAULT '[]'::jsonb, -- Array von {id, author, content, timestamp}
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_specifications_entrepreneur ON specifications(entrepreneur_id);
CREATE INDEX IF NOT EXISTS idx_specifications_status ON specifications(status);

-- 4. ENTWÜRFE (drafts)
-- =====================================================
CREATE TABLE IF NOT EXISTS drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specification_id UUID REFERENCES specifications(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    preview_url TEXT, -- URL zum Vorschaubild
    file_urls TEXT[] DEFAULT '{}', -- Array von Datei-URLs
    video_call_scheduled TIMESTAMPTZ, -- Wann ist das Videogespräch?
    video_call_completed BOOLEAN DEFAULT FALSE,
    feedback TEXT, -- Feedback nach Videogespräch
    approved BOOLEAN DEFAULT FALSE, -- Hat der Unternehmer zugestimmt?
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_drafts_specification ON drafts(specification_id);

-- 5. AUFTRÄGE (orders)
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE,
    programmer_id UUID, -- Zukünftig: Referenz zu programmers Tabelle
    programmer_name TEXT,
    price NUMERIC(10, 2) NOT NULL, -- Auftragssumme
    commission NUMERIC(10, 2) GENERATED ALWAYS AS (price * 0.10) STORED, -- 10% Provision
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'review', 'completed', 'cancelled')),
    start_date DATE,
    estimated_completion DATE,
    actual_completion DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_orders_draft ON orders(draft_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_programmer ON orders(programmer_id);

-- 6. WISSENSDATENBANK (knowledge_base)
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specification_id UUID REFERENCES specifications(id) ON DELETE CASCADE, -- Link zum Originalprojekt
    project_number TEXT, -- Redundant aber praktisch für Suche (z.B. 'P-2025-0042')
    
    -- Content aus AI Studio JSON
    problem_abstract TEXT NOT NULL,
    solution_pattern TEXT NOT NULL,
    industry_context TEXT,
    functionality_profile TEXT[], -- Array von Strings
    tech_stack JSONB, -- {frontend, backend, ...}
    use_case_tags TEXT[], 
    
    -- Deployment Links
    github_url TEXT,
    deployment_url TEXT,
    
    -- AI Memory
    embedding vector(768), -- Für Gemini Text Embedding (768 Dimensionen)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUPPORT-MESSAGES (messages)
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    specification_id UUID REFERENCES specifications(id) ON DELETE CASCADE,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer', 'developer')),
    receiver_role TEXT NOT NULL CHECK (receiver_role IN ('admin', 'customer', 'developer')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_messages_spec ON messages(specification_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- =====================================================
-- RPC FUNKTIONEN
-- =====================================================

-- Vektor-Suche für Wissensdatenbank
CREATE OR REPLACE FUNCTION match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id UUID,
  problem_abstract TEXT,
  solution_pattern TEXT,
  industry_context TEXT,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.problem_abstract,
    kb.solution_pattern,
    kb.industry_context,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =====================================================
-- AUTOMATISCHE UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
DROP TRIGGER IF EXISTS update_entrepreneurs_updated_at ON entrepreneurs;
CREATE TRIGGER update_entrepreneurs_updated_at
    BEFORE UPDATE ON entrepreneurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_specifications_updated_at ON specifications;
CREATE TRIGGER update_specifications_updated_at
    BEFORE UPDATE ON specifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drafts_updated_at ON drafts;
CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON knowledge_base
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- AUTOMATISCHE PROJEKT-NUMMER
-- =====================================================
CREATE OR REPLACE FUNCTION set_project_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_number IS NULL THEN
        -- Format: P-YYYY-XXXX (z.B. P-2025-0001)
        NEW.project_number := 'P-' || to_char(NOW(), 'YYYY') || '-' || lpad(nextval('project_number_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_project_number_trigger ON specifications;
CREATE TRIGGER set_project_number_trigger
    BEFORE INSERT ON specifications
    FOR EACH ROW EXECUTE FUNCTION set_project_number();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Aktiviere RLS für alle Tabellen
ALTER TABLE entrepreneurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 1. UNTERNEHMER: Eigene Daten sehen
DROP POLICY IF EXISTS "Users can view own data" ON entrepreneurs;
CREATE POLICY "Users can view own data" ON entrepreneurs
    FOR ALL USING (auth.uid()::text = id::text);

-- 2. GESPRÄCHE: Öffentliches Erstellen (für Chatbot) & Admin-Sichtbarkeit
DROP POLICY IF EXISTS "Allow public insert" ON conversations;
CREATE POLICY "Allow public insert" ON conversations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow selection for all" ON conversations;
CREATE POLICY "Allow selection for all" ON conversations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow updates for all" ON conversations;
CREATE POLICY "Allow updates for all" ON conversations
    FOR UPDATE USING (true);

-- 3. LASTENHEFTE: Öffentliches Erstellen & Admin-Sichtbarkeit
DROP POLICY IF EXISTS "Allow public insert" ON specifications;
CREATE POLICY "Allow public insert" ON specifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow selection for all" ON specifications;
CREATE POLICY "Allow selection for all" ON specifications
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow updates for all" ON specifications;
CREATE POLICY "Allow updates for all" ON specifications
    FOR UPDATE USING (true);

-- 4. WISSENSDATENBANK: Öffentliche Sichtbarkeit für RAG, Admin-Schreibzugriff
DROP POLICY IF EXISTS "Anyone can view knowledge" ON knowledge_base;
CREATE POLICY "Anyone can view knowledge" ON knowledge_base
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert matching results" ON knowledge_base;
CREATE POLICY "Anyone can insert matching results" ON knowledge_base
    FOR INSERT WITH CHECK (true);

-- 5. MESSAGES: Admin sieht alles, Kunde nur seine
DROP POLICY IF EXISTS "Allow selection for all messages" ON messages;
CREATE POLICY "Allow selection for all messages" ON messages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert for all messages" ON messages;
CREATE POLICY "Allow insert for all messages" ON messages
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
-- Führe diese im Supabase Dashboard unter Storage aus:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('drafts', 'drafts', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- =====================================================
-- 8. AUTOMATISCHE ARCHIVIERUNG (3 TAGE INAKTIVITÄT)
-- =====================================================

-- Funktion zur Archivierung inaktiver Gespräche
CREATE OR REPLACE FUNCTION archive_inactive_conversations()
RETURNS void AS $$
BEGIN
    UPDATE conversations
    SET 
        archive_reason_status = status,
        status = 'archived'
    WHERE 
        status NOT IN ('archived', 'project') -- Projekte werden nie automatisch archiviert
        AND last_activity_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- Hinweis: Um dies automatisch auszuführen, muss in Supabase ein Cron-Job (pg_cron) 
-- oder ein Edge Function Scheduler eingerichtet werden:
-- SELECT cron.schedule('0 0 * * *', 'SELECT archive_inactive_conversations();');
