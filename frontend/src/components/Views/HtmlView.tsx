import React from 'react';

interface HtmlViewProps {
  id: string;
  htmlContent: string;
}

const HtmlView: React.FC<HtmlViewProps> = ({ id, htmlContent }) => {
  // Ensure htmlContent is a string
  const contentToShow = typeof htmlContent === 'string' ? htmlContent : '<p>Error: Invalid HTML content.</p>';
  return (
    <div
      id={id}
      className="p-2 border border-dashed border-gray-300 rounded h-full overflow-auto prose max-w-none" // Added prose for basic Tailwind typography styling
      dangerouslySetInnerHTML={{ __html: contentToShow }}
    />
  );
};

export default HtmlView;
