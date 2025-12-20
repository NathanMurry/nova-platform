import { useState } from 'react';
import { ArrowRight, Zap, Users, Building2, Briefcase, Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');

    const targetGroups = [
        { icon: Briefcase, label: "Selbstständige" },
        { icon: Users, label: "Teamleiter" },
        { icon: Building2, label: "Handwerk & Gewerbe" },
        { icon: Home, label: "Immobilien" }
    ];

    const handleStartChat = () => {
        if (inputValue.trim()) {
            navigate('/entrepreneur', { state: { initialMessage: inputValue } });
        } else {
            navigate('/entrepreneur');
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white selection:bg-amber-500 selection:text-white overflow-hidden">
            {/* Navigation */}
            <nav className="fixed w-full bg-slate-900/80 backdrop-blur-md z-50 border-b border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">
                                NOVA
                            </span>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <button
                                onClick={() => navigate('/developer')}
                                className="text-slate-400 hover:text-white transition-colors text-sm font-medium"
                            >
                                Für Entwickler
                            </button>
                            <button
                                onClick={() => navigate('/entrepreneur')}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full transition-all text-sm font-medium backdrop-blur-sm border border-white/10"
                            >
                                Login
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Centered Input */}
            <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 min-h-[80vh] flex flex-col justify-center">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wide uppercase mb-8">
                        <Zap className="w-3 h-3" />
                        AI-Powered Solutions
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                        Hinter jedem Problem <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                            steckt ein System.
                        </span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Wir liefern die systematische IT-Lösung dafür. Erzähl uns einfach, was nicht läuft – Nova analysiert, strukturiert und schafft Klarheit.
                    </p>

                    {/* Chat Input - The Main Interaction */}
                    <div className="max-w-xl mx-auto relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
                        <div className="relative flex items-center bg-slate-800 rounded-2xl border border-white/10 shadow-2xl p-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStartChat()}
                                placeholder="Z.B.: 'Meine Lagerverwaltung ist pures Chaos...'"
                                className="flex-1 bg-transparent border-none text-white placeholder-slate-500 px-4 py-3 focus:ring-0 text-lg outline-none w-full"
                                autoFocus
                            />
                            <button
                                onClick={handleStartChat}
                                className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-amber-500/25"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-3 text-left pl-4">
                            Drücke <strong>Enter</strong> um zu starten • Sofort-Analyse deines Systems
                        </p>
                    </div>

                    {/* Target Groups */}
                    <div className="mt-20 pt-10 border-t border-white/5">
                        <p className="text-slate-500 text-sm font-medium mb-6 uppercase tracking-wider">Erprobte Lösungen für</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            {targetGroups.map((group, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-5 py-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-default">
                                    <group.icon className="w-5 h-5 text-amber-500" />
                                    <span className="text-slate-300 font-medium">{group.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Abstract Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10"></div>
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -z-10"></div>
            </main>

            {/* How it works - Step by Step */}
            <section className="py-24 bg-slate-900/50 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Dein Weg zur perfekten IT-Lösung</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">
                            Kein Fachchinesisch, keine komplizierten Lastenhefte. Wir führen dich Schritt für Schritt durch den Prozess.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-4 gap-8">
                        <div className="space-y-4 relative">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <span className="text-amber-500 font-bold text-xl">1</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Verständnis</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Du erzählst dem Bot, was dich nervt. Wir analysieren das System hinter deinem Problem.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <span className="text-amber-500 font-bold text-xl">2</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Klarheit</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Du erhältst ein professionelles Lastenheft, das deine Anforderungen perfekt auf den Punkt bringt.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <span className="text-amber-500 font-bold text-xl">3</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Vision</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Wir erstellen einen maßgeschneiderten, visuellen Entwurf (Mockup) deiner zukünftigen Software.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center border border-white/10 shadow-lg">
                                <span className="text-amber-500 font-bold text-xl">4</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Umsetzung</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Dein Auftrag geht an Experten auf unserer Börse, die deine Lösung schnell und zuverlässig bauen.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 py-12 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-slate-600 text-sm">
                    <p>© 2024 Nova Platform. Systematische IT-Lösungen.</p>
                    <button onClick={() => navigate('/admin')} className="hover:text-slate-400 transition-colors">
                        Admin Login
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
