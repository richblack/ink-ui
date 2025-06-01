import React from 'react';
import { Panel } from 'react-resizable-panels';
import ViewFactory, { ViewConfig } from '../Views/ViewFactory';

interface PaneProps {
  id: string;
  initialSize?: number; // default size in percentage
  minSize?: number; // min size in percentage
  view?: ViewConfig; // Changed from children to specific view config
}

const Pane: React.FC<PaneProps> = ({ id, initialSize, minSize, view }) => {
  return (
    <Panel id={id} defaultSize={initialSize} minSize={minSize} className="bg-gray-200 border border-gray-400 flex items-center justify-center">
      {view ? <ViewFactory viewConfig={view} /> : <div className="p-4">Pane: {id} (No view assigned)</div>}
    </Panel>
  );
};

export default Pane;
