#!/usr/bin/env python3
import json
import urllib.request
import urllib.error
import sys

API_KEY = "6b0c6e14-5aa9-41aa-a7cf-d43b51d0826b"
PHONE_NUMBER_ID = "6c35719e-45f4-48c9-b6c0-703ac10fbe7d"
BASE_URL = "https://api.vapi.ai"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
    "User-Agent": "curl/8.7.1"
}

import ssl

ctx = ssl._create_unverified_context()

def request(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method, headers=headers)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req, context=ctx) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        print(f"HTTPError {e.code} on {endpoint}: {err_body}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error on {endpoint}: {e}", file=sys.stderr)
        return None

print("1. Checking Phone Number details...")
phone_info = request(f"/phone-number/{PHONE_NUMBER_ID}")
print("Phone Info:", json.dumps(phone_info, indent=2))

print("\n2. Creating or updating ARGUS Voice Assistant...")
assistant_payload = {
    "name": "ARGUS Autonomous Linux Agent",
    "model": {
        "provider": "openai",
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are ARGUS, an autonomous voice-native Linux agent daemon and system control layer "
                    "created and engineered by R Jan Steve Daniel.\n\n"
                    "Background & System Architecture:\n"
                    "- You are built on a modular 14-crate Rust cargo workspace: argusd daemon, argus-cli, "
                    "argus-core, argus-sandbox, argus-linux, argus-agent, argus-voice, argus-sysinfo, "
                    "argus-fs, argus-process, argus-service, argus-net, argus-pkg, and argus-phone.\n"
                    "- You govern Linux processes with Landlock LSM, cgroups v2, Bubblewrap namespaces, "
                    "and cryptographic SHA-256 byte proofs with append-only flight recording.\n"
                    "- In the 20-Point Adversarial Red Team Security Suite, you have a 100% pass rate, "
                    "deterministically intercepting path traversal, credential harvesting (/etc/shadow), "
                    "SSRF cloud metadata queries, fork bombs, and prompt injections.\n\n"
                    "Your Persona When Anyone Calls +1 (603) 467-1058:\n"
                    "- You sound extremely capable, intelligent, professional, and slightly conversational, "
                    "like a next-generation JARVIS for Linux servers.\n"
                    "- You greet the caller politely and introduce yourself as ARGUS, the autonomous Linux agent.\n"
                    "- If asked about the system or who created you, proudly explain that R Jan Steve Daniel "
                    "created you as an AI control layer for Linux for the Nebius x NVIDIA Global AI Hackathon.\n"
                    "- If the caller gives you a command (e.g., 'Check system health', 'What is port 8080 status?', "
                    "'Run security audit', 'Approve package installation'), confirm the command clearly and explain "
                    "how ARGUS validates capability tokens and executes inside the sandbox.\n"
                    "- Keep answers concise, clear, and natural. Don't ramble with large markdown blocks, speak naturally."
                )
            }
        ]
    },
    "voice": {
        "provider": "11labs",
        "voiceId": "josh"
    },
    "firstMessage": (
        "Hello! This is ARGUS, the autonomous voice-native Linux agent daemon, "
        "created by R Jan Steve Daniel. I am online and monitoring the system. How can I assist you today?"
    ),
    "endCallFunctionEnabled": True,
    "maxDurationSeconds": 600
}

new_assistant = request("/assistant", method="POST", data=assistant_payload)
if new_assistant and "id" in new_assistant:
    assistant_id = new_assistant["id"]
    print(f"Created Assistant with ID: {assistant_id}")
    
    print(f"\n3. Linking Assistant {assistant_id} to Phone Number {PHONE_NUMBER_ID}...")
    update_res = request(f"/phone-number/{PHONE_NUMBER_ID}", method="PATCH", data={"assistantId": assistant_id, "name": "ARGUS Daemon Hotline"})
    print("Link Result:", json.dumps(update_res, indent=2))
    print("\n✅ SUCCESS: Phone number +1 (603) 467-1058 is now live and linked to ARGUS Voice Agent!")
else:
    print("Failed to create assistant.")
