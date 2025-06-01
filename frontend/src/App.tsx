import React, { useEffect } from 'react';
import Layout from './components/LayoutSystem/Layout';
import ModuleList from './components/Modules/ModuleList';
import { useLayoutStore } from './store/layoutStore';
import { useModuleStore } from './store/moduleStore';
import { LayoutConfig as GlobalLayoutConfig } from './types'; // For handleCreateDefaultLayout
import './App.css';

function App() {
  const {
    layouts,
    activeLayoutId,
    isLoading: layoutIsLoading,
    error: layoutError,
    saveLayoutToServer: saveLayout, // Renamed for clarity in this component
    setActiveLayout
  } = useLayoutStore();

  const {
    activeModuleId: currentActiveModule,
    isLoading: modulesIsLoading,
    // error: moduleError, // moduleError is handled within ModuleList for now
  } = useModuleStore();

  useEffect(() => {
    // This effect might be simplified or removed if module selection
    // is the sole driver for layout changes and initial loading.
    // For example, if no module is auto-selected, the UI will prompt to select one.
    // If a module IS auto-selected (e.g. last used, or first in list by moduleStore),
    // then setActiveModule in moduleStore would trigger layout loading.

    // If there's no active module, and no active layout, but some layouts exist (e.g. standalone)
    // this could set a default layout. However, this might conflict with module logic.
    // if (!currentActiveModule && !activeLayoutId && Object.keys(layouts).length > 0) {
    //   setActiveLayout(Object.keys(layouts)[0]);
    // }
  }, [layouts, activeLayoutId, setActiveLayout, currentActiveModule]);

  const handleCreateDefaultLayout = async () => {
    const defaultLayout: GlobalLayoutConfig = {
      id: 'standaloneLayout_' + Date.now(),
      direction: 'vertical', // Changed to vertical
      panes: [
        { id: 'fpane1', size: 20, view: { id: 'fview1', type: 'text', content: 'Standalone Layout - Pane 1 (updated)' } }, // Size updated
        { id: 'fpane2', size: 20, view: { id: 'fview2', type: 'html', content: '<h2>Standalone Layout</h2><p>Pane 2 (updated)</p>' } }, // Size updated
        { id: 'fpane3', size: 20, view: {id: 'fview3', type: 'text', content: 'Original Pane 3 Content'} }, // Size updated, added view for consistency
        { id: 'fpane4', size: 20, view: { id: 'fview4', type: 'webhook_trigger', content: { webhookUrl: "https://jsonplaceholder.typicode.com/todos/1", buttonText: "Fetch TODO 1 (GET)", method: "GET" } } }, // New
        { id: 'fpane5', size: 20, view: { id: 'fview5', type: 'webhook_trigger', content: { webhookUrl: "https://jsonplaceholder.typicode.com/posts", buttonText: "Create Post (POST)", method: "POST", requestBody: { title: "foo", body: "bar", userId: 1 } } } }, // New
      ],
    };
    try {
      await saveLayout(defaultLayout);
      setActiveLayout(defaultLayout.id);
    } catch (saveError) {
      console.error('Failed to save new layout:', saveError);
      // Ideally, set an error state to show in UI
    }
  };

  const currentLayout = activeLayoutId ? layouts[activeLayoutId] : null;

  return (
    <div className="flex h-screen w-screen bg-gray-900 text-white">
      <ModuleList />
      <main className="flex-1 flex flex-col p-4 overflow-auto bg-gray-800"> {/* Changed main bg */}
        <h1 className="text-3xl font-bold mb-6 text-gray-100">Ink-UI Dashboard</h1>

        {/* Loading and Error States */}
        {modulesIsLoading && !currentActiveModule && <div className="p-4 text-center text-yellow-400">Loading modules...</div>}
        {layoutIsLoading && <div className="p-4 text-center text-yellow-400">Loading layout...</div>} {/* General layout loading */}

        {layoutError && <div className="p-4 text-center text-red-500">Layout Error: {layoutError}</div>}
        {/* moduleError is handled within ModuleList or could be displayed here too */}

        {/* Content Display Logic */}
        {!currentActiveModule && !currentLayout && !layoutIsLoading && !modulesIsLoading && (
          <div className="p-4 text-gray-400 text-center">
            <p>Please select a module from the list to begin.</p>
            <p className="mt-2">Alternatively, you can create a standalone layout for testing or general use:</p>
            <button
              onClick={handleCreateDefaultLayout}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Standalone Layout
            </button>
          </div>
        )}

        {currentActiveModule && !currentLayout && !layoutIsLoading && (
          // This state occurs if a module is selected, but its layout is still loading or failed to load
          <div className="p-4 text-yellow-400 text-center">
            Loading layout for selected module... If this persists, the layout might be missing or invalid.
          </div>
        )}

        {currentLayout && <Layout layoutConfig={currentLayout} />}

        {/* Fallback if no module is selected AND no standalone layout became active */}
        {!currentActiveModule && !currentLayout && !layoutIsLoading && Object.keys(layouts).length > 0 && (
             <div className="p-4 text-gray-400 text-center">
                <p>Standalone layouts are available. You can activate one if needed, or select a module.</p>
                <button
                    onClick={() => setActiveLayout(Object.keys(layouts)[0])}
                    className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700"
                >
                    Activate First Standalone Layout
                </button>
             </div>
        )}

      </main>
    </div>
  );
}

export default App;
