import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import { connectToDatabase } from '@/lib/database';
import ChapterModel from '@/lib/models/Chapter';
import { authMiddleware } from '@/lib/middleware';
import { Page } from '@/types';

// Initialize Gemini AI
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
};

// POST /api/translate - Translate manga pages
export async function POST(req: NextRequest) {
  try {
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { chapterId, targetLanguage } = await req.json();

    if (!chapterId || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'ChapterId ve targetLanguage gerekli' },
        { status: 400 }
      );
    }

    // Find chapter
    const chapter = await ChapterModel.findById(chapterId);
    if (!chapter) {
      return NextResponse.json(
        { success: false, error: 'Chapter bulunamadı' },
        { status: 404 }
      );
    }

    // Check if translation already exists
    const existingTranslation = chapter.pages.some((page: Page) => 
      page.translatedVersions?.some(tv => tv.language === targetLanguage) ?? false
    );

    if (existingTranslation) {
      return NextResponse.json({
        success: true,
        data: chapter,
        message: 'Çeviri zaten mevcut'
      });
    }

    // Initialize Gemini AI
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite-preview-06-17' });

    // Process each page
    for (let i = 0; i < chapter.pages.length; i++) {
      const page = chapter.pages[i];
      console.log(`Processing page ${i + 1}/${chapter.pages.length}`);

      try {
        // Download image
        const imageResponse = await fetch(page.imageUrl);
        if (!imageResponse.ok) {
          console.error(`Failed to fetch image for page ${i + 1}`);
          continue;
        }

        const imageBuffer = await imageResponse.arrayBuffer();

        // Extract text using Tesseract
        const { data: ocrData } = await Tesseract.recognize(
          Buffer.from(imageBuffer),
          'eng+jpn+kor+chi_sim+chi_tra',
          {
            logger: m => console.log(m)
          }
        );

        // Group text by regions
        const textRegions = ocrData.words
          .filter(word => word.confidence > 60) // Filter low confidence words
          .map(word => ({
            id: `region_${word.bbox.x0}_${word.bbox.y0}`,
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0,
            originalText: word.text,
            confidence: word.confidence / 100
          }));

        // If no text found, skip this page
        if (textRegions.length === 0) {
          console.log(`No text found on page ${i + 1}`);
          continue;
        }

        // Group nearby text regions
        const groupedRegions = groupTextRegions(textRegions);

        // Translate grouped text using Gemini
        const translatedRegions = [];
        for (const region of groupedRegions) {
          try {
            const prompt = `
              Translate the following text to ${getLanguageName(targetLanguage)}.
              Keep the translation natural and appropriate for manga/comic context.
              Only return the translated text, nothing else.
              
              Text: "${region.originalText}"
            `;

            const result = await model.generateContent(prompt);
            const translatedText = result.response.text().trim();

            translatedRegions.push({
              id: region.id,
              x: region.x,
              y: region.y,
              width: region.width,
              height: region.height,
              originalText: region.originalText,
              translatedText: translatedText,
              confidence: region.confidence
            });
          } catch (error) {
            console.error(`Translation failed for region ${region.id}:`, error);
            // Keep original text if translation fails
            translatedRegions.push({
              id: region.id,
              x: region.x,
              y: region.y,
              width: region.width,
              height: region.height,
              originalText: region.originalText,
              translatedText: region.originalText,
              confidence: region.confidence
            });
          }
        }

        // Create new image with translated text
        const translatedImageBuffer = await createTranslatedImage(
          Buffer.from(imageBuffer),
          translatedRegions
        );

        // Save translated image (this is a simplified version - in production you'd save to cloud storage)
        const translatedImageUrl = await saveTranslatedImage(
          translatedImageBuffer,
          `${chapterId}_${i + 1}_${targetLanguage}.png`
        );

        // Update page with translated version
        const translatedPage = {
          language: targetLanguage,
          imageUrl: translatedImageUrl,
          textRegions: translatedRegions
        };

        if (!page.translatedVersions) {
          page.translatedVersions = [];
        }
        page.translatedVersions.push(translatedPage);
        page.textRegions = groupedRegions.map(region => ({
          id: region.id,
          x: region.x,
          y: region.y,
          width: region.width,
          height: region.height,
          originalText: region.originalText,
          confidence: region.confidence
        }));

      } catch (error) {
        console.error(`Error processing page ${i + 1}:`, error);
        continue;
      }
    }

    // Update chapter with translated languages
    if (!chapter.translatedLanguages.includes(targetLanguage)) {
      chapter.translatedLanguages.push(targetLanguage);
      chapter.isTranslated = true;
    }

    // Save chapter
    await chapter.save();

    return NextResponse.json({
      success: true,
      data: chapter,
      message: 'Çeviri tamamlandı'
    });

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, error: 'Çeviri yapılırken hata oluştu' },
      { status: 500 }
    );
  }
}

