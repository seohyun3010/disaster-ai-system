"""ConvNeXt V2 (harvey_tiny_v4) 피해등급 추론 서버 + GPT 판정근거 생성.

실행 (backend/ai 폴더에서):
    uvicorn inference_server:app --port 8001
"""

import base64
import io
import os
import time
from pathlib import Path

import torch
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from openai import OpenAI
from PIL import Image
from torchvision import transforms
from transformers import ConvNextV2ForImageClassification

load_dotenv()

WEIGHTS_PATH = Path(__file__).parent / "weights" / "harvey_tiny_v4.pt"
MODEL_VERSION = "convnextv2-tiny-run4"
CONF_GATE = 0.40
SEALED_GRADES = {2}

GRADE_DESC = {
    0: "무피해(DS0): 구조·외장 손상 없음",
    1: "소파(DS1): 지붕재 일부 손실, 소수의 창·문 파손",
    2: "중파(DS2): 지붕재 15~50% 손실, 다수 개구부 파손, 구조체는 유지",
    3: "반파(DS3): 지붕재 대량 손실 및 지붕 구조 손상, 구조 부재 손상",
    4: "전파(DS4): 지붕 완전 파괴 또는 벽체 붕괴",
}

MEAN, STD = [0.485, 0.456, 0.406], [0.229, 0.224, 0.225]
eval_tf = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(MEAN, STD),
])

app = FastAPI(title="재난 피해등급 AI 추론 서버")
model = None
openai_client = OpenAI() if os.getenv("OPENAI_API_KEY") else None


@app.on_event("startup")
def load_model():
    global model
    m = ConvNextV2ForImageClassification.from_pretrained(
        "facebook/convnextv2-tiny-22k-224",
        num_labels=5,
        ignore_mismatched_sizes=True,
    )
    m.load_state_dict(torch.load(WEIGHTS_PATH, map_location="cpu"))
    m.eval()
    model = m


def generate_rationale(image_bytes: bytes, grade: int, conf: float) -> str:
    """GPT 비전으로 판정 근거 서술 생성. 실패 시 빈 문자열 (판정은 영향 없음)."""
    if openai_client is None:
        return ""
    try:
        b64 = base64.b64encode(image_bytes).decode()
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=250,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "당신은 재난 피해조사 보조 시스템입니다. "
                        "자체 AI 분류 모델이 건물 피해등급을 이미 판정했습니다. "
                        "당신의 역할은 등급을 다시 판정하는 것이 아니라, "
                        "사진에서 관찰되는 구체적 피해 양상(지붕, 벽체, 개구부, 구조체 상태)을 "
                        "근거로 해당 판정을 뒷받침하는 설명을 2~3문장으로 작성하는 것입니다. "
                        "공무원이 검토 화면에서 읽을 문장이므로 객관적이고 간결하게 쓰세요."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"AI 판정: {GRADE_DESC[grade]} (신뢰도 {conf:.0%})\n"
                                "사진에서 이 판정을 뒷받침하는 관찰 근거를 서술하세요."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                        },
                    ],
                },
            ],
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return ""


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION,
        "rationale_enabled": openai_client is not None,
    }


@app.post("/classify")
async def classify(files: list[UploadFile] = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="모델이 아직 로드되지 않았습니다")

    start = time.time()

    raw_images = []
    tensors = []
    for f in files:
        raw = await f.read()
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail=f"이미지를 열 수 없습니다: {f.filename}")
        raw_images.append(raw)
        tensors.append(eval_tf(img))

    with torch.no_grad():
        imgs = torch.stack(tensors)
        view_probs = model(pixel_values=imgs).logits.softmax(-1)
        house = view_probs.mean(0)

    top2 = torch.topk(house, 2)
    grade = int(top2.indices[0])
    conf = float(top2.values[0])

    inspection_required = (conf < CONF_GATE) or (grade in SEALED_GRADES)

    rationale = generate_rationale(raw_images[0], grade, conf)

    return {
        "damage_grade": f"DS{grade}",
        "confidence": round(conf, 4),
        "second_grade": f"DS{int(top2.indices[1])}",
        "second_confidence": round(float(top2.values[1]), 4),
        "distribution": [round(float(p), 4) for p in house],
        "inspection_required": inspection_required,
        "rationale": rationale,
        "model_version": MODEL_VERSION,
        "analysis_time": round(time.time() - start, 2),
    }