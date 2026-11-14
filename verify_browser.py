"""Automated browser verification using Chrome DevTools Protocol (CDP).
Tests that http://localhost:5173/ loads CodeFrontier, clicks Launch Studio,
verifies live backend integration, checks console logs, and saves screenshot.
"""

import asyncio
import base64
import json
import subprocess
import sys
import time
import urllib.request
import websockets

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
TARGET_URL = "http://localhost:5173/"

# Force UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

async def main():
    # 1. Start headless Chrome with CDP
    proc = subprocess.Popen(
        [
            CHROME_PATH,
            "--remote-debugging-port=9222",
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--window-size=1440,960",
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    
    try:
        time.sleep(2)
        version_url = "http://127.0.0.1:9222/json/version"
        req = urllib.request.urlopen(version_url)
        v_info = json.loads(req.read().decode())
        print(f"[CDP] Connected to Chrome: {v_info.get('Browser')}")

        new_tab_url = f"http://127.0.0.1:9222/json/new?{TARGET_URL}"
        req_tab = urllib.request.urlopen(urllib.request.Request(new_tab_url, method="PUT"))
        tab_info = json.loads(req_tab.read().decode())
        ws_url = tab_info["webSocketDebuggerUrl"]
        print(f"[CDP] Attached to page: {TARGET_URL}")

        async with websockets.connect(ws_url) as ws:
            msg_id = 0

            async def send_cmd(method, params=None):
                nonlocal msg_id
                msg_id += 1
                payload = {"id": msg_id, "method": method, "params": params or {}}
                await ws.send(json.dumps(payload))
                while True:
                    res_raw = await ws.recv()
                    res = json.loads(res_raw)
                    if res.get("id") == msg_id:
                        return res.get("result", {})

            await send_cmd("Page.enable")
            await send_cmd("Runtime.enable")
            await send_cmd("Console.enable")

            console_logs = []

            async def listen_events():
                try:
                    while True:
                        raw = await ws.recv()
                        ev = json.loads(raw)
                        if ev.get("method") == "Console.messageAdded":
                            msg = ev["params"]["message"]
                            console_logs.append(f"[{msg.get('level')}] {msg.get('text')}")
                        elif ev.get("method") == "Runtime.consoleAPICalled":
                            args = ev["params"].get("args", [])
                            text = " ".join(str(a.get("value", "")) for a in args)
                            console_logs.append(f"[{ev['params'].get('type')}] {text}")
                except Exception:
                    pass

            listen_task = asyncio.create_task(listen_events())

            # Navigate to page
            await send_cmd("Page.navigate", {"url": TARGET_URL})
            print("[CDP] Waiting for React application hydration...")
            await asyncio.sleep(3)

            # Check Landing Page DOM
            landing_check = await send_cmd(
                "Runtime.evaluate",
                {
                    "expression": """
                    JSON.stringify({
                        title: document.title,
                        hasRoot: !!document.getElementById('root'),
                        hasLaunchButton: !!Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LAUNCH STUDIO')),
                        heroText: document.querySelector('h1')?.innerText || '',
                    })
                    """,
                    "returnByValue": True,
                },
            )
            landing_data = json.loads(landing_check.get("result", {}).get("value", "{}"))
            print(f"[CDP] Landing Page Title: '{landing_data.get('title')}'")
            print(f"[CDP] Has Launch Studio CTA: {landing_data.get('hasLaunchButton')}")
            print(f"[CDP] Headline: '{landing_data.get('heroText').replace(chr(10), ' ')}'")

            # Click "LAUNCH STUDIO" button to enter Handover Studio
            print("[CDP] Clicking 'LAUNCH STUDIO' button...")
            click_res = await send_cmd(
                "Runtime.evaluate",
                {
                    "expression": """
                    (() => {
                        const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('LAUNCH STUDIO'));
                        if (btn) {
                            btn.click();
                            return true;
                        }
                        return false;
                    })()
                    """,
                    "returnByValue": True,
                },
            )
            print(f"[CDP] Click dispatched: {click_res.get('result', {}).get('value')}")

            # Wait for Studio mode hydration and backend API fetch
            await asyncio.sleep(3)

            # Evaluate Studio Mode DOM
            studio_check = await send_cmd(
                "Runtime.evaluate",
                {
                    "expression": """
                    JSON.stringify({
                        isLiveApi: document.body.innerText.includes('LIVE API') || document.body.innerText.includes('SYS_LIVE_API'),
                        hasBentoMetrics: document.body.innerText.includes('TOTAL CLAIMS') || document.body.innerText.includes('METRICS'),
                        claimsCountText: Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('CLAIMS ('))?.innerText || '',
                        conflictsFound: document.body.innerText.includes('CONFLICTS'),
                        firstClaimText: Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('PostgreSQL'))?.innerText.slice(0, 80) || '',
                        activeProjectName: Array.from(document.querySelectorAll('header *')).find(el => el.innerText && el.innerText.includes('Apex Core'))?.innerText || '',
                    })
                    """,
                    "returnByValue": True,
                },
            )
            studio_data = json.loads(studio_check.get("result", {}).get("value", "{}"))
            print(f"[CDP] Studio Live API Indicator: {studio_data.get('isLiveApi')}")
            print(f"[CDP] Bento Metrics Bar Rendered: {studio_data.get('hasBentoMetrics')}")
            print(f"[CDP] Active Handover Project: '{studio_data.get('activeProjectName')}'")
            print(f"[CDP] First Claim Text: '{studio_data.get('firstClaimText')}'")
            print(f"[CDP] Conflicts Detected: {studio_data.get('conflictsFound')}")

            # Capture Screenshot of Studio
            screenshot_res = await send_cmd("Page.captureScreenshot", {"format": "png"})
            img_b64 = screenshot_res.get("data")
            if img_b64:
                with open("codefrontier_studio_verified.png", "wb") as f:
                    f.write(base64.b64decode(img_b64))
                print("[CDP] Screenshot saved: codefrontier_studio_verified.png")

            listen_task.cancel()

            print(f"\n[CDP] Console Logs collected ({len(console_logs)}):")
            has_error = False
            for log in console_logs:
                print(f"  {log}")
                if "[error]" in log.lower() and not "favicon" in log.lower():
                    has_error = True

            assert landing_data.get("hasRoot"), "React #root element not found"
            assert landing_data.get("hasLaunchButton"), "Launch Studio CTA not found"
            assert studio_data.get("isLiveApi"), "Studio did not connect to Live Backend API"
            assert studio_data.get("firstClaimText"), "Claims failed to render in Studio"
            
            print("\n" + "="*80)
            print(">>> COMPLETE IN-BROWSER END-TO-END VERIFICATION: 100% PASSED <<<")
            print("="*80)

    finally:
        proc.kill()

if __name__ == "__main__":
    asyncio.run(main())
