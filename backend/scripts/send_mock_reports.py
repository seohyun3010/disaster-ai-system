import json
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


API_URL = "http://127.0.0.1:8000/external-reports"

MOCK_FILE_PATH = (
    Path(__file__).resolve().parent.parent
    / "mock_data"
    / "external_reports.json"
)


def send_report(report: dict) -> None:
    request_body = json.dumps(
        report,
        ensure_ascii=False,
    ).encode("utf-8")

    request = Request(
        API_URL,
        data=request_body,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(request) as response:
            response_body = response.read().decode("utf-8")
            result = json.loads(response_body)

            print(
                f"[성공] {report['title']}\n"
                f"  HTTP 상태: {response.status}\n"
                f"  case_id: {result['case_id']}\n"
                f"  case_number: {result['case_number']}\n"
            )

    except HTTPError as error:
        error_body = error.read().decode("utf-8")

        print(
            f"[실패] {report.get('title')}\n"
            f"  HTTP 상태: {error.code}\n"
            f"  응답: {error_body}\n"
        )

    except URLError as error:
        print(
            f"[연결 실패] FastAPI 서버를 확인하세요.\n"
            f"  원인: {error.reason}\n"
        )


def main() -> None:
    with MOCK_FILE_PATH.open(
        "r",
        encoding="utf-8",
    ) as file:
        reports = json.load(file)

    print(f"Mock 신고 {len(reports)}건 전송을 시작합니다.\n")

    for report in reports:
        send_report(report)

    print("Mock 신고 전송이 완료되었습니다.")


if __name__ == "__main__":
    main()