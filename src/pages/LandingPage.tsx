import { ArrowRight, Code, ShieldCheck, Zap, Quote } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const navigate = useNavigate();

    const testimonials = [
        {
            name: "Thomas Müller",
            role: "Bäckermeister",
            image: "/images/baker.png",
            quote: "Endlich jemand, der meine Sprache spricht. Ich wollte nur meine Bestellungen besser verwalten – Nova hat verstanden, was ich brauche."
        },
        {
            name: "Sandra Weber",
            role: "Friseurmeisterin",
            image: "/images/hairdresser.png",
            quote: "Ich hatte immer Angst vor IT-Projekten. Bei Nova fühlte ich mich verstanden, nicht überfordert."
        },
        {
            name: "Klaus Hoffmann",
            role: "Elektrikermeister",
            image: "/images/craftsman.png",
            quote: "Papierkram ist mein größter Feind. Nova hat mir gezeigt, dass es auch anders geht."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
            {/* Navigation */}
            <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-amber-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent font-bold text-2xl tracking-tight">
                            NOVA
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button
                                onClick={() => navigate('/developer')}
                                className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
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

            {/* Hero Section with Images */}
            <div className="relative pt-24 pb-16 lg:pt-32 lg:pb-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left: Text Content */}
                        <div className="text-left">
                            <div className="inline-block px-4 py-2 bg-amber-100 text-amber-800 rounded-full text-sm font-medium mb-6">
                                Für Kleinunternehmer wie Sie
                            </div>
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
                                Keine Zeit für IT? <br />
                                <span className="bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Wir übersetzen.</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                Sie konzentrieren sich auf Ihr Handwerk. Wir verstehen Ihre Herausforderungen und finden die passende IT-Lösung – ohne Fachchinesisch, ohne Stress.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button
                                    onClick={() => navigate('/entrepreneur')}
                                    className="group flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
                                >
                                    Jetzt Problem schildern
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                            <p className="mt-4 text-sm text-gray-500">✓ Kostenlos ✓ Unverbindlich ✓ In 5 Minuten</p>
                        </div>

                        {/* Right: Image Grid */}
                        <div className="relative">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                                        <img
                                            src="/images/baker.png"
                                            alt="Bäcker bei der Arbeit"
                                            className="w-full h-48 object-cover"
                                        />
                                    </div>
                                    <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                                        <img
                                            src="/images/craftsman.png"
                                            alt="Handwerker mit Papierkram"
                                            className="w-full h-64 object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="pt-8">
                                    <div className="rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300">
                                        <img
                                            src="/images/hairdresser.png"
                                            alt="Friseurin im Salon"
                                            className="w-full h-80 object-cover"
                                        />
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-200 rounded-full opacity-50 blur-2xl"></div>
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-orange-200 rounded-full opacity-50 blur-2xl"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Trust Bar */}
            <div className="py-8 bg-white border-y border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-gray-500 text-sm font-medium">
                        Vertraut von <span className="text-gray-900 font-bold">Bäckereien</span>, <span className="text-gray-900 font-bold">Friseursalons</span>, <span className="text-gray-900 font-bold">Handwerksbetrieben</span> und vielen mehr
                    </p>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">So einfach funktioniert's</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">Kein Technik-Studium nötig. Erzählen Sie uns einfach, was Sie stört.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Zap className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">1. Problem schildern</h3>
                            <p className="text-gray-600">
                                Erzählen Sie in Ihren Worten, was Sie im Alltag stört. Keine Fachbegriffe nötig.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <ShieldCheck className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">2. Lösung verstehen</h3>
                            <p className="text-gray-600">
                                Wir übersetzen Ihr Problem in einen klaren Plan – mit echten Kosten, ohne Überraschungen.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-3xl border border-amber-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                                <Code className="w-7 h-7 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">3. Entwickler finden</h3>
                            <p className="text-gray-600">
                                Qualifizierte Entwickler sehen Ihr Projekt und bewerben sich – Sie wählen aus.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="py-24 bg-gradient-to-b from-white to-amber-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Das sagen unsere Kunden</h2>
                        <p className="text-xl text-gray-600">Echte Unternehmer, echte Geschichten</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                                <Quote className="w-10 h-10 text-amber-300 mb-4" />
                                <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <img
                                        src={testimonial.image}
                                        alt={testimonial.name}
                                        className="w-14 h-14 rounded-full object-cover border-2 border-amber-200"
                                    />
                                    <div>
                                        <p className="font-bold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-amber-600">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
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
            <footer className="bg-gray-900 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center text-gray-400 text-sm">
                    <p>© 2024 Nova Platform. Alle Rechte vorbehalten.</p>
                    <button
                        onClick={() => navigate('/admin')}
                        className="hover:text-gray-200 transition-colors"
                    >
                        🔒
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
