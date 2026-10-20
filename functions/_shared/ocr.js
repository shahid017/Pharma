function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function getImageMimeType(filename, contentType) {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  if (contentType && contentType.startsWith('image/')) return contentType;
  return 'image/jpeg';
}

export async function extractTextOpenAI(imageBuffer, filename, contentType, apiKey) {
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  const mimeType = getImageMimeType(filename, contentType);
  const base64Image = arrayBufferToBase64(imageBuffer);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text from this prescription image. Include medication names, dosages, frequencies, and any special instructions. Return only the extracted text without any additional commentary.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI Vision API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Optional Google Cloud Vision fallback via REST API key.
 * Set GOOGLE_VISION_API_KEY in Cloudflare secrets to enable.
 */
export async function extractTextGoogleVision(imageBuffer, apiKey) {
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not found');
  }

  const base64Image = arrayBufferToBase64(imageBuffer);

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Vision API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const annotation = data.responses?.[0];
  if (annotation?.error?.message) {
    throw new Error(`Google Vision API error: ${annotation.error.message}`);
  }

  return annotation?.fullTextAnnotation?.text || annotation?.textAnnotations?.[0]?.description || '';
}

export function isValidImageMagicBytes(buffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 8) return false;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return true;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return true;
  }

  return false;
}
