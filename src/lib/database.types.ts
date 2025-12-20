// Automatisch generierte Typen für Supabase
// Diese Datei definiert die Struktur deiner Datenbank

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            // === UNTERNEHMER ===
            entrepreneurs: {
                Row: {
                    id: string;
                    email: string;
                    name: string;
                    company: string | null;
                    phone: string | null;
                    industry: string | null;
                    team_size: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    name: string;
                    company?: string | null;
                    phone?: string | null;
                    industry?: string | null;
                    team_size?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    name?: string;
                    company?: string | null;
                    phone?: string | null;
                    industry?: string | null;
                    team_size?: string | null;
                    updated_at?: string;
                };
            };

            // === GESPRÄCHE ===
            conversations: {
                Row: {
                    id: string;
                    entrepreneur_id: string | null;
                    messages: ConversationMessage[];
                    status: 'active' | 'completed' | 'abandoned';
                    created_at: string;
                    completed_at: string | null;
                };
                Insert: {
                    id?: string;
                    entrepreneur_id?: string | null;
                    messages?: ConversationMessage[];
                    status?: 'active' | 'completed' | 'abandoned';
                    created_at?: string;
                    completed_at?: string | null;
                };
                Update: {
                    messages?: ConversationMessage[];
                    status?: 'active' | 'completed' | 'abandoned';
                    completed_at?: string | null;
                };
            };

            // === LASTENHEFTE ===
            specifications: {
                Row: {
                    id: string;
                    project_number: string | null;
                    entrepreneur_id: string | null;
                    conversation_id: string | null;
                    title: string;
                    problem_summary: string | null;
                    requirements: Requirement[] | null;
                    industry: string | null;
                    team_size: string | null;
                    budget_range: string | null;
                    desired_outcome: string | null;
                    status: 'draft' | 'review' | 'approved' | 'in_progress' | 'completed';
                    comments: Comment[] | null;
                    created_at: string;
                    updated_at: string | null;
                };
                Insert: {
                    id?: string;
                    project_number?: string | null;
                    entrepreneur_id?: string | null;
                    conversation_id?: string | null;
                    title?: string;
                    problem_summary?: string | null;
                    requirements?: Requirement[] | null;
                    industry?: string | null;
                    team_size?: string | null;
                    budget_range?: string | null;
                    desired_outcome?: string | null;
                    status?: 'draft' | 'review' | 'approved' | 'in_progress' | 'completed';
                    comments?: Comment[] | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    project_number?: string | null;
                    title?: string;
                    problem_summary?: string;
                    requirements?: Requirement[];
                    industry?: string | null;
                    team_size?: string | null;
                    budget_range?: string | null;
                    desired_outcome?: string | null;
                    status?: 'draft' | 'review' | 'approved' | 'in_progress' | 'completed';
                    comments?: Comment[];
                    updated_at?: string;
                };
            };

            // === ENTWÜRFE ===
            drafts: {
                Row: {
                    id: string;
                    specification_id: string;
                    title: string;
                    description: string;
                    preview_url: string | null;
                    file_urls: string[];
                    video_call_scheduled: string | null;
                    video_call_completed: boolean;
                    feedback: string | null;
                    approved: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    specification_id: string;
                    title: string;
                    description: string;
                    preview_url?: string | null;
                    file_urls?: string[];
                    video_call_scheduled?: string | null;
                    video_call_completed?: boolean;
                    feedback?: string | null;
                    approved?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    title?: string;
                    description?: string;
                    preview_url?: string | null;
                    file_urls?: string[];
                    video_call_scheduled?: string | null;
                    video_call_completed?: boolean;
                    feedback?: string | null;
                    approved?: boolean;
                    updated_at?: string;
                };
            };

            // === AUFTRÄGE ===
            orders: {
                Row: {
                    id: string;
                    draft_id: string;
                    programmer_id: string | null;
                    programmer_name: string | null;
                    price: number;
                    commission: number; // 10% der Auftragssumme
                    status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
                    start_date: string | null;
                    estimated_completion: string | null;
                    actual_completion: string | null;
                    notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    draft_id: string;
                    programmer_id?: string | null;
                    programmer_name?: string | null;
                    price: number;
                    commission?: number;
                    status?: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
                    start_date?: string | null;
                    estimated_completion?: string | null;
                    actual_completion?: string | null;
                    notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    programmer_id?: string | null;
                    programmer_name?: string | null;
                    price?: number;
                    commission?: number;
                    status?: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'cancelled';
                    start_date?: string | null;
                    estimated_completion?: string | null;
                    actual_completion?: string | null;
                    notes?: string | null;
                    updated_at?: string;
                };
            };

            // === WISSENSDATENBANK ===
            knowledge_base: {
                Row: {
                    id: string;
                    specification_id: string | null;
                    project_number: string | null;
                    problem_abstract: string;
                    solution_pattern: string;
                    industry_context: string | null;
                    functionality_profile: string[] | null;
                    tech_stack: Json | null;
                    use_case_tags: string[] | null;
                    github_url: string | null;
                    deployment_url: string | null;
                    embedding: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    specification_id?: string | null;
                    project_number?: string | null;
                    problem_abstract: string;
                    solution_pattern: string;
                    industry_context?: string | null;
                    functionality_profile?: string[] | null;
                    tech_stack?: Json | null;
                    use_case_tags?: string[] | null;
                    github_url?: string | null;
                    deployment_url?: string | null;
                    embedding?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    specification_id?: string | null;
                    project_number?: string | null;
                    problem_abstract?: string;
                    solution_pattern?: string;
                    industry_context?: string | null;
                    functionality_profile?: string[] | null;
                    tech_stack?: Json | null;
                    use_case_tags?: string[] | null;
                    github_url?: string | null;
                    deployment_url?: string | null;
                    embedding?: string | null;
                    updated_at?: string;
                };
            };
        };
    };
}

// === HELPER TYPES ===

export interface ConversationMessage {
    type: 'bot' | 'user';
    content: string;
    timestamp: string;
    suggestions?: string[];
}

export interface Requirement {
    id: string;
    category: string; // z.B. "Rechnungen", "Termine", "Website"
    description: string;
    priority: 'high' | 'medium' | 'low';
}

export interface Comment {
    id: string;
    author: 'entrepreneur' | 'nova';
    content: string;
    timestamp: string;
}

// === CONVENIENCE TYPES ===
export type Entrepreneur = Database['public']['Tables']['entrepreneurs']['Row'];
export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type Specification = Database['public']['Tables']['specifications']['Row'];
export type Draft = Database['public']['Tables']['drafts']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type KnowledgeEntry = Database['public']['Tables']['knowledge_base']['Row'];
