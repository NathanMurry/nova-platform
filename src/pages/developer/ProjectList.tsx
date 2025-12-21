import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, DollarSign, ChevronRight, Layout, Sparkles, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Specification } from '../../lib/database.types';

const ProjectList = () => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Specification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('specifications')
                .select('*')
                .eq('released_to_dev', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (err) {
            console.error('Fehler beim Laden:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Minimalist Tech Header */}
            <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <Layout className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <span className="font-bold text-xl text-white block leading-tight">Nova <span className="text-blue-500 font-medium font-mono text-sm uppercase tracking-widest ml-1">Marketplace</span></span>
                                    <span className="text-xs text-slate-500 font-mono">Verified Specifications Only</span>
                                </div>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-6">
                            <div className="text-right">
                                <p className="text-sm font-bold text-white leading-none">Developer Access</p>
                                <p className="text-[10px] text-blue-500 font-mono uppercase tracking-tighter">Verified Account</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-blue-500 border border-slate-700 shadow-xl">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="mb-12">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Offene Projekte</h2>
                    <p className="text-lg text-slate-500 max-w-2xl leading-relaxed">
                        Hier findest du Projekte, die bereits ein fertiges Design haben und vom Kunden für die Umsetzung freigegeben wurden.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                        <span className="text-slate-400 font-mono text-sm uppercase">Synchronizing with DB...</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-20 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Clock className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Keine neuen Projekte</h3>
                        <p className="text-slate-500">Aktuell sind alle Projekte vergeben oder noch in der Design-Phase.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => navigate(`/lastenheft/${project.id}`)}
                                className="group bg-white rounded-2xl border border-slate-200 p-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                {project.project_number}
                                            </span>
                                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-blue-100">
                                                {project.industry || 'IT Solution'}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">
                                            {project.problem_summary}
                                        </p>
                                    </div>

                                    <div className="flex flex-row md:flex-col items-center md:items-end gap-6 md:gap-4 md:min-w-[200px] pt-6 md:pt-0 border-t md:border-t-0 border-slate-100">
                                        <div className="flex items-center text-slate-400 group-hover:text-slate-900 transition-colors">
                                            <DollarSign className="w-5 h-5 mr-3 text-blue-500" />
                                            <div>
                                                <span className="text-sm font-bold block leading-none">{project.budget_range || 'Auf Anfrage'}</span>
                                                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-50">Budget</span>
                                            </div>
                                        </div>
                                        <button className="ml-auto md:ml-0 p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight className="w-6 h-6" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-20 p-10 bg-slate-900 rounded-3xl text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 blur-[100px] opacity-10 pointer-events-none" />
                    <h3 className="text-2xl font-bold text-white mb-4">Interesse an einem Projekt?</h3>
                    <p className="text-slate-400 mb-8 max-w-md mx-auto">
                        Nova übernimmt das Anforderungs-Management und Design. Du kannst dich voll auf die Umsetzung konzentrieren.
                    </p>
                    <button className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95">
                        Kontakt Nova Support
                    </button>
                </div>
            </main>
        </div>
    );
};

export default ProjectList;
