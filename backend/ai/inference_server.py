"""ConvNeXt V2 (harvey_tiny_v4) 피해등급 추론 서버.

구성
    1) 배경 제거   실사진을 학습 데이터(Final_images) 형식으로 정합
    2) 등급 분류   ConvNeXt V2 · 다중 뷰 softmax 평균 (집 단위 판정)
    3) 통제 장치   신뢰도 게이트 + 등급 봉인 + 관찰 정합성 검사
    4) 판독 근거   Grad-CAM++ 히트맵 · blind 부위별 관찰

실행 (backend/ai 폴더에서):
    uvicorn inference_server:app --port 8001
"""

import base64
import io
import json
import os
import time
import uuid
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from openai import OpenAI
from PIL import Image
from torchvision import transforms
from transformers import ConvNextV2ForImageClassification

import matplotlib
matplotlib.use("Agg")          # 서버 환경 — GUI 백엔드 비활성
from matplotlib import cm      # noqa: E402

load_dotenv()

# ── 모델 · 판정 기준 ─────────────────────────────────
WEIGHTS_PATH = Path(__file__).parent / "weights" / "harvey_tiny_v4.pt"
MODEL_VERSION = "convnextv2-tiny-run4"
CONF_GATE = 0.40
SEALED_GRADES = {2}           # DS2는 신뢰도와 무관하게 현장조사

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

# ── 배경 제거 ────────────────────────────────────────
# 학습 데이터(MV-HarveyNET Final_images)는 Labelbox 수동 폴리곤 라벨링으로
# 하늘·잔디·나무·차량을 제거하고 검정으로 채운 것이다. 경계는 PIL
# ImageDraw.polygon 기반이라 하드 엣지(안티에일리어싱 없음)이므로
# 자동 분할 결과의 알파를 이진화해 동일 형식을 만든다.
ALPHA_TH = 128
BLACK_MIN, BLACK_MAX = 0.60, 0.92     # 학습 분포 실측 73.8~83.5%
BG_MODEL = "isnet-general-use"        # 건물 분할에 u2net보다 안정적

_bg_session = None


def _get_bg_session():
    global _bg_session
    if _bg_session is None:
        from rembg import new_session
        _bg_session = new_session(BG_MODEL)
    return _bg_session


def black_ratio(img: Image.Image) -> float:
    """검정 픽셀 비율 — 학습 분포 정합 지표"""
    return float((np.array(img.convert("RGB")).sum(-1) == 0).mean())


def remove_background(img: Image.Image) -> Image.Image:
    """실사진 → 건물만 남기고 배경 검정"""
    from rembg import remove
    arr = np.array(remove(img.convert("RGB"), session=_get_bg_session()))
    mask = (arr[..., 3] > ALPHA_TH)[..., None]
    return Image.fromarray(np.where(mask, arr[..., :3], 0).astype(np.uint8))


def normalize_input(img: Image.Image) -> tuple[Image.Image, dict]:
    """
    입력 사진을 학습 형식으로 정합.

    검정 비율로 판별하여 이미 배경이 제거된 이미지(Harvey 데이터셋)는
    재처리하지 않는다. 재처리하면 건물까지 깎여나간다.
    """
    before = black_ratio(img)
    removed = before < BLACK_MIN
    if removed:
        try:
            img = remove_background(img)
        except Exception as e:
            print(f"[bg] 제거 실패, 원본 사용: {type(e).__name__}: {e}")
            removed = False
    after = black_ratio(img)
    return img, {
        "background_removed": removed,
        "black_ratio": round(after, 4),
        "in_distribution": BLACK_MIN <= after <= BLACK_MAX,
    }


# ── Grad-CAM++ ───────────────────────────────────────
# 노트북 Part 7과 동일 구현. 판정에 기여한 영역을 히트맵으로 저장한다.
CAM_DIR = Path(__file__).resolve().parent.parent / "uploads" / "cam"
CAM_DIR.mkdir(parents=True, exist_ok=True)
CAM_ALPHA = 0.45

_ACT: dict = {}
_GRAD: dict = {}
_cam_ready = False


def _register_cam_hooks(m) -> None:
    """마지막 stage의 마지막 layer에 forward/backward hook 등록"""
    global _cam_ready
    if _cam_ready:
        return
    target = m.convnextv2.encoder.stages[-1].layers[-1]
    target.register_forward_hook(lambda mod, i, o: _ACT.update(v=o.detach()))
    target.register_full_backward_hook(lambda mod, gi, go: _GRAD.update(v=go[0].detach()))
    _cam_ready = True
    print(f"[CAM] hook 등록 — 타깃: {type(target).__name__}")


def _crop224(img: Image.Image) -> Image.Image:
    """eval_tf와 동일 기하의 표시용 원본"""
    return transforms.CenterCrop(224)(transforms.Resize(256)(img.convert("RGB")))


