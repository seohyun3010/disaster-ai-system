import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

API_URL = "http://127.0.0.1:8000/cases"
MOCK_FILE_PATH = (
    Path(__file__).resolve().parent.parent / "mock_data" / "cases.json"
)


def send_case(case: dict) -> None:
    request = Request(
        API_URL,
        data=json.dumps(case, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request) as response:
            result = json.loads(response.read().decode("utf-8"))
            print(
                f"[성공] {case['external_report_id']} -> "
                f"{result['case_number']} (case_id={result['case_id']})"
            )
    except HTTPError as error:
        print(
            f"[실패] {case['external_report_id']} HTTP {error.code}: "
            f"{error.read().decode('utf-8')}"
        )
    except URLError as error:
        print(f"[연결 실패] FastAPI 서버를 확인하세요: {error.reason}")


def main() -> None:
    with MOCK_FILE_PATH.open("r", encoding="utf-8") as file:
        cases = json.load(file)
    for case in cases:
        send_case(case)


if __name__ == "__main__":
    main()
