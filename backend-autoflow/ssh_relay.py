import asyncio
import websockets
import paramiko
import threading
import time

SSH_HOST = "192.168.111.198"
SSH_PORT = 22
SSH_USER = "sarra"
SSH_PASS = "sarra"

def connect_with_retry(max_retries=3):
    """Connect to SSH with retry logic and proper timeouts"""
    for attempt in range(max_retries):
        try:
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            client.connect(
                SSH_HOST, 
                port=SSH_PORT, 
                username=SSH_USER, 
                password=SSH_PASS,
                timeout=30,  # Use the correct timeout parameter
                look_for_keys=False,
                allow_agent=False
            )
            return client
        except Exception as e:
            print(f"SSH connection attempt {attempt + 1} failed: {e}")
            if attempt == max_retries - 1:
                raise e
            time.sleep(2)  # Wait before retry

async def relay(websocket):
    try:
        client = connect_with_retry()
    chan = client.invoke_shell(term='vt100', width=120, height=40)
        chan.settimeout(30.0)  # Increased timeout

    def read_from_ssh():
        while True:
            try:
                data = chan.recv(1024)
                if not data:
                    break
                asyncio.run_coroutine_threadsafe(
                    websocket.send(data.decode(errors='ignore')),
                    asyncio.get_event_loop()
                )
                except Exception as e:
                    print(f"SSH read error: {e}")
                    break

    threading.Thread(target=read_from_ssh, daemon=True).start()

    try:
        async for message in websocket:
            chan.send(message)
    finally:
        chan.close()
        client.close()
    except Exception as e:
        print(f"SSH relay error: {e}")
        await websocket.close()

async def main():
    async with websockets.serve(relay, "0.0.0.0", 5010):
        print("WebSocket SSH relay started on port 5010")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main()) 