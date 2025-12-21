import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    FileText,
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
    ChevronUp,
    Trash2,
    LayoutDashboard,
    Target,
    ShoppingCart,
    Inbox,
    Search,
    User,
    CreditCard
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
    const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'specifications' | 'pipeline' | 'support'>('overview');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [specifications, setSpecifications] = useState<Specification[]>([]);
    const [supportMessages, setSupportMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [stats, setStats] = useState({
        totalConversations: 0,
        activeConversations: 0,
        totalSpecifications: 0,
        approvedSpecifications: 0,
        paidDesigns: 0,
        revenue: 0
    });

    // ... Modal State ...
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
            // 1. Gespräche laden (mit Projektnummer falls vorhanden)
            const { data: convData } = await supabase
                .from('conversations')
                .select('*, specifications(project_number)')
                .order('created_at', { ascending: false });

            // Client-seitig nach Projektnummer sortieren (falls vorhanden)
            const sortedByPNumber = (convData || []).sort((a: any, b: any) => {
                const pA = a.specifications?.[0]?.project_number || 'ZZZ';
                const pB = b.specifications?.[0]?.project_number || 'ZZZ';
                return pA.localeCompare(pB);
            });
            setConversations(sortedByPNumber);

            // 2. Lastenhefte laden (Sortierung: Projektnummer DESC, dann Datum DESC)
            const { data: specData } = await supabase
                .from('specifications')
                .select('*')
                .order('project_number', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false });
            setSpecifications(specData || []);

            // 3. Support-Nachrichten laden
            const { data: msgData } = await supabase
                .from('messages')
                .select('*, specifications(project_number, title)')
                .order('created_at', { ascending: false });
            setSupportMessages(msgData || []);

            // 4. Echte Stats holen
            const [
                { count: totalConvs },
                { count: activeConvs },
                { count: totalSpecs },
                { count: approvedSpecs },
                { count: paidDesigns }
            ] = await Promise.all([
                supabase.from('conversations').select('*', { count: 'exact', head: true }),
                supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'active'),
                supabase.from('specifications').select('*', { count: 'exact', head: true }),
                supabase.from('specifications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
                supabase.from('specifications').select('*', { count: 'exact', head: true }).eq('is_design_paid', true)
            ]);

            setStats({
                totalConversations: totalConvs || 0,
                activeConversations: activeConvs || 0,
                totalSpecifications: totalSpecs || 0,
                approvedSpecifications: approvedSpecs || 0,
                paidDesigns: paidDesigns || 0,
                revenue: (paidDesigns || 0) * 199 // Einfache Dummy-Rechnung
            });

        } catch (err: any) {
            console.error('Fehler beim Laden:', err);
            setLoadError(err.message);
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

    const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm('Möchtest du dieses Gespräch wirklich unwiderruflich löschen?')) return;

        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Lokalen State aktualisieren
            setConversations(prev => prev.filter(c => c.id !== id));
            setStats(prev => ({
                ...prev,
                totalConversations: prev.totalConversations - 1,
            }));
        } catch (err: any) {
            alert('Fehler beim Löschen: ' + err.message);
        }
    };

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
                <aside className="w-64 bg-slate-900 min-h-screen p-6 text-white fixed h-full z-10">
                    <div className="mb-10 flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate('/')}>
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-xl tracking-tight">NOVA <span className="text-gray-500 text-sm font-normal">Admin</span></span>
                    </div>

                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('leads')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'leads' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <User className="w-5 h-5" />
                            <span>Gespräche</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('specifications')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'specifications' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <FileText className="w-5 h-5" />
                            <span>Lastenhefte</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('pipeline')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'pipeline' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Target className="w-5 h-5" />
                            <span>Pipeline</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('support')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'support' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                        >
                            <Inbox className="w-5 h-5" />
                            <span>Support</span>
                        </button>
                    </nav>

                    <div className="absolute bottom-6 left-6 right-6">
                        <button onClick={loadData} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
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
                            <h1 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h1>
                            <p className="text-gray-500 mt-1">Status der Nova Plattform im Blick behalten</p>
                        </div>
                        <div className="relative w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="P-XXXX, E-Mail oder Name suchen..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:ring-2 focus:ring-amber-200 outline-none"
                            />
                        </div>
                    </header>

                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 text-slate-500 mb-2">
                                        <ShoppingCart className="w-4 h-4" />
                                        <p className="text-xs uppercase font-semibold">Designs Verkauft</p>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.paidDesigns}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 text-green-600 mb-2">
                                        <CreditCard className="w-4 h-4" />
                                        <p className="text-xs uppercase font-semibold">Umsatz (Dummy)</p>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.revenue} €</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                                        <User className="w-4 h-4" />
                                        <p className="text-xs uppercase font-semibold">Leads Gesamt</p>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.totalConversations}</p>
                                </div>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 text-blue-500 mb-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <p className="text-xs uppercase font-semibold">Freigegeben</p>
                                    </div>
                                    <p className="text-3xl font-bold text-slate-900">{stats.approvedSpecifications}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center text-gray-500">Laden...</div>
                        ) : activeTab === 'leads' ? (
                            <div className="divide-y divide-gray-100">
                                {conversations.filter(c => {
                                    if (!searchQuery) return true;
                                    const pNum = (c as any).specifications?.[0]?.project_number || '';
                                    return c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        pNum.toLowerCase().includes(searchQuery.toLowerCase());
                                }).length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">Keine passenden Leads gefunden.</div>
                                ) : (
                                    conversations.filter(c => {
                                        if (!searchQuery) return true;
                                        const pNum = (c as any).specifications?.[0]?.project_number || '';
                                        return c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            pNum.toLowerCase().includes(searchQuery.toLowerCase());
                                    }).map(conv => (
                                        <div key={conv.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <div className="px-6 py-4 flex items-center justify-between cursor-pointer" onClick={() => setExpandedConvId(expandedConvId === conv.id ? null : conv.id)}>
                                                <div className="flex items-center gap-4">
                                                    <button onClick={(e) => { e.stopPropagation(); toggleReference(conv.id, !!conv.is_reference); }} className={`p-1.5 rounded-full transition-colors ${conv.is_reference ? 'text-amber-500 bg-amber-50' : 'text-gray-300 hover:text-amber-400'}`}>
                                                        <Star className={`w-5 h-5 ${conv.is_reference ? 'fill-current' : ''}`} />
                                                    </button>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900">
                                                                {(conv as any).specifications?.[0]?.project_number || `#${conv.id.slice(0, 8)}`}
                                                            </span>
                                                            <span className="text-xs text-gray-400 font-mono">{formatDate(conv.created_at)}</span>
                                                            {getStatusBadge(conv.status)}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5 truncate max-w-md">{getConversationPreview(conv.messages)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button onClick={(e) => handleDeleteConversation(e, conv.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    {expandedConvId === conv.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                                </div>
                                            </div>
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
                        ) : activeTab === 'specifications' ? (
                            <div className="divide-y divide-gray-100">
                                {specifications.filter(s => {
                                    if (!searchQuery) return true;
                                    const searchLower = searchQuery.toLowerCase();
                                    return (s.project_number?.toLowerCase().includes(searchLower)) ||
                                        (s.title?.toLowerCase().includes(searchLower));
                                }).map(spec => (
                                    <div key={spec.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 cursor-pointer" onClick={() => navigate(`/lastenheft/${spec.id}`, { state: { fromAdmin: true } })}>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-medium text-gray-900">{spec.title || 'Ohne Titel'}</span>
                                                    {spec.project_number && <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-mono">{spec.project_number}</span>}
                                                    {getStatusBadge(spec.status)}
                                                </div>
                                                <p className="text-sm text-gray-500">{spec.problem_summary?.slice(0, 100)}...</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={(e) => { e.stopPropagation(); handleOpenKnowledgeModal(spec); }} className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-full transition-colors" title="In Wissensdatenbank aufnehmen">
                                                    <Database className="w-5 h-5" />
                                                </button>
                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'pipeline' ? (
                            <div className="divide-y divide-gray-100">
                                <div className="bg-slate-50 px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">Design Phase (Bezahlt)</div>
                                {specifications.filter(s => s.is_design_paid && !s.released_to_dev)
                                    .sort((a, b) => (a.design_url === b.design_url) ? 0 : a.design_url ? 1 : -1)
                                    .map(spec => (
                                        <div key={spec.id} className={`px-6 py-4 flex items-center justify-between border-l-4 ${!spec.design_url ? 'border-red-500 bg-red-50/30' : 'border-amber-500'}`}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-bold text-slate-900">{spec.project_number}</p>
                                                    {!spec.design_url && <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] uppercase font-black rounded-sm animate-pulse">Handlungsbedarf (24h)</span>}
                                                </div>
                                                <p className="text-sm text-slate-500">{spec.title}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="Figma/Design URL..."
                                                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-72 focus:ring-2 focus:ring-amber-200 outline-none"
                                                        defaultValue={spec.design_url || ''}
                                                        onBlur={async (e) => {
                                                            if (e.target.value === spec.design_url) return;
                                                            await supabase.from('specifications').update({ design_url: e.target.value }).eq('id', spec.id);
                                                            loadData();
                                                        }}
                                                    />
                                                    {!spec.design_url && <div className="absolute -right-1 -top-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm" />}
                                                </div>
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${!spec.design_url ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {spec.design_url ? 'In Revision' : 'Wartet auf Design'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                <div className="bg-slate-50 px-6 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mt-4">Marktplatz (Börse)</div>
                                {specifications.filter(s => s.released_to_dev).map(spec => (
                                    <div key={spec.id} className="px-6 py-4 flex items-center justify-between border-l-4 border-green-500">
                                        <div>
                                            <p className="font-bold text-slate-900">{spec.project_number}</p>
                                            <p className="text-sm text-slate-500">{spec.title}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Live an Börse</span>
                                    </div>
                                ))}
                            </div>
                        ) : activeTab === 'support' ? (
                            <div className="divide-y divide-gray-100">
                                {supportMessages.length === 0 ? (
                                    <div className="p-12 text-center text-gray-500">Keine Support-Anfragen.</div>
                                ) : (
                                    supportMessages.map(msg => (
                                        <div key={msg.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between mb-1">
                                                <span className="font-bold text-slate-900">{msg.specifications?.project_number}</span>
                                                <span className="text-xs text-slate-400">{formatDate(msg.created_at)}</span>
                                            </div>
                                            <p className="text-sm text-slate-600 line-clamp-2">{msg.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : null}
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
