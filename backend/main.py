from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from typing import Optional, Dict, List
import base64
from openai import OpenAI
from google.cloud import vision
import io
from PIL import Image
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDICAL_ABBREVIATIONS = {
    "bd": "twice daily",
    "b.d.": "twice daily",
    "bid": "twice daily",
    "b.i.d.": "twice daily",
    "od": "once daily",
    "o.d.": "once daily",
    "qd": "once daily",
    "q.d.": "once daily",
    "tid": "three times daily",
    "t.i.d.": "three times daily",
    "qid": "four times daily",
    "q.i.d.": "four times daily",
    "hs": "at bedtime",
    "h.s.": "at bedtime",
    "prn": "as needed",
    "p.r.n.": "as needed",
    "ac": "before meals",
    "a.c.": "before meals",
    "pc": "after meals",
    "p.c.": "after meals",
    "qam": "every morning",
    "q.a.m.": "every morning",
    "qpm": "every evening",
    "q.p.m.": "every evening",
    "qhs": "every night at bedtime",
    "q.h.s.": "every night at bedtime",
    "stat": "immediately",
    "po": "by mouth",
    "p.o.": "by mouth",
    "im": "intramuscular",
    "i.m.": "intramuscular",
    "iv": "intravenous",
    "i.v.": "intravenous",
    "sc": "subcutaneous",
    "s.c.": "subcutaneous",
    "sl": "sublingual",
    "s.l.": "sublingual",
    "qw": "once weekly",
    "q.w.": "once weekly",
    "qod": "every other day",
    "q.o.d.": "every other day",
}

TIME_PATTERNS = {
    "morning": ["morning", "a.m.", "am", "breakfast", "qam"],
    "afternoon": ["afternoon", "noon", "lunch"],
    "evening": ["evening", "p.m.", "pm", "dinner", "qpm"],
    "bedtime": ["bedtime", "hs", "h.s.", "night", "qhs", "q.h.s.", "before sleep"],
    "before meals": ["ac", "a.c.", "before meals", "before eating", "preprandial"],
    "after meals": ["pc", "p.c.", "after meals", "after eating", "postprandial"],
    "as needed": ["prn", "p.r.n.", "as needed", "when necessary"],
}


class ProcessedPrescription(BaseModel):
    raw_text: str
    normalized_instructions: str
    administration_time: List[str]
    success: bool
    error: Optional[str] = None


def normalize_text(text: str) -> tuple[str, List[str]]:
    normalized = text
    administration_times = []
    
    text_lower = text.lower()
    
    for abbr, full_form in MEDICAL_ABBREVIATIONS.items():
        pattern = r'\b' + re.escape(abbr) + r'\b'
        normalized = re.sub(pattern, full_form, normalized, flags=re.IGNORECASE)
    
    for time_category, patterns in TIME_PATTERNS.items():
        for pattern in patterns:
            if pattern.lower() in text_lower:
                if time_category not in administration_times:
                    administration_times.append(time_category)
    
    if not administration_times:
        administration_times.append("No specific time mentioned")
    
    return normalized, administration_times


async def extract_text_openai(image_data: bytes, filename: str) -> str:
    try:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OpenAI API key not found")
        
        client = OpenAI(api_key=openai_api_key)
        
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        file_ext = filename.lower().split('.')[-1]
        if file_ext == 'jpg':
            file_ext = 'jpeg'
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Extract all text from this prescription image. Include medication names, dosages, frequencies, and any special instructions. Return only the extracted text without any additional commentary."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{file_ext};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=1000
        )
        
        return response.choices[0].message.content
    except Exception as e:
        raise Exception(f"OpenAI Vision API error: {str(e)}")


async def extract_text_google_vision(image_data: bytes) -> str:
    try:
        credentials_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        if not credentials_path or not os.path.exists(credentials_path):
            raise ValueError("Google Cloud credentials not found")
        
        client = vision.ImageAnnotatorClient()
        
        image = vision.Image(content=image_data)
        response = client.text_detection(image=image)
        
        if response.error.message:
            raise Exception(f"Google Vision API error: {response.error.message}")
        
        texts = response.text_annotations
        if texts:
            return texts[0].description
        else:
            return ""
    except Exception as e:
        raise Exception(f"Google Vision API error: {str(e)}")


@app.post("/api/process-prescription", response_model=ProcessedPrescription)
async def process_prescription(file: UploadFile = File(...)):
    try:
        allowed_extensions = ['jpg', 'jpeg', 'png', 'pdf']
        file_ext = file.filename.split('.')[-1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed formats: {', '.join(allowed_extensions)}"
            )
        
        image_data = await file.read()
        
        if file_ext == 'pdf':
            raise HTTPException(
                status_code=400,
                detail="PDF support requires additional processing. Please upload an image (JPEG/PNG) of the prescription."
            )
        
        try:
            img = Image.open(io.BytesIO(image_data))
            img.verify()
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid or corrupted image file")
        
        raw_text = ""
        extraction_method = "openai"
        
        try:
            raw_text = await extract_text_openai(image_data, file.filename)
        except Exception as openai_error:
            try:
                raw_text = await extract_text_google_vision(image_data)
                extraction_method = "google_vision"
            except Exception as google_error:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to extract text. OpenAI: {str(openai_error)}. Google Vision: {str(google_error)}"
                )
        
        if not raw_text or raw_text.strip() == "":
            raise HTTPException(
                status_code=422,
                detail="No text could be extracted from the image. Please ensure the prescription is clearly visible and readable."
            )
        
        normalized_instructions, administration_times = normalize_text(raw_text)
        
        return ProcessedPrescription(
            raw_text=raw_text,
            normalized_instructions=normalized_instructions,
            administration_time=administration_times,
            success=True
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "openai_configured": bool(os.getenv("OPENAI_API_KEY")),
        "google_vision_configured": bool(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
