/**
 * Secure OCR Service for processing name badge images
 * Handles API communication, validation, and error handling
 */

import { getAppConfig, devLog, devError } from '../utils/config';

interface OcrResult {
  success: boolean;
  extractedText: string;
  confidence?: number;
  error?: string;
}

interface OcrApiResponse {
  ParsedResults?: Array<{
    ParsedText: string;
    TextOverlay?: {
      HasOverlay: boolean;
      Message: string;
    };
  }>;
  OCRExitCode?: number;
  IsErroredOnProcessing?: boolean;
  ErrorMessage?: string;
  ErrorDetails?: string;
}

/**
 * Sanitizes text extracted from OCR to remove potentially harmful content
 */
function sanitizeExtractedText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Remove potential script tags and suspicious content
  const cleanText = text
    .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/data:/gi, '') // Remove data: URLs
    .trim();
  
  // Limit text length to prevent memory issues
  const maxLength = 10000; // 10KB limit
  if (cleanText.length > maxLength) {
    devLog('OCR text truncated due to length', { originalLength: cleanText.length });
    return cleanText.substring(0, maxLength) + '\n[Text truncated]';
  }
  
  return cleanText;
}

/**
 * Validates base64 image data before sending to OCR API
 */
function validateImageData(base64Data: string): boolean {
  if (!base64Data || typeof base64Data !== 'string') {
    return false;
  }
  
  // Check for valid base64 format
  const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Pattern.test(base64Data)) {
    return false;
  }
  
  // Check reasonable size limits (max 10MB base64)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (base64Data.length > maxSize) {
    devError('Image data too large for OCR processing', new Error(`Size: ${base64Data.length} bytes`));
    return false;
  }
  
  return true;
}

/**
 * Makes a secure API request to OCR service with retries
 */
async function makeOcrRequest(base64Image: string, attempt = 1): Promise<OcrApiResponse> {
  const config = getAppConfig();
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.ocr.timeout);
  
  try {
    devLog(`OCR API request attempt ${attempt}`, { endpoint: config.ocr.endpoint });
    
    const response = await fetch(config.ocr.endpoint, {
      method: 'POST',
      headers: {
        'apikey': config.ocr.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'All-My-Circles-App/1.0.0', // Identify our app
      },
      body: new URLSearchParams({
        'base64Image': `data:image/jpeg;base64,${base64Image}`,
        'language': 'eng',
        'detectOrientation': 'true',
        'scale': 'true',
        'OCREngine': '2',
        'filetype': 'jpg',
        'isTable': 'false', // Security: Disable table parsing to reduce attack surface
      }).toString(),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`OCR API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    devLog('OCR API response received', { hasResults: !!data.ParsedResults });
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for network errors
    if (attempt < config.ocr.maxRetries && error instanceof Error) {
      if (error.name === 'AbortError') {
        devError(`OCR request timeout (attempt ${attempt})`, error);
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        devError(`Network error on OCR request (attempt ${attempt})`, error);
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return makeOcrRequest(base64Image, attempt + 1);
    }
    
    throw error;
  }
}

/**
 * Main OCR processing function with security measures
 */
export async function processImageWithOcr(imageUri: string): Promise<OcrResult> {
  try {
    devLog('Starting OCR processing', { imageUri: imageUri ? 'provided' : 'missing' });
    
    if (!imageUri) {
      return {
        success: false,
        extractedText: '',
        error: 'No image provided for OCR processing',
      };
    }
    
    // Convert image to base64
    const response = await fetch(imageUri);
    if (!response.ok) {
      throw new Error('Failed to fetch image for OCR processing');
    }
    
    const blob = await response.blob();
    
    return new Promise<OcrResult>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          if (!reader.result || typeof reader.result !== 'string') {
            resolve({
              success: false,
              extractedText: '',
              error: 'Failed to convert image to base64',
            });
            return;
          }
          
          const base64data = reader.result.split(',')[1];
          
          // Validate image data before sending
          if (!validateImageData(base64data)) {
            resolve({
              success: false,
              extractedText: '',
              error: 'Invalid image data format',
            });
            return;
          }
          
          // Make OCR request
          const ocrData = await makeOcrRequest(base64data);
          
          // Process response
          if (ocrData.IsErroredOnProcessing) {
            resolve({
              success: false,
              extractedText: '',
              error: ocrData.ErrorMessage || 'OCR processing failed',
            });
            return;
          }
          
          if (ocrData.ParsedResults && ocrData.ParsedResults[0]?.ParsedText) {
            const rawText = ocrData.ParsedResults[0].ParsedText;
            const sanitizedText = sanitizeExtractedText(rawText);
            
            devLog('OCR processing successful', { 
              textLength: sanitizedText.length,
              confidence: ocrData.ParsedResults[0].TextOverlay?.HasOverlay 
            });
            
            resolve({
              success: true,
              extractedText: sanitizedText,
              confidence: ocrData.ParsedResults[0].TextOverlay?.HasOverlay ? 0.8 : 0.6,
            });
          } else {
            resolve({
              success: false,
              extractedText: '',
              error: 'No text detected in image',
            });
          }
        } catch (error) {
          devError('OCR processing error', error instanceof Error ? error : new Error(String(error)));
          resolve({
            success: false,
            extractedText: '',
            error: error instanceof Error ? error.message : 'Unknown OCR processing error',
          });
        }
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    devError('OCR service error', error instanceof Error ? error : new Error(String(error)));
    return {
      success: false,
      extractedText: '',
      error: error instanceof Error ? error.message : 'Unknown OCR service error',
    };
  }
}