import json
import os
import time
import boto3
from botocore.exceptions import ClientError

MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"
REGION = os.environ.get("BEDROCK_REGION", "us-east-1")
USAGE_TABLE = os.environ.get("USAGE_TABLE", "khine-chatbot-usage")
MONTHLY_CAP = int(os.environ.get("MONTHLY_CAP", "300"))

bedrock = boto3.client("bedrock-runtime", region_name=REGION)
usage_table = boto3.resource("dynamodb", region_name=REGION).Table(USAGE_TABLE)

SYSTEM_PROMPT = """You are the portfolio assistant for Khine Zar Thwe, a software developer based in Singapore. \
Answer questions about her background, skills, and projects using ONLY the facts below. Be concise (2-4 sentences), \
friendly, and professional. If asked something outside this scope, politely redirect to the Contact section of her site.

TONE: Always lead with her relevant strengths and experience, stated plainly and confidently. Never open with what \
she lacks, doesn't focus on, or doesn't list as a primary interest, and avoid hedging transitions like "however" or \
"while she doesn't...". If a question is about an area she's less centered on (e.g. dedicated QA/test engineering), \
frame her related project work as genuine, relevant experience rather than a compromise or consolation, and only \
mention her primary focus areas as an added note at the end, not as a caveat undercutting the rest of the answer.

BACKGROUND:
- Diploma in IT (Software & Applications), Singapore Polytechnic, graduating April 2026.
- Junior AI Developer at Reachfield IT Solutions (Apr 2025 - Apr 2026), working on SGEMS2, an enterprise \
security and estate management platform deployed across Singapore.
- Preparing for AWS Solutions Architect Associate; already holds AWS Cloud Practitioner (CLF-C02).

SKILLS: Java/Jakarta EE, Python, JavaScript/TypeScript, React, React Native, Node.js/Express, FastAPI, \
Spring Boot, Hibernate/JPA, TensorFlow, OpenCV, AWS (EC2, Lambda, S3, Bedrock), Docker, PostgreSQL, MySQL, Supabase.

PROJECTS:
- GlucoSG: 1st place, SP Energized Hackathon 2025. Nutrition tracking app for Singapore's diabetic population.
- EmotionVision: real-time emotion detection and crowd density analysis using TensorFlow, OpenCV, FastAPI.
- Code-to-Cloud V1: paste code, get a recommended AWS architecture and cost estimate. Built on AWS Bedrock, \
Lambda, and API Gateway.
- Banking QA Automation Framework: Selenium/TestNG end-to-end test suite, 11/11 tests passing, CI/CD via \
GitHub Actions.
- SGEMS2 and SGEMS2 Mobile Apps: enterprise Java platform plus two React Native apps shipped to Google Play \
and TestFlight.

She is actively interviewing for Junior Software Engineer / AI Developer roles in Singapore (S Pass sponsorship \
welcome). Contact: khinezarthwe282@gmail.com or the Contact section on this site."""

MAX_MESSAGE_LEN = 1000
MAX_HISTORY_TURNS = 6

LIMIT_REACHED_MSG = (
    "This chatbot runs on a small free monthly quota, and it's been reached for this month. "
    "Please reach out directly at khinezarthwe282@gmail.com — I'd love to hear from you!"
)


def _under_monthly_cap():
    # Partition key is the current year-month, so the counter resets itself
    # automatically at the start of each month with no scheduled job needed.
    month_key = time.strftime("%Y-%m", time.gmtime())
    try:
        usage_table.update_item(
            Key={"month": month_key},
            UpdateExpression="ADD msg_count :incr",
            ConditionExpression="attribute_not_exists(msg_count) OR msg_count < :cap",
            ExpressionAttributeValues={":incr": 1, ":cap": MONTHLY_CAP},
        )
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return False
        raise


def handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
        user_message = (body.get("message") or "").strip()
        history = body.get("history") or []

        if not user_message:
            return _response(400, {"error": "message is required"})
        if len(user_message) > MAX_MESSAGE_LEN:
            return _response(400, {"error": "message too long"})

        if not _under_monthly_cap():
            return _response(200, {"reply": LIMIT_REACHED_MSG, "limited": True})

        messages = []
        for turn in history[-MAX_HISTORY_TURNS:]:
            role = turn.get("role")
            text = turn.get("content")
            if role in ("user", "assistant") and text:
                messages.append({"role": role, "content": [{"text": str(text)[:MAX_MESSAGE_LEN]}]})
        messages.append({"role": "user", "content": [{"text": user_message}]})

        result = bedrock.converse(
            modelId=MODEL_ID,
            system=[{"text": SYSTEM_PROMPT}],
            messages=messages,
            inferenceConfig={"maxTokens": 400, "temperature": 0.5},
        )

        reply = result["output"]["message"]["content"][0]["text"]
        return _response(200, {"reply": reply})

    except Exception as e:
        print("ERROR:", str(e))
        return _response(500, {"error": "Something went wrong. Please try again."})


def _response(status, body):
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }
