import { render, screen } from '@testing-library/react';
import Pane from '../Pane';
import { PanelGroup } from 'react-resizable-panels'; // Pane must be child of PanelGroup
import { ViewConfig } from '../../Views/ViewFactory';

describe('Pane Component', () => {
  it('renders with an ID and view configuration', () => {
    const mockView: ViewConfig = { id: 'v-test', type: 'text', content: 'Test Content' };
    render(
      <PanelGroup direction="horizontal">
        <Pane id="test-pane" view={mockView} />
      </PanelGroup>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    // react-resizable-panels might not directly expose the ID in a way that's easily queryable by default role/ID.
    // We confirm content rendering. Actual panel properties are handled by the library.
  });

  it('renders default content if no view is assigned', () => {
     render(
      <PanelGroup direction="horizontal">
        <Pane id="test-pane-default" />
      </PanelGroup>
    );
    expect(screen.getByText('Pane: test-pane-default (No view assigned)')).toBeInTheDocument();
  });
});
