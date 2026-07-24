from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
# Reduce TensorFlow logging verbosity (optional)
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import numpy as np
# NOTE: TensorFlow import is deferred until we actually need it. Importing
# tensorflow at module import time can use a lot of memory and cause the
# process to be killed on small instances (Render free tier 512MB). We'll
# import inside the loader so the FastAPI app can bind a port quickly.
from io import BytesIO
from PIL import Image
from pathlib import Path
import logging
from datetime import datetime
import os
import uvicorn

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("plant-disease-api")

app = FastAPI(title="Plant Disease Classifier")

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = [
    "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
    "Background_without_leaves", "Blueberry___healthy", "Cherry___Powdery_mildew", "Cherry___healthy",
    "Corn___Cercospora_leaf_spot Gray_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight", "Corn___healthy",
    "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)", "Peach___Bacterial_spot", "Peach___healthy",
    "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
    "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
    "Raspberry___healthy", "Soybean___healthy", "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch", "Strawberry___healthy",
    "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight", "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite", "Tomato___Target_Spot",
    "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
]

model_path = str(Path(__file__).parent.absolute() / "model.tflite")
logger.info(f"Model path set to {model_path}")
# We'll load the model asynchronously on startup so the process can bind a port
# even if the saved_model is not present at deploy time.
MODEL = None
MODEL_ERROR = None
MODEL_LOADED_AT = None


def load_model_sync(path: str):
    """Blocking model load. Intended to run in a thread/executor."""
    global MODEL, MODEL_LOADED_AT, MODEL_ERROR
    
    # Safety check: don't try to load .tflite files with this function
    if path.endswith('.tflite'):
        MODEL = None
        MODEL_ERROR = "Cannot load .tflite file with load_model_sync. Use load_tflite_sync instead."
        logger.error(MODEL_ERROR)
        return
    
    try:
        logger.info(f"Attempting to load SavedModel from {path}")
        # Import TensorFlow here so we don't pay the memory cost on import time
        import importlib
        tf = importlib.import_module('tensorflow')

        # Prefer loading as a saved_model (tf.saved_model.load) or keras model
        # depending on what's present. Use saved_model.load which is generally
        # lighter than full Keras model wrapping.
        try:
            loaded = tf.saved_model.load(path)
            MODEL = loaded
            MODEL_ERROR = None
            MODEL_LOADED_AT = datetime.utcnow().isoformat() + 'Z'
            logger.info("SavedModel loaded successfully via tf.saved_model.load().")
            return
        except Exception as e_saved:
            logger.warning(f"tf.saved_model.load failed: {e_saved}; trying tf.keras.models.load_model()")

        # Try Keras load as a fallback
        try:
            loaded = tf.keras.models.load_model(path)
            MODEL = loaded
            MODEL_ERROR = None
            MODEL_LOADED_AT = datetime.utcnow().isoformat() + 'Z'
            logger.info("Model loaded successfully via tf.keras.models.load_model().")
            return
        except Exception as e_keras:
            raise RuntimeError(f"Failed to load model via saved_model ({e_saved}) and keras.load_model ({e_keras})")
    except Exception as e:
        MODEL = None
        MODEL_ERROR = str(e)
        logger.exception(f"Failed to load model from {path}: {e}")


def load_tflite_sync(tflite_path: str):
    """Load a TFLite model and wrap a predict function around it."""
    global MODEL, MODEL_LOADED_AT, MODEL_ERROR
    try:
        logger.info(f"Attempting to load TFLite model from {tflite_path}")
        # Prefer the lightweight tflite_runtime if available
        try:
            from tflite_runtime.interpreter import Interpreter
        except Exception:
            # Fallback to TensorFlow's lite interpreter if tensorflow is available
            import importlib
            tf = importlib.import_module('tensorflow')
            Interpreter = tf.lite.Interpreter

        interp = Interpreter(model_path=str(tflite_path))
        interp.allocate_tensors()

        input_details = interp.get_input_details()
        output_details = interp.get_output_details()

        def predict_fn(np_input):
            # np_input expected shape (1, H, W, C) and dtype float32
            interp.set_tensor(input_details[0]['index'], np_input.astype(np.float32))
            interp.invoke()
            out = interp.get_tensor(output_details[0]['index'])
            return out

        MODEL = predict_fn
        MODEL_ERROR = None
        MODEL_LOADED_AT = datetime.utcnow().isoformat() + 'Z'
        logger.info("TFLite model loaded and ready (predict function available).")
    except Exception as e:
        MODEL = None
        MODEL_ERROR = str(e)
        logger.exception(f"Failed to load TFLite model from {tflite_path}: {e}")


def ensure_saved_model_from_url(path: str, url: str) -> bool:
    """If the saved_model directory is missing and a MODEL_URL is provided,
    download and unpack it. Returns True if model directory exists after this.
    """
    try:
        p = Path(path)
        if p.exists():
            return True
        # download
        import urllib.request
        import tempfile
        import shutil

        logger.info(f"Downloading model archive from {url}")
        tmpdir = Path(tempfile.mkdtemp(prefix="model_dl_"))
        archive_path = tmpdir / "model_archive"
        urllib.request.urlretrieve(url, str(archive_path))
        # Try to unpack common archive formats
        try:
            shutil.unpack_archive(str(archive_path), extract_dir=str(p))
        except Exception:
            # If it's not an archive, maybe the server provided an already unpacked saved_model tar or folder zip
            # Try moving the downloaded file into place
            p.mkdir(parents=True, exist_ok=True)
            shutil.move(str(archive_path), str(p / archive_path.name))

        logger.info(f"Model downloaded and available at {p}")
        return p.exists()
    except Exception as e:
        logger.exception(f"Failed to download or prepare model from {url}: {e}")
        return False


