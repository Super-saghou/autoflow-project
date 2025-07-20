import asyncio
import websockets
import paramiko
import threading

SSH_HOST = "192.168.111.198"
SSH_PORT = 22
SSH_USER = "sarra"
SSH_PASS = "sarra"

async def relay(websocket):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SSH_HOST, port=SSH_PORT, username=SSH_USER, password=SSH_PASS)
    chan = client.invoke_shell(term='vt100', width=120, height=40)
    chan.settimeout(0.0)

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
            except Exception:
                continue

    threading.Thread(target=read_from_ssh, daemon=True).start()

    try:
        async for message in websocket:
            chan.send(message)
    finally:
        chan.close()
        client.close()

async def main():
    async with websockets.serve(relay, "0.0.0.0", 5010):
        print("WebSocket SSH relay started on port 5010")
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    asyncio.run(main()) 