def cam_for_class(batch: torch.Tensor, target_class: int) -> np.ndarray:
    """Grad-CAM++ → (V,224,224) numpy [0,1]"""
    model.zero_grad(set_to_none=True)
    logits = model(pixel_values=batch).logits
    logits[:, target_class].sum().backward()

    A, G = _ACT["v"], _GRAD["v"]
    g2, g3 = G ** 2, G ** 3
    alpha = g2 / (2 * g2 + (A * g3).sum((2, 3), keepdim=True) + 1e-8)
    w = (alpha * F.relu(G)).sum((2, 3), keepdim=True)
    cam = F.relu((w * A).sum(1))
    cam = cam - cam.amin((1, 2), keepdim=True)
    cam = cam / (cam.amax((1, 2), keepdim=True) + 1e-8)
    cam = F.interpolate(cam[:, None], (224, 224), mode="bilinear", align_corners=False)[:, 0]
    return cam.detach().cpu().numpy()


def save_cam_overlay(base_img: Image.Image, cam: np.ndarray, filename: str) -> str:
    """원본 crop 위에 turbo 히트맵을 합성해 저장, 조회 URL 반환"""
    crop = np.array(_crop224(base_img)).astype(np.float32)
    heat = (cm.turbo(cam)[..., :3] * 255).astype(np.float32)
    blended = crop * (1 - CAM_ALPHA) + heat * CAM_ALPHA
    Image.fromarray(blended.astype(np.uint8)).save(CAM_DIR / filename)
    return f"/uploads/cam/{filename}"


# ── 앱 ───────────────────────────────────────────────
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
    _register_cam_hooks(model)


def observe_damage(images: list[bytes]) -> dict:
    """
    blind 부위별 손상 관찰.

    AI 분류 등급을 주입하지 않는다. 등급을 알려주면 모델이 그 등급에
    부합하도록 관찰을 지어내는 경향(sycophancy)이 실험에서 확인되었다.
    등급과 독립적으로 관찰하게 하여, 두 결과가 어긋나면 그 자체가
    재검토 신호가 되도록 한다.

    실패 시 빈 dict (판정은 영향 없음).
    """
    if openai_client is None or not images:
        return {}
    try:
        content = [{
            "type": "text",
            "text": (
                "이 사진들은 동일한 건물을 여러 각도에서 촬영한 것입니다.\n"
                "각 부위의 손상 여부만 관찰하여 기록하세요.\n"
                "- 사진에 보이지 않는 부위는 반드시 NOT_VISIBLE로 표기\n"
                "- 추측하지 말고 실제로 보이는 것만 기술\n"
                "- 근거가 된 뷰 번호를 note 끝에 괄호로 표기"
            ),
        }]
        for i, raw in enumerate(images, 1):
            b64 = base64.b64encode(raw).decode()
            content.append({"type": "text", "text": f"[뷰 {i}]"})
            content.append({
                "type": "image_url",
                "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
            })

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=500,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "당신은 재난 피해 사진의 관찰 기록자입니다. "
                        "피해등급을 판정하지 마십시오. 등급이라는 단어를 쓰지 마십시오. "
                        "전파, 반파, 소파 같은 판정 용어를 사용하지 마십시오. "
                        "'~일 가능성이 있다', '~로 보인다' 같은 추측 표현을 쓰지 마십시오. "
                        "사진에서 직접 확인되는 사실만 기록하십시오.\n\n"
                        "다음 JSON 형식으로만 답하십시오:\n"
                        "{\n"
                        '  "roof":       {"status": "DAMAGED|UNDAMAGED|NOT_VISIBLE", "note": "..."},\n'
                        '  "wall":       {"status": "DAMAGED|UNDAMAGED|NOT_VISIBLE", "note": "..."},\n'
                        '  "opening":    {"status": "DAMAGED|UNDAMAGED|NOT_VISIBLE", "note": "..."},\n'
                        '  "structure":  {"status": "DAMAGED|UNDAMAGED|NOT_VISIBLE", "note": "..."},\n'
                        '  "inundation": {"status": "DAMAGED|UNDAMAGED|NOT_VISIBLE", "note": "..."},\n'
                        '  "summary": "관찰 사실 2문장 이내"\n'
                        "}\n\n"
                        "note는 관찰 내용을 쓰고 끝에 괄호로 뷰 번호를 붙이십시오. "
                        "예: '지붕재 탈락 및 서까래 노출 (뷰1,3)'. 35자 이내. "
                        "확인 불가 시 note는 빈 문자열."
                    ),
                },
                {"role": "user", "content": content},
            ],
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"[observe] 실패: {type(e).__name__}: {e}")
        return {}


