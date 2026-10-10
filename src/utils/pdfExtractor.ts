/**
 * Client-side PDF Text and Page Extractor Utility
 * Uses pdfjs-dist with dynamic worker / in-line fallback
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configure worker src if available in browser
if (typeof window !== 'undefined') {
  try {
    // Vite resolves new URL(..., import.meta.url).href to bundle worker correctly
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    console.warn('Could not set pdf workerSrc via URL, fallback to cdn worker', e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

export interface ExtractedPdfPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedPdfResult {
  fileName: string;
  totalPages: number;
  fullText: string;
  pages: ExtractedPdfPage[];
  paragraphs: string[];
}

/**
 * Clean & normalize text extracted from PDF
 */
export function cleanExtractedPdfText(rawText: string): string {
  if (!rawText) return '';
  return rawText
    // Replace carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove null bytes / strange control characters except tabs & newlines
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize special unicode spaces and zero-width chars
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ')
    // Normalize hyphens and dashes
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    // Replace smart quotes
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    // Fix hyphenated line breaks (e.g., exam- \n ination -> examination)
    .replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
    // Collapse multi-spaces per line
    .replace(/[ \t]+/g, ' ')
    // Collapse excess blank lines (max 2 newlines = 1 blank line)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract text from a single PDF file (File object or ArrayBuffer)
 */
export async function extractTextFromPdfFile(
  file: File,
  onProgress?: (progress: { page: number; total: number; percent: number }) => void
): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const totalPages = pdf.numPages;
  const pages: ExtractedPdfPage[] = [];
  const fullTextParts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Combine text items with smart line breaking based on Y coords
    let lastY: number | null = null;
    let pageText = '';

    for (const item of textContent.items) {
      if ('str' in item) {
        const str = item.str;
        // Detect line breaks from transform matrix [scaleX, skewY, skewX, scaleY, transX, transY]
        const currentY = Array.isArray(item.transform) ? item.transform[5] : null;

        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 8) {
          pageText += '\n';
        } else if (pageText.length > 0 && !pageText.endsWith(' ') && !pageText.endsWith('\n') && !str.startsWith(' ')) {
          pageText += ' ';
        }
        
        pageText += str;
        if (currentY !== null) {
          lastY = currentY;
        }
      }
    }

    const cleanedPageText = cleanExtractedPdfText(pageText);
    pages.push({
      pageNumber: pageNum,
      text: cleanedPageText,
    });
    if (cleanedPageText) {
      fullTextParts.push(cleanedPageText);
    }

    if (onProgress) {
      onProgress({
        page: pageNum,
        total: totalPages,
        percent: Math.round((pageNum / totalPages) * 100),
      });
    }
  }

  const combinedFullText = cleanExtractedPdfText(fullTextParts.join('\n\n'));
  
  // Split into natural paragraphs
  const paragraphs = combinedFullText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return {
    fileName: file.name,
    totalPages,
    fullText: combinedFullText,
    pages,
    paragraphs: paragraphs.length > 0 ? paragraphs : (combinedFullText ? [combinedFullText] : []),
  };
}
