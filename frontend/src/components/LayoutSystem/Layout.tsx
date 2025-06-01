import React from 'react';
import { PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Pane from './Pane';
import { useLayoutStore, LayoutConfig as StoreLayoutConfig } from '../../store/layoutStore';

interface LayoutProps {
  layoutConfig: StoreLayoutConfig; // Using the store's LayoutConfig type
}

const Layout: React.FC<LayoutProps> = ({ layoutConfig }) => {
  const { updatePaneSize } = useLayoutStore();

  if (!layoutConfig) {
    return <div>Loading layout...</div>;
  }

  const { id: layoutId, direction, panes } = layoutConfig;

  const handleResize = (sizes: number[]) => {
    // Assuming sizes array corresponds to panes array in order
    // react-resizable-panels gives sizes in percentage
    panes.forEach((pane, index) => {
      if (sizes[index] !== undefined) {
        updatePaneSize(layoutId, pane.id, sizes[index]);
      }
    });
  };

  return (
    <PanelGroup direction={direction} onLayout={handleResize} className="w-full h-full border border-blue-500">
      {panes.map((pane, index) => (
        <React.Fragment key={pane.id}>
          <Pane id={pane.id} initialSize={pane.size} minSize={10} view={pane.view}>
            {/* Original content for {pane.id} is now replaced by ViewFactory in Pane.tsx */}
            {/* If you still want to pass children, the Pane component needs to handle both view prop and children prop */}
            {/* <span>{`Content for ${pane.id}`}</span> */}
          </Pane>
          {index < panes.length - 1 && (
            <PanelResizeHandle className="w-2 bg-gray-500 hover:bg-blue-600 transition-colors" />
          )}
        </React.Fragment>
      ))}
    </PanelGroup>
  );
};

export default Layout;
