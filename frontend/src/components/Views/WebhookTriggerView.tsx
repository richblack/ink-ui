import React, { useState } from 'react';
import axios, { AxiosRequestConfig, Method } from 'axios'; // Allow specifying method

interface WebhookTriggerViewProps {
  id: string;
  webhookUrl: string;
  buttonText?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; // Common HTTP methods
  requestBody?: Record<string, any> | string; // JSON object or string for POST/PUT
  headers?: Record<string, string>; // Optional custom headers
}

const WebhookTriggerView: React.FC<WebhookTriggerViewProps> = ({
  id,
  webhookUrl,
  buttonText = 'Trigger Webhook',
  method = 'POST',
  requestBody = {},
  headers = {},
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    setResponse(null);

    if (!webhookUrl) {
      setError('Webhook URL is not configured.');
      setIsLoading(false);
      return;
    }

    try {
      const config: AxiosRequestConfig = {
        method: method as Method, // Cast because Axios Method type is more specific
        url: webhookUrl,
        headers: {
          'Content-Type': 'application/json', // Default, can be overridden by props.headers
          ...headers,
        },
      };

      if (method === 'POST' || method === 'PUT') {
        if (typeof requestBody === 'string') {
            // If requestBody is a string, try to parse it as JSON.
            // If it fails, send as plain text.
            try {
                config.data = JSON.parse(requestBody);
            } catch (e) {
                config.data = requestBody;
                // If sending plain text, Content-Type might need to be adjusted via props.headers
                if (!headers['Content-Type'] && !headers['content-type']) { // Check both cases
                    config.headers = { ...config.headers, 'Content-Type': 'text/plain' };
                }
            }
        } else {
            config.data = requestBody; // Assume JSON object if not string
        }
      }

      const result = await axios(config);
      setResponse(result.data);
    } catch (err: any) {
      let errorMsg = 'Failed to trigger webhook.';
      if (axios.isAxiosError(err)) {
        if (err.response) {
          errorMsg = \`Error: \${err.response.status} - \${JSON.stringify(err.response.data)}\`;
        } else if (err.request) {
          errorMsg = 'Error: No response received from server. Check network or CORS policy.';
        } else {
          errorMsg = \`Error: \${err.message}\`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      setError(errorMsg);
      console.error("Webhook trigger error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id={id} className="p-4 border border-dashed border-indigo-300 rounded h-full flex flex-col">
      <h3 className="text-lg font-semibold mb-2 text-indigo-700">Webhook Trigger</h3>
      <p className="text-sm text-gray-600 mb-1">URL: <code className="bg-gray-100 p-1 rounded text-xs">{webhookUrl}</code></p>
      <p className="text-sm text-gray-600 mb-3">Method: <code className="bg-gray-100 p-1 rounded text-xs">{method}</code></p>

      <button
        onClick={handleClick}
        disabled={isLoading || !webhookUrl}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors self-start"
      >
        {isLoading ? 'Loading...' : buttonText}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-semibold">Error:</p>
          <pre className="whitespace-pre-wrap break-all">{error}</pre>
        </div>
      )}

      {response && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex-grow overflow-auto">
          <p className="font-semibold">Response:</p>
          <pre className="whitespace-pre-wrap break-all">{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default WebhookTriggerView;
