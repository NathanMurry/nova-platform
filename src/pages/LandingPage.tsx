import { ArrowRight, Code, ShieldCheck, Zap, Users, Building2, Briefcase, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    const targetGroups = [
        { icon: Briefcase, label: "Selbstständige" },
        { icon: Users, label: "Teamleiter" },
        { icon: Building2, label: "Handwerksbetriebe" },
        { icon: Home, label: "Vermieter" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
            {/* Navigation */}
            <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-slate-700">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-bold text-2xl tracking-tight">
                            NOVA
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button
                                onClick={() => navigate('/developer')}
                                className="text-slate-400 hover:text-white transition-colors font-medium"
                            >
                                Für Developer
                            </button>
                            <button
                                onClick={() => navigate('/entrepreneur')}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-2.5 rounded-full hover:from-amber-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-lg font-medium"
                            >
                                Problem lösen
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Clean, No Images */}
            <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Target Groups Pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-8">
                        {targetGroups.map((group, idx) => (
                            <div key={idx} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 rounded-full text-sm border border-slate-700">
                                <group.icon className="w-4 h-4 text-amber-400" />
                                {group.label}
                            </div>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
                        IT-Probleme?<br />
                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            Wir übersetzen.
                        </span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Egal ob Selbstständige, Teamleiter, Handwerker oder Vermieter –
                        schildern Sie Ihr Problem in <span className="text-white font-medium">Ihren Worten</span>.
                        Wir finden die passende IT-Lösung.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/entrepreneur')}
                            className="group flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-5 rounded-full text-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-2xl hover:shadow-amber-500/25 hover:-translate-y-1"
                        >
                            Jetzt Problem schildern
                            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-slate-500">
                        ✓ Kostenlos ✓ Unverbindlich ✓ In 5 Minuten
                    </p>
                </div>

                {/* Abstract Decorative Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Who is Nova for? */}
            <div className="py-20 bg-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Für wen ist Nova?</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Für alle, die keine Zeit für IT haben – aber trotzdem smarte Lösungen brauchen.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-colors">
                            <Briefcase className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Selbstständige</h3>
                            <p className="text-slate-400 text-sm">Rechnungen, Termine, Kundendaten – alles im Griff.</p>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-colors">
                            <Users className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Teamleiter</h3>
                            <p className="text-slate-400 text-sm">Projektübersicht, Kommunikation, Zeiterfassung.</p>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-colors">
                            <Building2 className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Handwerksbetriebe</h3>
                            <p className="text-slate-400 text-sm">Auftragsmanagement, Angebote, Materialplanung.</p>
                        </div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-amber-500/50 transition-colors">
                            <Home className="w-10 h-10 text-amber-400 mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">Vermieter</h3>
                            <p className="text-slate-400 text-sm">Mieterverwaltung, Nebenkostenabrechnung, Reparaturen.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">So einfach funktioniert's</h2>
                        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                            Kein Technik-Studium nötig. Erzählen Sie uns einfach, was Sie stört.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">1. Problem schildern</h3>
                            <p className="text-slate-400">
                                Erzählen Sie in Ihren Worten, was Sie im Alltag stört. Keine Fachbegriffe nötig.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">2. Lösung verstehen</h3>
                            <p className="text-slate-400">
                                Wir übersetzen Ihr Problem in einen klaren Plan – mit echten Kosten, ohne Überraschungen.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-amber-500/30 transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Code className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">3. Entwickler finden</h3>
                            <p className="text-slate-400">
                                Qualifizierte Entwickler sehen Ihr Projekt und bewerben sich – Sie wählen aus.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 bg-gradient-to-r from-amber-500 to-orange-500">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Bereit, Ihr Problem zu lösen?
                    </h2>
                    <p className="text-xl text-amber-100 mb-10 max-w-2xl mx-auto">
                        Keine Verpflichtungen. Einfach erzählen, was Sie stört – wir kümmern uns um den Rest.
                    </p>
                    <button
                        onClick={() => navigate('/entrepreneur')}
                        className="group inline-flex items-center gap-3 bg-white text-amber-600 px-10 py-5 rounded-full text-xl font-bold hover:bg-gray-50 transition-all shadow-2xl hover:-translate-y-1"
                    >
                        Jetzt kostenlos starten
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-slate-900 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-slate-500 text-sm">
                    <p>© 2024 Nova Platform. Alle Rechte vorbehalten.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="hover:text-slate-300 transition-colors"
                    >
                        🔒
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