// Helper function to group nearby text regions
function groupTextRegions(regions: any[]) {
  const grouped = [];
  const used = new Set();

  for (let i = 0; i < regions.length; i++) {
    if (used.has(i)) continue;

    const group = {
      id: regions[i].id,
      x: regions[i].x,
      y: regions[i].y,
      width: regions[i].width,
      height: regions[i].height,
      originalText: regions[i].originalText,
      confidence: regions[i].confidence
    };

    used.add(i);

    // Find nearby regions
    for (let j = i + 1; j < regions.length; j++) {
      if (used.has(j)) continue;

      const region1 = regions[i];
      const region2 = regions[j];

      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(region1.x - region2.x, 2) + Math.pow(region1.y - region2.y, 2)
      );

      // If regions are close enough, group them
      if (distance < 50) {
        group.originalText += ' ' + region2.originalText;
        group.x = Math.min(group.x, region2.x);
        group.y = Math.min(group.y, region2.y);
        group.width = Math.max(group.x + group.width, region2.x + region2.width) - group.x;
        group.height = Math.max(group.y + group.height, region2.y + region2.height) - group.y;
        group.confidence = Math.max(group.confidence, region2.confidence);
        used.add(j);
      }
    }

    grouped.push(group);
  }

  return grouped;
}

// Helper function to create translated image
async function createTranslatedImage(originalImageBuffer: Buffer, translatedRegions: any[]) {
  try {
    let compositeLayers = [];

    for (const region of translatedRegions) {
      // Create white background for text area to cover original text
      const background = Buffer.from(
        `<svg width="${region.width}" height="${region.height}">
          <rect width="${region.width}" height="${region.height}" fill="white" />
        </svg>`
      );

      // Create text SVG
      const lines = wrapText(region.translatedText, region.width - 20);
      let svgText = `<svg width="${region.width}" height="${region.height}">
        <style>
          .text { font: bold 14px sans-serif; fill: black; }
        </style>
        <text x="10" y="20" class="text">`;
      
      lines.forEach((line, index) => {
        svgText += `<tspan x="10" dy="${index ? '1.2em' : 0}">${line}</tspan>`;
      });
      
      svgText += `</text></svg>`;

      compositeLayers.push({
        input: background,
        left: region.x,
        top: region.y
      });

      compositeLayers.push({
        input: Buffer.from(svgText),
        left: region.x,
        top: region.y
      });
    }

    // Composite all layers
    const translatedImage = await sharp(originalImageBuffer)
      .composite(compositeLayers)
      .png()
      .toBuffer();

    return translatedImage;
  } catch (error) {
    console.error('Error creating translated image:', error);
    throw error;
  }
}

// Helper function to wrap text
function wrapText(text: string, maxWidth: number) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = currentLine.length + word.length + 1; // approximate
    if (width * 8 < maxWidth) { // approximate char width
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// Helper function to save translated image
async function saveTranslatedImage(imageBuffer: Buffer, filename: string): Promise<string> {
  // In production, you would save to cloud storage (AWS S3, Google Cloud Storage, etc.)
  // For now, we'll simulate with a local path
  const fs = require('fs');
  const path = require('path');
  
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'translated');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  const filePath = path.join(uploadsDir, filename);
  fs.writeFileSync(filePath, imageBuffer);
  
  return `/uploads/translated/${filename}`;
}

// Helper function to get language name
function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    'tr': 'Turkish',
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese'
  };
  return languages[code] || 'English';
}