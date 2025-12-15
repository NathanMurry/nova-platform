import { ArrowLeft, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ProjectList = () => {
    const navigate = useNavigate();

    // Mock Data
    const projects = [
        { id: 1, title: 'CRM für Handwerksbetrieb', budget: '5.000€ - 8.000€', timeline: '4 Wochen', type: 'Fullstack' },
        { id: 2, title: 'Warenwirtschaftssystem Bäckerei', budget: '12.000€ - 15.000€', timeline: '8 Wochen', type: 'Web App' },
        { id: 3, title: 'Terminbuchung Friseursalon', budget: '3.000€ - 5.000€', timeline: '2 Wochen', type: 'Frontend' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => navigate('/')}
                                className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <span className="font-bold text-xl text-gray-900">Nova <span className="text-blue-600 font-normal">Developers</span></span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">Angemeldet als Developer</span>
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">D</div>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Verfügbare Projekte</h2>
                    <p className="text-gray-600 mt-2">Geprüfte Lastenhefte, bereit für die Umsetzung.</p>
                </div>

                <div className="grid gap-6">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center space-x-3 mb-2">
                                        <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                            {project.type}
                                        </span>
                                        <span className="text-xs text-gray-400">Vor 2 Std.</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {project.title}
                                    </h3>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
                            </div>

                            <div className="mt-6 flex items-center space-x-8">
                                <div className="flex items-center text-gray-600">
                                    <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                                    <span className="font-medium text-gray-900">{project.budget}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                    <span>{project.timeline}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default ProjectList;
