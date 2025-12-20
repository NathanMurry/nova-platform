import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    FileText,
    Euro,
    Users,
    Building2,
    Target,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Send,
    Download,
    Loader2,
    Lock,
    Eye,
    Zap
} from 'lucide-react';
import { loadLastenheft, addComment, updateLastenheft } from '../../lib/lastenheft';
import { supabase } from '../../lib/supabase';

interface Requirement {
    id: string;
    category: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
}

interface Comment {
    id: string;
    author: 'entrepreneur' | 'nova';
    content: string;
    timestamp: string;
}

interface LastenheftData {
    id: string;
    title: string;
    problem_summary: string;
    requirements: Requirement[];
    industry: string;
    team_size: string;
    budget_range: string;
    desired_outcome: string;
    status: string;
    comments: Comment[];
    created_at: string;
    entrepreneur_id?: string | null;
}

const LastenheftView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [lastenheft, setLastenheft] = useState<LastenheftData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [isSendingComment, setIsSendingComment] = useState(false);
    const [isApproving, setIsApproving] = useState(false);

    // Gate & Contact State
    const [isGateOpen, setIsGateOpen] = useState(false);
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);

    // Offer Modal State
    const [showOfferModal, setShowOfferModal] = useState(false);

    useEffect(() => {
        const fetchLastenheft = async () => {
            if (!id) {
                setError('Keine Lastenheft-ID angegeben');
                setIsLoading(false);
                return;
            }

            try {
                const data = await loadLastenheft(id);
                if (data) {
                    setLastenheft(data as LastenheftData);

                    // Check if gate should be open (if entrepreneur_id is set)
                    if (data.entrepreneur_id) {
                        setIsGateOpen(true);
                    }
                } else {
                    setError('Lastenheft nicht gefunden');
                }
            } catch (err) {
                setError('Fehler beim Laden des Lastenhefts');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLastenheft();
    }, [id]);

    // Parse desired_outcome
    const parseDesiredOutcome = () => {
        if (!lastenheft?.desired_outcome) return null;
        try {
            return JSON.parse(lastenheft.desired_outcome);
        } catch (e) {
            return null;
        }
    };

    const outcome = parseDesiredOutcome();

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !contactName.trim() || !contactEmail.trim()) return;

        setIsSubmittingContact(true);
        try {
            // 1. Create Entrepreneur Record
            const { data: entrepreneur, error: entError } = await supabase
                .from('entrepreneurs')
                .insert({
                    name: contactName,
                    email: contactEmail,
                })
                .select()
                .single();

            if (entError) throw entError;

            // 2. Link to Specification
            const { error: specError } = await supabase
                .from('specifications')
                .update({ entrepreneur_id: entrepreneur.id })
                .eq('id', id);

            if (specError) throw specError;

            setIsGateOpen(true);
        } catch (err) {
            console.error('Contact submit error:', err);
            alert('Fehler beim Speichern der Kontaktdaten. Bitte versuchen Sie es erneut.');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    const handleAddComment = async () => {
        if (!id || !newComment.trim()) return;

        setIsSendingComment(true);
        try {
            const updated = await addComment(id, 'entrepreneur', newComment);
            if (updated) {
                setLastenheft(updated as LastenheftData);
                setNewComment('');
            }
        } finally {
            setIsSendingComment(false);
        }
    };

    const handleApprove = async () => {
        if (!id) return;

        setIsApproving(true);
        try {
            const updated = await updateLastenheft(id, { status: 'approved' });
            if (updated) {
                setLastenheft(updated as LastenheftData);
            }
        } finally {
            setIsApproving(false);
        }
    };

    const handleOrderDraft = () => {
        setShowOfferModal(true);
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 border-red-200';
            case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'low': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'high': return 'Hoch';
            case 'medium': return 'Mittel';
            case 'low': return 'Niedrig';
            default: return priority;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">Entwurf</span>;
            case 'review':
                return <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-full text-sm">In Prüfung</span>;
            case 'approved':
                return <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Freigegeben
                </span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    <span className="text-lg text-gray-600">Lastenheft wird geladen...</span>
                </div>
            </div>
        );
    }

    if (error || !lastenheft) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Fehler</h1>
                    <p className="text-gray-600 mb-6">{error || 'Lastenheft nicht gefunden'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                        Zur Startseite
                    </button>
                </div>
            </div>
        );
    }

    // CONTACT GATE
    if (!isGateOpen) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex flex-col items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-100 p-8 text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Lastenheft freischalten</h1>
                    <p className="text-gray-600 mb-8">
                        Ihr Lastenheft wurde erfolgreich generiert! Bitte geben Sie Ihre Kontaktdaten ein, um es anzusehen und zu bearbeiten.
                    </p>

                    <form onSubmit={handleContactSubmit} className="space-y-4 text-left">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                placeholder="Max Mustermann"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail Adresse</label>
                            <input
                                type="email"
                                required
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
                                placeholder="max@firma.de"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmittingContact}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isSubmittingContact ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                            Jetzt ansehen
                        </button>
                    </form>
                    <p className="text-xs text-center text-gray-400 mt-4">
                        Ihre Daten werden sicher gespeichert und nur für die Kommunikation zu diesem Projekt verwendet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white relative">
            {/* Header */}
            <header className="bg-white border-b border-amber-100 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-amber-50 rounded-full transition-colors text-gray-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-lg flex items-center justify-center text-white">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">Lastenheft</h1>
                                <p className="text-sm text-gray-500">
                                    Erstellt am {new Date(lastenheft.created_at).toLocaleDateString('de-DE')}
                                </p>
                            </div>
                        </div>
                    </div>
                    {getStatusBadge(lastenheft.status)}
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-8">
                {/* Titel & Zusammenfassung */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{lastenheft.title}</h2>
                    <p className="text-gray-600 leading-relaxed">{lastenheft.problem_summary}</p>
                </section>

                {/* Quick Stats */}
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Building2 className="w-4 h-4" />
                            <span className="text-sm">Branche</span>
                        </div>
                        <p className="font-semibold text-gray-900">{lastenheft.industry || 'Nicht angegeben'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">Team</span>
                        </div>
                        <p className="font-semibold text-gray-900">{lastenheft.team_size || 'Nicht angegeben'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Euro className="w-4 h-4" />
                            <span className="text-sm">Budget</span>
                        </div>
                        <p className="font-semibold text-gray-900">{lastenheft.budget_range || 'Nicht angegeben'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Target className="w-4 h-4" />
                            <span className="text-sm">Ziel</span>
                        </div>
                        <p className="font-semibold text-gray-900 truncate">
                            {outcome?.aufwand || 'System-Lösung'}
                        </p>
                    </div>
                </section>

                {/* DESIGN DRAFT OFFER - PROMINENT */}
                <section className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8 border border-slate-700">
                    <div className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-left">
                            <h3 className="text-2xl font-bold text-white mb-2">Visueller Entwurf gefällig?</h3>
                            <p className="text-slate-300 max-w-lg">
                                Wir erstellen Ihnen einen professionellen Design-Entwurf (Mockup) Ihrer App in nur 24 Stunden.
                                Sehen Sie genau, wie die Lösung aussehen wird.
                            </p>
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-3xl font-bold text-amber-400 mb-2">199 €</span>
                            <button
                                onClick={handleOrderDraft}
                                className="px-8 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-amber-500/25 transform hover:-translate-y-1 whitespace-nowrap"
                            >
                                Jetzt Entwurf anfordern
                            </button>
                            <span className="text-xs text-slate-500 mt-2">Innerhalb von 24h • Professionelles Mockup</span>
                        </div>
                    </div>
                </section>

                {/* Tech Stack & Details */}
                {outcome && (
                    <section className="grid md:grid-cols-2 gap-6 mb-8">
                        {/* Tech Stack */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Technischer Ansatz
                            </h3>
                            <div className="space-y-4">
                                {outcome.techStack && Object.entries(outcome.techStack).map(([key, value]) => (
                                    <div key={key} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                                        <span className="text-gray-500 capitalize">{key}</span>
                                        <span className="font-medium text-gray-900">{value as string}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Definition of Done */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Akzeptanzkriterien
                            </h3>
                            <div className="space-y-2">
                                {outcome.definitionOfDone && outcome.definitionOfDone.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                        <div className="mt-1 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Anforderungen */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-amber-500" />
                        Anforderungen
                    </h3>
                    <div className="space-y-3">
                        {lastenheft.requirements && lastenheft.requirements.length > 0 ? (
                            lastenheft.requirements.map((req, idx) => (
                                <div
                                    key={req.id || idx}
                                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl"
                                >
                                    <span className="text-sm font-mono text-gray-400 mt-0.5">
                                        {req.id || `REQ-${String(idx + 1).padStart(3, '0')}`}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-500">{req.category}</span>
                                            <span className={`px-2 py-0.5 text-xs rounded-full border ${getPriorityColor(req.priority)}`}>
                                                {getPriorityLabel(req.priority)}
                                            </span>
                                        </div>
                                        <p className="text-gray-800">{req.description}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">Keine Anforderungen definiert</p>
                        )}
                    </div>
                </section>

                {/* Kommentare */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-amber-500" />
                        Kommentare & Anmerkungen
                    </h3>

                    {/* Kommentar-Liste */}
                    <div className="space-y-4 mb-4">
                        {lastenheft.comments && lastenheft.comments.length > 0 ? (
                            lastenheft.comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className={`p-4 rounded-xl ${comment.author === 'entrepreneur'
                                        ? 'bg-amber-50 border border-amber-100'
                                        : 'bg-gray-50 border border-gray-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-gray-900">
                                            {comment.author === 'entrepreneur' ? 'Sie' : 'Nova'}
                                        </span>
                                        <span className="text-sm text-gray-400">
                                            {new Date(comment.timestamp).toLocaleString('de-DE')}
                                        </span>
                                    </div>
                                    <p className="text-gray-700">{comment.content}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">
                                Noch keine Kommentare. Haben Sie Anmerkungen?
                            </p>
                        )}
                    </div>

                    {/* Neuer Kommentar */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            placeholder="Schreiben Sie einen Kommentar..."
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || isSendingComment}
                            className="px-4 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                        >
                            {isSendingComment ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                </section>

                {/* Aktions-Buttons */}
                <section className="flex flex-col sm:flex-row gap-4">
                    {lastenheft.status !== 'approved' && (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg disabled:opacity-50"
                        >
                            {isApproving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <CheckCircle className="w-5 h-5" />
                            )}
                            Lastenheft freigeben
                        </button>
                    )}
                    <button
                        onClick={() => {/* TODO: PDF Export */ }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                    >
                        <Download className="w-5 h-5" />
                        Als PDF herunterladen
                    </button>
                </section>
            </main>

            {/* OFFER INFO MODAL */}
            {showOfferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Anfrage erfolgreich!</h3>
                        <p className="text-gray-600 mb-6">
                            Wir erstellen Ihren individuellen Design-Entwurf. Sie erhalten diesen <strong>innerhalb von 24 Stunden per E-Mail</strong> an <em>{contactEmail}</em>.
                        </p>
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-8 text-left">
                            <p className="text-sm text-blue-800 mb-2"><strong>ℹ️ Nächste Schritte:</strong></p>
                            <p className="text-sm text-blue-700">
                                Wir erstellen nun Ihren individuellen Design-Entwurf für 199 €. Sie erhalten innerhalb von 24 Stunden eine Vorschau und die Rechnung per E-Mail.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowOfferModal(false)}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
                        >
                            Verstanden
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LastenheftView;
