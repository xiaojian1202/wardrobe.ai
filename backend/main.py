from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from pipeline.extract import ExtractionError, extract_attributes
from utils.config import settings

app = FastAPI(
    title="FitCheck AI API",
    version="0.1.0",
    description="Image scanning API for extracting clothing attributes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/scan")
async def scan_image(file: UploadFile = File(...)) -> dict[str, object]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="An image file is required.")

    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Upload a JPEG, PNG, WEBP, or HEIC image.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        extracted = extract_attributes(
            image_bytes=contents,
            mime_type=file.content_type,
            filename=file.filename,
        )
    except ExtractionError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error

    if not extracted.is_clothing:
        raise HTTPException(
            status_code=422,
            detail="No clothing or fashion items detected in this image. Please upload a clear photo of your outfit or a clothing tag."
        )

    return {
        "filename": file.filename,
        "extracted": extracted.model_dump(),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host=settings.api_host, 
        port=settings.api_port, 
        reload=True
    )
