import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Loader2, Key } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [projectNumber, setProjectNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Suchen nach der Specification mit Email + Projektnummer
            const { data, error: specError } = await supabase
                .from('specifications')
                .select('id, entrepreneurs!inner(email)')
                .eq('project_number', projectNumber.toUpperCase())
                .eq('entrepreneurs.email', email.toLowerCase())
                .single();

            if (specError || !data) {
                throw new Error('Projekt oder E-Mail nicht gefunden. Bitte überprüfe deine Angaben.');
            }

            // Erfolg: Zum Lastenheft navigieren
            navigate(`/lastenheft/${data.id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-3xl shadow-xl border border-amber-100 p-10">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-8 mx-auto">
                        <Key className="w-8 h-8 text-amber-600" />
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">Willkommen zurück</h1>
                    <p className="text-gray-500 text-center mb-8">
                        Gib deine Daten ein, um auf dein Projekt-Portal zuzugreifen.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">E-Mail Adresse</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50 outline-none transition-all"
                                placeholder="name@firma.de"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Projektnummer</label>
                            <input
                                type="text"
                                required
                                value={projectNumber}
                                onChange={(e) => setProjectNumber(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-50 outline-none transition-all font-mono uppercase"
                                placeholder="P-2025-XXXX"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 group disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Anmelden
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-400 mt-8 text-sm">
                    Noch kein Projekt? <button onClick={() => navigate('/')} className="text-amber-600 font-semibold hover:underline">Jetzt starten</button>
                </p>
            </div>
        </div>
    );
};

export default Login;
