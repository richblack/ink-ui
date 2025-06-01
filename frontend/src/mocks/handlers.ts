import { http, HttpResponse } from 'msw';
// Ensure ModuleDTO is exported from apiService or directly from types
import { LayoutDTO, ModuleDTO, ViewDTO, PaneDTO } from '../services/apiService';

// Mock database for layouts
const mockLayouts: Record<string, LayoutDTO> = {
  'defaultServerLayout': {
    id: 'defaultServerLayout',
    direction: 'vertical',
    panes: [
      { id: 'sPane1', size: 50, view: { id: 'sView1', type: 'text', content: 'Mocked: Server Pane 1' } },
      { id: 'sPane2', size: 50, view: { id: 'sView2', type: 'html', content: '<em>Mocked: Server Pane 2</em>' } },
    ],
  },
  'l1': { id: 'l1', direction: 'horizontal', panes: [{id: 'p1', size: 100, view: {id: 'v1', type: 'text', content: 'Layout for M1'}} as PaneDTO ]},
  'l2': { id: 'l2', direction: 'vertical', panes: [{id: 'p2', size: 100, view: {id: 'v2', type: 'text', content: 'Layout for M2'}} as PaneDTO ]},
};

// Mock database for modules
const mockModulesDb: Record<string, ModuleDTO> = {
    'm1': { id: 'm1', name: 'Mock Module 1', layout_id: 'l1', icon: 'M1' },
    'm2': { id: 'm2', name: 'Mock Module 2', layout_id: 'l2', description: 'Test desc' },
};


export const handlers = [
  // Layout Handlers
  http.get('/api/layouts', (_res) => { // Changed to _res as resolver not used
    return HttpResponse.json(Object.values(mockLayouts));
  }),

  http.get('/api/layout/:layoutId', ({ params }) => {
    const { layoutId } = params;
    if (typeof layoutId === 'string' && mockLayouts[layoutId]) {
      return HttpResponse.json(mockLayouts[layoutId]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/layout', async ({ request }) => {
    const newLayout = await request.json() as LayoutDTO;
    if (!newLayout || !newLayout.id || !newLayout.panes) {
        return new HttpResponse('Invalid layout data', { status: 400 });
    }
    if (mockLayouts[newLayout.id]) {
        return new HttpResponse(\`Layout with ID '\${newLayout.id}' already exists.\`, { status: 400 });
    }
    mockLayouts[newLayout.id] = newLayout;
    return HttpResponse.json(newLayout, { status: 201 });
  }),

  // Module Handlers
  http.get('/api/modules', (_res) => {
    return HttpResponse.json(Object.values(mockModulesDb));
  }),

  http.get('/api/module/:moduleId', ({ params }) => {
    const { moduleId } = params;
    if (typeof moduleId === 'string' && mockModulesDb[moduleId]) {
      return HttpResponse.json(mockModulesDb[moduleId]);
    }
    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/module', async ({ request }) => {
    const newModule = await request.json() as ModuleDTO;
    if (!newModule || !newModule.id || !newModule.name || !newModule.layout_id) {
      return new HttpResponse('Invalid module data', { status: 400 });
    }
    if (mockModulesDb[newModule.id]) {
        return new HttpResponse(\`Module with ID '\${newModule.id}' already exists.\`, { status: 400 });
    }
    if (!mockLayouts[newModule.layout_id]) {
        return new HttpResponse(\`Layout with ID '\${newModule.layout_id}' not found.\`, { status: 404 });
    }
    mockModulesDb[newModule.id] = newModule;
    console.log("MSW: Mock creating module:", newModule); // Keep for debugging if needed
    return HttpResponse.json(newModule, { status: 201 });
  }),

  // Utility Handlers
  http.delete('/api/clear_all_data', (_res) => { // Changed to _res
    for (const key in mockLayouts) { delete mockLayouts[key]; }
    for (const key in mockModulesDb) { delete mockModulesDb[key]; }

    mockLayouts['defaultServerLayout'] = {
        id: 'defaultServerLayout',
        direction: 'vertical',
        panes: [
          { id: 'sPane1', size: 50, view: { id: 'sView1', type: 'text', content: 'Mocked: Server Pane 1 (post-clear)' } as ViewDTO },
        ] as PaneDTO[],
    };
    mockModulesDb['m1'] = { id: 'm1', name: 'Mock Module 1 (post-clear)', layout_id: 'defaultServerLayout' };

    return new HttpResponse(null, { status: 204 });
  })
];
