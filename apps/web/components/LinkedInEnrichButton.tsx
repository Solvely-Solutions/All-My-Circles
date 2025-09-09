'use client';

import { useState } from 'react';
import { enrichContactWithLinkedIn, LinkedInEnrichmentResponse } from '../../../packages/shared/linkedin-webhook';

interface LinkedInEnrichButtonProps {
  email: string;
  onEnrichmentComplete?: (data: LinkedInEnrichmentResponse) => void;
  className?: string;
}

export default function LinkedInEnrichButton({ 
  email, 
  onEnrichmentComplete,
  className = ''
}: LinkedInEnrichButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LinkedInEnrichmentResponse | null>(null);

  const handleEnrich = async () => {
    if (!email || !email.includes('@')) {
      alert('Please provide a valid email address');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await enrichContactWithLinkedIn(email);
      setResult(response);
      
      if (onEnrichmentComplete) {
        onEnrichmentComplete(response);
      }
    } catch (error) {
      console.error('Enrichment failed:', error);
      setResult({
        success: false,
        error: 'Failed to enrich contact'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <button
        onClick={handleEnrich}
        disabled={isLoading || !email}
        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Enriching...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Enrich with LinkedIn
          </>
        )}
      </button>

      {result && (
        <div className="mt-4 p-4 rounded-lg border">
          {result.success ? (
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✓ Enrichment Successful</h4>
              {result.data && (
                <div className="text-sm space-y-1">
                  {result.data.name && <p><strong>Name:</strong> {result.data.name}</p>}
                  {result.data.title && <p><strong>Title:</strong> {result.data.title}</p>}
                  {result.data.company && <p><strong>Company:</strong> {result.data.company}</p>}
                  {result.data.location && <p><strong>Location:</strong> {result.data.location}</p>}
                  {result.data.headline && <p><strong>Headline:</strong> {result.data.headline}</p>}
                  {result.data.linkedinUrl && (
                    <p>
                      <strong>LinkedIn:</strong> 
                      <a href={result.data.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        View Profile
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-600">
              <h4 className="font-semibold">✗ Enrichment Failed</h4>
              <p className="text-sm">{result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}