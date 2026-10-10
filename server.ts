import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase request body limits to handle image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Optical Character Recognition (OCR) API endpoint - Supports single and multiple batch images
app.post('/api/ocr', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', images } = req.body;

    // Normalize input to an array of images
    const imageList: Array<{ imageBase64: string; mimeType: string }> = [];
    if (Array.isArray(images) && images.length > 0) {
      imageList.push(...images);
    } else if (imageBase64) {
      imageList.push({ imageBase64, mimeType });
    }

    if (imageList.length === 0) {
      return res.status(400).json({ error: 'No image provided. Please upload clear photos or screenshots.' });
    }

    if (!ai) {
      const key = process.env.GEMINI_API_KEY;
      if (key) {
        ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }
    }

    if (!ai) {
      return res.status(503).json({ 
        error: 'AI OCR service is temporarily unavailable. Using client-side local recognition.' 
      });
    }

    // Build multimodal parts for Gemini with all uploaded images
    const parts: any[] = [];
    for (const img of imageList) {
      const cleanBase64 = img.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+_-]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: img.mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const promptText = imageList.length > 1
      ? `You are an expert high-speed OCR transcription engine for typing test examinations.
There are ${imageList.length} sequential document images attached representing pages or sections of a printed text.
Extract and transcribe the English text from all ${imageList.length} images in order (from the first image to the last).
Rules:
1. Return ONLY the transcribed text verbatim in exact sequential order.
2. Separate content from different pages/images with double newlines.
3. Do NOT include markdown code fences (\`\`\`), do NOT include page labels like "Page 1:" or "Image 1:", and do NOT add explanations.
4. Transcribe accurately with exact spelling and punctuation.`
      : `You are an expert OCR transcription engine for typing test examinations.
Extract and transcribe the English text printed or written on this image verbatim.
Rules:
1. Return ONLY the transcribed text. Do NOT add preamble, markdown fences, notes, or explanations.
2. Preserve natural paragraph structures and spacing.
3. Transcribe with 100% typographical precision.`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
    });

    const extractedText = response.text?.trim() || '';
    return res.json({ text: extractedText, pageCount: imageList.length });
  } catch (error: any) {
    console.error('Error during OCR processing:', error);
    return res.status(500).json({ 
      error: error?.message || 'Failed to extract text from the provided images.' 
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