import asyncio


@app.on_event("startup")
async def startup_event():
    """Trigger background model loading so the server can start serving health checks
    and quickly bind a port even if the model is large or missing at deploy time."""
    
    # ALWAYS prefer TFLite model first (lightweight, low memory usage)
    # Check for model.tflite in the same directory as this script
    script_dir = Path(__file__).parent
    tflite_path = script_dir / "model.tflite"
    
    # Allow override via environment variable
    tflite_model_env = os.environ.get("TFLITE_MODEL")
    model_url = os.environ.get("MODEL_URL")
    
    # Priority 1: Use local model.tflite if it exists
    if tflite_path.exists():
        logger.info(f"✅ Found local TFLite model at {tflite_path}, loading...")
        loop = asyncio.get_running_loop()
        loop.run_in_executor(None, load_tflite_sync, str(tflite_path))
        return
    
    # Priority 2: Check TFLITE_MODEL environment variable
    if tflite_model_env:
        logger.info(f"TFLITE_MODEL environment variable set to: {tflite_model_env}")
        from urllib.parse import urlparse
        parsed = urlparse(tflite_model_env)
        
        if parsed.scheme in ('http', 'https'):
            # Download TFLite model from URL
            logger.info(f"Downloading TFLite model from URL...")
            ok = await asyncio.get_running_loop().run_in_executor(
                None, ensure_saved_model_from_url, str(tflite_path), tflite_model_env
            )
            if ok and tflite_path.exists():
                logger.info(f"✅ Downloaded TFLite model to {tflite_path}")
                loop = asyncio.get_running_loop()
                loop.run_in_executor(None, load_tflite_sync, str(tflite_path))
                return
            else:
                logger.warning("Failed to download TFLite model from URL")
        else:
            # Use path from environment variable
            tflite_env_path = Path(tflite_model_env)
            if tflite_env_path.exists():
                logger.info(f"✅ Using TFLite model from env var: {tflite_env_path}")
                loop = asyncio.get_running_loop()
                loop.run_in_executor(None, load_tflite_sync, str(tflite_env_path))
                return
            else:
                logger.warning(f"TFLITE_MODEL path does not exist: {tflite_env_path}")
    
    # Priority 3: Fall back to SavedModel (not recommended for low-memory environments)
    model_dir = model_path
    logger.warning("⚠️ TFLite model not found, falling back to SavedModel (high memory usage!)")
    
    if not Path(model_dir).exists() and model_url:
        # Attempt to download model in background (best-effort)
        loop = asyncio.get_running_loop()
        ok = await loop.run_in_executor(None, ensure_saved_model_from_url, model_dir, model_url)
        if not ok:
            logger.warning("Model not present after attempted download from MODEL_URL")

    # Start blocking load in executor so startup doesn't block indefinitely
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, load_model_sync, model_dir)

@app.get('/ping')
async def ping():
    return {"message": "ok"}


@app.get('/model-status')
async def model_status():
    """Return model readiness and environment info.

    Useful for load balancer readiness probes and debugging.
    """
    model_exists = Path(model_path).exists()
    # GPU probing removed: assume GPU not available in typical PaaS/container hosts
    gpu_available = False

    return {
        "loaded": MODEL is not None,
        "model_exists": model_exists,
        "gpu_available": gpu_available,
        "loaded_at": MODEL_LOADED_AT,
        "error": MODEL_ERROR,
    }

def read_file_as_image(data) -> np.ndarray:
    try:
        image = Image.open(BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    # Ensure 3 channels (RGB) - convert RGBA / L / P etc.
    if image.mode != 'RGB':
        image = image.convert('RGB')

    image = image.resize((224, 224))
    arr = np.asarray(image, dtype=np.float32) / 255.0  # shape (224,224,3)
    if arr.shape[-1] != 3:
        raise HTTPException(status_code=400, detail=f"Unexpected channel count: {arr.shape[-1]}")
    arr = np.expand_dims(arr, axis=0)  # shape (1,224,224,3)
    return arr

@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    img = read_file_as_image(raw)

    # Ensure model is loaded
    if MODEL is None:
        # Model not available yet
        raise HTTPException(status_code=503, detail="Model is not loaded yet. Try again later.")

    try:
        predictions = MODEL(img)
    except Exception as e:
        logger.exception(f"Error running prediction: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    # Extract probabilities
    if isinstance(predictions, dict):
        # Take first tensor
        class_probs = next(iter(predictions.values()))
    else:
        class_probs = predictions

    class_probs = np.array(class_probs)
    if class_probs.ndim != 2:
        raise HTTPException(status_code=500, detail=f"Unexpected prediction shape: {class_probs.shape}")

    probs = class_probs[0]
    # Align class name list length if mismatch
    if len(CLASS_NAMES) != probs.shape[0]:
        logger.warning(f"Class name count ({len(CLASS_NAMES)}) != model output ({probs.shape[0]}). Truncating/matching.")
    usable_names = CLASS_NAMES[:probs.shape[0]]

    class_index = int(np.argmax(probs))
    class_name = usable_names[class_index]
    confidence = float(probs[class_index])

    return {"class_name": class_name, "class_index": class_index, "confidence": confidence}

if __name__ == "__main__":
    # When running directly (or in many hosting environments), bind to 0.0.0.0
    # Use PORT environment variable if provided by the host, otherwise default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host='0.0.0.0', port=port)