def check_consistency(observation: dict, grade: int) -> dict:
    """
    관찰 결과와 AI 등급의 정합성 검사.

    독립적으로 산출된 두 결과가 어긋나면 담당자에게 재검토를 요청한다.
    """
    if not observation:
        return {"consistent": None, "reason": "관찰 결과 없음"}

    parts = ["roof", "wall", "opening", "structure"]
    damaged = sum(
        1 for p in parts
        if observation.get(p, {}).get("status") == "DAMAGED"
    )
    visible = sum(
        1 for p in parts
        if observation.get(p, {}).get("status") in ("DAMAGED", "UNDAMAGED")
    )

    if visible == 0:
        return {
            "consistent": False,
            "reason": "사진에서 건물 부위를 확인할 수 없음",
            "damaged_parts": 0,
            "visible_parts": 0,
        }

    # 고등급(DS3·DS4)인데 관찰된 손상이 없으면 모순
    if grade >= 3 and damaged == 0:
        return {
            "consistent": False,
            "reason": f"분류 결과는 DS{grade}이나 관찰된 부위 손상 없음",
            "damaged_parts": damaged,
            "visible_parts": visible,
        }
    # 저등급(DS0·DS1)인데 손상이 많으면 모순
    if grade <= 1 and damaged >= 3:
        return {
            "consistent": False,
            "reason": f"분류 결과는 DS{grade}이나 다수 부위 손상 관찰됨",
            "damaged_parts": damaged,
            "visible_parts": visible,
        }

    return {
        "consistent": True,
        "reason": "",
        "damaged_parts": damaged,
        "visible_parts": visible,
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION,
        "rationale_enabled": openai_client is not None,
        "cam_enabled": _cam_ready,
        "conf_gate": CONF_GATE,
        "sealed_grades": sorted(f"DS{g}" for g in SEALED_GRADES),
    }


@app.post("/classify")
async def classify(files: list[UploadFile] = File(...)):
    if model is None:
        raise HTTPException(status_code=503, detail="모델이 아직 로드되지 않았습니다")

    start = time.time()

    raw_images: list[bytes] = []      # 관찰용 원본 (배경 제거 전)
    norm_images: list[Image.Image] = []  # CAM 표시용 (배경 제거 후)
    tensors: list[torch.Tensor] = []
    preprocess_meta: list[dict] = []

    for f in files:
        raw = await f.read()
        try:
            img = Image.open(io.BytesIO(raw)).convert("RGB")
        except Exception:
            raise HTTPException(
                status_code=400, detail=f"이미지를 열 수 없습니다: {f.filename}"
            )

        normalized, meta = normalize_input(img)
        meta["file"] = f.filename
        preprocess_meta.append(meta)

        raw_images.append(raw)
        norm_images.append(normalized)
        tensors.append(eval_tf(normalized))

    # 집 단위 판정 — 뷰별 softmax 평균
    with torch.no_grad():
        imgs = torch.stack(tensors)
        view_probs = model(pixel_values=imgs).logits.softmax(-1)
        house = view_probs.mean(0)

    top2 = torch.topk(house, 2)
    grade = int(top2.indices[0])
    conf = float(top2.values[0])

    gate_passed = conf >= CONF_GATE
    sealed = grade in SEALED_GRADES

    # Grad-CAM++ — backward가 필요하므로 no_grad 밖에서 별도 forward
    cam_urls: list[str] = []
    try:
        cams = cam_for_class(imgs, grade)
        token = uuid.uuid4().hex[:12]
        for i, base in enumerate(norm_images):
            cam_urls.append(
                save_cam_overlay(base, cams[i], f"cam_{token}_view{i + 1}.png")
            )
    except Exception as e:
        print(f"[CAM] 생성 실패: {type(e).__name__}: {e}")

    observation = observe_damage(raw_images)
    consistency = check_consistency(observation, grade)
    consistent = consistency.get("consistent")

    inspection_required = (not gate_passed) or sealed or (consistent is False)

    reasons = []
    if not gate_passed:
        reasons.append(f"신뢰도 {conf:.1%} < 기준 {CONF_GATE:.0%}")
    if sealed:
        reasons.append(f"DS{grade} 봉인 등급 — 신뢰도 무관 현장조사")
    if consistent is False and consistency.get("reason"):
        reasons.append(consistency["reason"])

    print(
        f"[classify] DS{grade} {conf:.1%} · {len(files)}뷰 · "
        f"{'현장조사' if inspection_required else '자동판정'} · "
        f"{time.time() - start:.1f}s"
    )

    return {
        "damage_grade": f"DS{grade}",
        "damage_grade_desc": GRADE_DESC.get(grade, ""),
        "confidence": round(conf, 4),
        "second_grade": f"DS{int(top2.indices[1])}",
        "second_confidence": round(float(top2.values[1]), 4),
        "distribution": [round(float(p), 4) for p in house],
        "view_probs": [[round(float(p), 4) for p in v] for v in view_probs],
        "inspection_required": inspection_required,
        "gate": {
            "threshold": CONF_GATE,
            "passed": gate_passed,
            "sealed_grade": sealed,
            "reasons": reasons,
        },
        "observation": observation,
        "consistency": consistency,
        "cam_urls": cam_urls,
        "preprocess": preprocess_meta,
        "model_version": MODEL_VERSION,
        "analysis_time": round(time.time() - start, 2),
    }