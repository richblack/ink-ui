import React from 'react';

interface TextViewProps {
  id: string;
  content: string;
}

const TextView: React.FC<TextViewProps> = ({ id, content }) => {
  return (
    <div id={id} className="p-2 border border-dashed border-gray-300 rounded h-full overflow-auto">
      <pre className="whitespace-pre-wrap break-all">{content}</pre>
    </div>
  );
};

export default TextView;
