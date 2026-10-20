import { normalizeText } from '../_shared/normalize.js';
import {
  extractTextOpenAI,
  extractTextGoogleVision,
  isValidImageMagicBytes,
} from '../_shared/ocr.js';

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return jsonResponse({ detail: 'Filename is required' }, 400);
    }

    const filename = file.name || '';
    if (!filename) {
      return jsonResponse({ detail: 'Filename is required' }, 400);
    }

    const allowedExtensions = ['jpg', 'jpeg', 'png'];
    const fileExt = filename.split('.').pop()?.toLowerCase();

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      return jsonResponse(
        {
          detail: `Invalid file format. Allowed formats: ${allowedExtensions.join(', ')}`,
        },
        400
      );
    }

    if (fileExt === 'pdf') {
      return jsonResponse(
        {
          detail:
            'PDF processing is not supported yet. Please upload an image (JPEG/PNG) of the prescription.',
        },
        400
      );
    }

    const imageBuffer = await file.arrayBuffer();

    if (!isValidImageMagicBytes(imageBuffer)) {
      return jsonResponse({ detail: 'Invalid or corrupted image file' }, 400);
    }

    let rawText = '';
    let openaiError = null;

    try {
      rawText = await extractTextOpenAI(
        imageBuffer,
        filename,
        file.type,
        context.env.OPENAI_API_KEY
      );
    } catch (error) {
      openaiError = error;
      try {
        rawText = await extractTextGoogleVision(
          imageBuffer,
          context.env.GOOGLE_VISION_API_KEY
        );
      } catch (googleError) {
        return jsonResponse(
          {
            detail: `Failed to extract text. OpenAI: ${openaiError.message}. Google Vision: ${googleError.message}`,
          },
          500
        );
      }
    }

    if (!rawText || rawText.trim() === '') {
      return jsonResponse(
        {
          detail:
            'No text could be extracted from the image. Please ensure the prescription is clearly visible and readable.',
        },
        422
      );
    }

    const { normalized, administrationTimes } = normalizeText(rawText);

    return jsonResponse({
      raw_text: rawText,
      normalized_instructions: normalized,
      administration_time: administrationTimes,
      success: true,
      error: null,
    });
  } catch (error) {
    return jsonResponse(
      { detail: `Internal server error: ${error.message}` },
      500
    );
  }
}
