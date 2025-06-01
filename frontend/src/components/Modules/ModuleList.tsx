import React, { useEffect } from 'react';
import { useModuleStore } from '../../store/moduleStore';

const ModuleList: React.FC = () => {
  const { modules, activeModuleId, fetchAllModules, setActiveModule, isLoading, error } = useModuleStore();

  useEffect(() => {
    fetchAllModules();
  }, [fetchAllModules]);

  if (isLoading && Object.keys(modules).length === 0) return <div className="p-2">Loading modules...</div>;
  if (error) return <div className="p-2 text-red-500">Error: {error}</div>;
  if (Object.keys(modules).length === 0) return <div className="p-2">No modules available.</div>;

  return (
    <nav className="w-64 h-full bg-gray-800 text-white p-4 space-y-2 overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 sticky top-0 bg-gray-800 py-2">Modules</h2>
      {Object.values(modules).map((module) => (
        <button
          key={module.id}
          onClick={() => setActiveModule(module.id)}
          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 focus:outline-none transition-colors duration-150 ${
            activeModuleId === module.id ? 'bg-blue-600 font-semibold' : 'bg-gray-700'
          }`}
          title={module.description || module.name} // Show description on hover
        >
          {module.icon && <span className="mr-2">{module.icon}</span> /* Basic icon placeholder */}
          {module.name}
        </button>
      ))}
    </nav>
  );
};

export default ModuleList;
