import React from 'react';
import TextView from './TextView';
import HtmlView from './HtmlView';
import WebhookTriggerView from './WebhookTriggerView'; // New import
import { ViewConfig } from '../../types'; // Adjusted import for global types

interface ViewFactoryProps {
  viewConfig: ViewConfig;
}

const ViewFactory: React.FC<ViewFactoryProps> = ({ viewConfig }) => {
  if (!viewConfig) {
    return <div className="p-2 text-red-500">Error: View configuration is missing.</div>;
  }

  switch (viewConfig.type) {
    case 'text':
      return <TextView id={viewConfig.id} content={viewConfig.content || 'Default text content'} />;
    case 'html':
      return <HtmlView id={viewConfig.id} htmlContent={viewConfig.content || '<p>Default HTML content</p>'} />;
    case 'webhook_trigger':
      return <WebhookTriggerView
        id={viewConfig.id}
        webhookUrl={viewConfig.content?.webhookUrl || ''}
        buttonText={viewConfig.content?.buttonText}
        method={viewConfig.content?.method}
        requestBody={viewConfig.content?.requestBody}
        headers={viewConfig.content?.headers}
      />;
    default:
      return <div className="p-2 text-orange-500">Unsupported view type: {viewConfig.type} (ID: {viewConfig.id})</div>;
  }
};

export default ViewFactory;
