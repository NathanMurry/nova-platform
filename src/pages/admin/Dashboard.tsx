import { useState, useEffect } from 'react';
import {
    ArrowLeft,
    FileText,
    MessageSquare,
    RefreshCw,
    ExternalLink,
    Clock,
    CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface Conversation {
    id: string;
    entrepreneur_id: string | null;
    messages: any[];
    status: string;
    created_at: string;
}

interface Specification {
    id: string;
    title: string;
    problem_summary: string;
    status: string;
    industry: string;
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

            if (convError) {
                console.error('Fehler beim Laden der Gespräche:', convError);
            } else {
                setConversations(convData || []);
            }

            // Lastenhefte laden
            const { data: specData, error: specError } = await supabase
                .from('specifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (specError) {
                console.error('Fehler beim Laden der Lastenhefte:', specError);
            } else {
                setSpecifications(specData || []);
            }

            // Stats berechnen
            const activeConvs = (convData || []).filter(c => c.status === 'active').length;
            const approvedSpecs = (specData || []).filter(s => s.status === 'approved').length;

            setStats({
                totalConversations: (convData || []).length,
                activeConversations: activeConvs,
                totalSpecifications: (specData || []).length,
                approvedSpecifications: approvedSpecs
            });

        } catch (err) {
            console.error('Fehler beim Laden:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Aktiv
                    </span>
                );
            case 'completed':
                return (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Abgeschlossen
                    </span>
                );
            case 'draft':
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        Entwurf
                    </span>
                );
            case 'approved':
                return (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Freigegeben
                    </span>
                );
            case 'review':
                return (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                        In Prüfung
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {status}
                    </span>
                );
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `vor ${diffMins} Min.`;
        if (diffHours < 24) return `vor ${diffHours}h`;
        if (diffDays < 7) return `vor ${diffDays} Tagen`;
        return date.toLocaleDateString('de-DE');
    };

    const getConversationPreview = (messages: any[]) => {
        if (!messages || messages.length === 0) return 'Kein Inhalt';
        const lastUserMsg = [...messages].reverse().find(m => m.type === 'user');
        if (lastUserMsg) {
            const content = lastUserMsg.content;
            return content.length > 60 ? content.substring(0, 60) + '...' : content;
        }
        return 'Kein Benutzer-Input';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 bg-gray-900 min-h-screen p-6 text-white fixed h-full">
                    <div
                        className="mb-10 flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => navigate('/')}
                    >
                        <ArrowLeft className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-xl tracking-tight">
                            NOVA <span className="text-gray-500 text-sm font-normal">Admin</span>
                        </span>
                    </div>

                    <nav className="space-y-2">
                        <button
                            onClick={() => setActiveTab('conversations')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'conversations'
                                ? 'bg-amber-500 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <MessageSquare className="w-5 h-5" />
                            <span>Gespräche</span>
                            {stats.activeConversations > 0 && (
                                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {stats.activeConversations}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('specifications')}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'specifications'
                                ? 'bg-amber-500 text-white'
                                : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            <span>Lastenhefte</span>
                            {stats.totalSpecifications > 0 && (
                                <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                    {stats.totalSpecifications}
                                </span>
                            )}
                        </button>
                    </nav>

                    <div className="absolute bottom-6 left-6 right-6">
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            <span>Aktualisieren</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="ml-64 flex-1 p-8">
                    {/* Header */}
                    <header className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {activeTab === 'conversations' ? 'Gespräche' : 'Lastenhefte'}
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {activeTab === 'conversations'
                                    ? 'Alle Chat-Konversationen mit Unternehmern'
                                    : 'Generierte Anforderungsdokumente'
                                }
                            </p>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Gespräche</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalConversations}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Aktiv</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.activeConversations}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Lastenhefte</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalSpecifications}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider">Freigegeben</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.approvedSpecifications}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="p-12 text-center">
                                <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">Daten werden geladen...</p>
                            </div>
                        ) : activeTab === 'conversations' ? (
                            /* Conversations List */
                            <div className="divide-y divide-gray-100">
                                {conversations.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">Noch keine Gespräche vorhanden</p>
                                    </div>
                                ) : (
                                    conversations.map((conv) => (
                                        <div
                                            key={conv.id}
                                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-medium text-gray-900">
                                                            Gespräch #{conv.id.slice(0, 8)}
                                                        </span>
                                                        {getStatusBadge(conv.status)}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {getConversationPreview(conv.messages)}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {conv.messages?.length || 0} Nachrichten • {formatDate(conv.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        ) : (
                            /* Specifications List */
                            <div className="divide-y divide-gray-100">
                                {specifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500">Noch keine Lastenhefte vorhanden</p>
                                    </div>
                                ) : (
                                    specifications.map((spec) => (
                                        <div
                                            key={spec.id}
                                            onClick={() => navigate(`/lastenheft/${spec.id}`)}
                                            className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <span className="font-medium text-gray-900">
                                                            {spec.title || 'Ohne Titel'}
                                                        </span>
                                                        {getStatusBadge(spec.status)}
                                                        {spec.industry && (
                                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                                                {spec.industry}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500">
                                                        {spec.problem_summary?.slice(0, 100) || 'Keine Beschreibung'}
                                                        {spec.problem_summary?.length > 100 ? '...' : ''}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {formatDate(spec.created_at)}
                                                    </p>
                                                </div>
                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
