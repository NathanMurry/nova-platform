import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    FileText,
    MessageSquare,
    RefreshCw,
    ExternalLink,
    Clock,
    CheckCircle,
    Database,
    X,
    Save,
    Star,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { generateEmbedding, extractSolutionCard } from '../../lib/gemini';
import type { Specification } from '../../lib/database.types';

interface Conversation {
    id: string;
    entrepreneur_id: string | null;
    messages: any[];
    status: string;
    is_reference: boolean;
    created_at: string;
}

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'conversations' | 'specifications'>('conversations');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [specifications, setSpecifications] = useState<Specification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalConversations: 0,
        activeConversations: 0,
        totalSpecifications: 0,
        approvedSpecifications: 0
    });

    // Modal State
    const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
    const [selectedSpec, setSelectedSpec] = useState<Specification | null>(null);
    const [jsonInput, setJsonInput] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [deploymentUrl, setDeploymentUrl] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [expandedConvId, setExpandedConvId] = useState<string | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Daten laden
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);

        try {
            // Gespräche laden
            const { data: convData, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (convError) console.error('Fehler Conversations:', convError);
            else setConversations(convData || []);

            // Lastenhefte laden
            const { data: specData, error: specError } = await supabase
                .from('specifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (specError) console.error('Fehler Specifications:', specError);
            else setSpecifications(specData || []);

            // Stats berechnen
            const activeConvs = (convData || []).filter(c => c.status === 'active').length;
            const approvedSpecs = (specData || []).filter(s => s.status === 'approved').length;

            setStats({
                totalConversations: (convData || []).length,
                activeConversations: activeConvs,
                totalSpecifications: (specData || []).length,
                approvedSpecifications: approvedSpecs
            });

        } catch (err: any) {
            console.error('Fehler beim Laden:', err);
            setLoadError(err.message || 'Ein unbekannter Fehler ist beim Laden der Daten aufgetreten.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleReference = async (id: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ is_reference: !currentStatus })
                .eq('id', id);

            if (error) throw error;

            // Lokalen State aktualisieren
            setConversations(prev => prev.map(c =>
                c.id === id ? { ...c, is_reference: !currentStatus } : c
            ));
        } catch (err: any) {
            alert('Fehler beim Markieren: ' + err.message);
        }
    };

    const [isExtracting, setIsExtracting] = useState(false);

    const handleOpenKnowledgeModal = (spec: Specification) => {
        setSelectedSpec(spec);
        setJsonInput('');
        setGithubUrl('');
        setDeploymentUrl('');
        setIsKnowledgeModalOpen(true);
    };

    const handleGenerateSolutionCard = async () => {
        if (!selectedSpec) return;
        setIsExtracting(true);
        try {
            const card = await extractSolutionCard(selectedSpec);
            if (card) {
                setJsonInput(JSON.stringify(card, null, 2));
            } else {
                alert('Extraktion fehlgeschlagen.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleSaveKnowledge = async () => {
        if (!selectedSpec || !jsonInput) return;
        setIsSaving(true);

        try {
            // 1. JSON validieren
            let parsedData;
            try {
                parsedData = JSON.parse(jsonInput);
            } catch (e) {
                alert('Ungültiges JSON Format!');
                setIsSaving(false);
                return;
            }

            // 2. Embedding für das Problem-Abstract generieren
            const embedding = await generateEmbedding(parsedData.problem_abstract);

            // 3. Speichern in Supabase
            const { error } = await supabase
                .from('knowledge_base')
                .insert({
                    specification_id: selectedSpec.id,
                    project_number: selectedSpec.project_number,
                    problem_abstract: parsedData.problem_abstract,
                    solution_pattern: parsedData.solution_pattern,
                    industry_context: parsedData.industry_context,
                    functionality_profile: parsedData.functionality_profile,
                    tech_stack: parsedData.tech_stack_details,
                    use_case_tags: parsedData.use_case_tags,
                    github_url: githubUrl,
                    deployment_url: deploymentUrl,
                    embedding: embedding ? JSON.stringify(embedding) : null
                });

            if (error) throw error;

            alert('Erfolgreich in Wissensdatenbank aufgenommen!');
            setIsKnowledgeModalOpen(false);
            loadData(); // Reload to reflect changes if necessary
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern: ' + (error as any).message);
        } finally {
            setIsSaving(false);
        }
    };


    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" /> Aktiv</span>;
            case 'completed':
                return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Abgeschlossen</span>;
            case 'draft':
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Entwurf</span>;
            case 'approved':
                return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Freigegeben</span>;
            case 'review':
                return <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">In Prüfung</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('de-DE');
    };

    const getConversationPreview = (messages: any[]) => {
        if (!messages || messages.length === 0) return 'Kein Inhalt';
        const lastUserMsg = [...messages].reverse().find(m => m.type === 'user');
        return lastUserMsg ? (lastUserMsg.content.length > 60 ? lastUserMsg.content.substring(0, 60) + '...' : lastUserMsg.content) : 'Kein Benutzer-Input';
    };

    return (
        <div className="min-h-screen bg-gray-50 relative">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 min-h-screen p-6 text-white fixed h-full z-10">
                    <div className="mb-10 flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-xl tracking-tight">NOVA <span className="text-gray-500 text-sm font-normal">Admin</span></span>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('conversations')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'conversations' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span>Gespräche</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('specifications')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'specifications' ? 'bg-amber-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <FileText className="w-5 h-5" />
                            <span>Lastenhefte</span>
                        </button>
                    </nav>

                    <div className="absolute bottom-6 left-6 right-6">
                        <button onClick={loadData} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Aktualisieren</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="ml-64 flex-1 p-8">
                    {loadError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <X className="w-5 h-5" />
                                <span>{loadError}</span>
                            </div>
                            <button onClick={() => setLoadError(null)} className="text-red-400 hover:text-red-600">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{activeTab === 'conversations' ? 'Gespräche' : 'Lastenhefte'}</h1>
                            <p className="text-gray-500 mt-1">{activeTab === 'conversations' ? 'Alle Chat-Konversationen' : 'Generierte Anforderungsdokumente'}</p>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        {/* ... Stats rendering kept simple to save space, logic same as before ... */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Gespräche</p>
                            <p className="text-2xl font-bold">{stats.totalConversations}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Aktiv</p>
                            <p className="text-2xl font-bold">{stats.activeConversations}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Lastenhefte</p>
                            <p className="text-2xl font-bold">{stats.totalSpecifications}</p>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase">Freigegeben</p>
                            <p className="text-2xl font-bold">{stats.approvedSpecifications}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500">Laden...</div>
                        ) : activeTab === 'conversations' ? (
                            <div className="divide-y divide-gray-100">
                                {conversations.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">
                                        Keine Gespräche gefunden.
                                    </div>
                                ) : (
                                    conversations.map(conv => (
                                        <div key={conv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedConvId(expandedConvId === conv.id ? null : conv.id)}>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleReference(conv.id, !!conv.is_reference);
                                                        }}
                                                        className={`p-1.5 rounded-full transition-colors ${conv.is_reference ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400'}`}
                                                        title={conv.is_reference ? 'Als Referenz markiert' : 'Als Referenz markieren'}
                                                    >
                                                        <Star className={`w-5 h-5 ${conv.is_reference ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900">#{conv.id.slice(0, 8)}</span>
                                                            <span className="text-xs text-gray-400 font-mono">{formatDate(conv.created_at)}</span>
                                                            {getStatusBadge(conv.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">
                                                            {getConversationPreview(conv.messages)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {expandedConvId === conv.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </div>

                                            {/* Expandable Content */}
                                            {expandedConvId === conv.id && (
                                                <div className="px-16 pb-6 bg-gray-50/50">
                                                    <div className="bg-white rounded-lg border border-gray-100 p-4 space-y-4 shadow-inner max-h-96 overflow-y-auto">
                                                        {conv.messages && conv.messages.map((msg: any, i: number) => (
                                                            <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.type === 'user' ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-800'}`}>
                                                                    <p className="whitespace-pre-line">{msg.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {specifications.map(spec => (
                                    <div key={spec.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/lastenheft/${spec.id}`)}>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-medium text-gray-900">{spec.title || 'Ohne Titel'}</span>
                                                    {spec.project_number && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">{spec.project_number}</span>}
                                                    {getStatusBadge(spec.status)}
                                                </div>
                                                <p className="text-sm text-gray-500">{spec.problem_summary?.slice(0, 100)}...</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenKnowledgeModal(spec); }}
                                                    className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors"
                                                    title="In Wissensdatenbank aufnehmen"
                                                >
                                                    <Database className="w-5 h-5" />
                                                </button>
                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Knowledge Base Modal */}
            {isKnowledgeModalOpen && selectedSpec && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">In Wissensdatenbank aufnehmen</h2>
                                <p className="text-sm text-gray-500">Projekt: {selectedSpec.title} ({selectedSpec.project_number || 'Neu'})</p>
                            </div>
                            <button onClick={() => setIsKnowledgeModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Step 1 */}
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                    <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                                    KI-Zusammenfassung (Solution Card)
                                </h3>
                                <p className="text-sm text-amber-800 mb-4">
                                    Lasse Nova die wichtigsten Punkte aus dem Lastenheft extrahieren. Du kannst das Ergebnis danach bearbeiten.
                                </p>
                                <button
                                    onClick={handleGenerateSolutionCard}
                                    disabled={isExtracting}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                                >
                                    {isExtracting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span>Zusammenfassung generieren</span>
                                </button>
                            </div>

                            {/* Step 2 */}
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                                    JSON Ergebnis einfügen
                                </h3>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder='Füge hier das JSON aus AI Studio ein... { "problem_abstract": ... }'
                                    className="w-full h-48 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-sm"
                                />
                            </div>

                            {/* Step 3 */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
                                    <input
                                        type="text"
                                        value={githubUrl}
                                        onChange={(e) => setGithubUrl(e.target.value)}
                                        placeholder="https://github.com/..."
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Deployment URL</label>
                                    <input
                                        type="text"
                                        value={deploymentUrl}
                                        onChange={(e) => setDeploymentUrl(e.target.value)}
                                        placeholder="https://vercel.app/..."
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setIsKnowledgeModalOpen(false)}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSaveKnowledge}
                                disabled={isSaving || !jsonInput}
                                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Speichern & Lernen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
