import asyncio
import websockets
import paramiko
import os

SWITCH_IP = os.getenv('SWITCH_IP', '192.168.111.198')
SWITCH_USER = os.getenv('SWITCH_USER', 'sarra')
SWITCH_PASS = os.getenv('SWITCH_PASS', 'sarra')
RELAY_PORT = 5002

async def ssh_handler(websocket, path):
    ssh = None
    chan = None
    try:
        # Connect to switch via SSH
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(SWITCH_IP, username=SWITCH_USER, password=SWITCH_PASS, look_for_keys=False, allow_agent=False, timeout=10)
        # Open an interactive shell with PTY
        chan = ssh.invoke_shell(term='xterm', width=120, height=40)
        chan.settimeout(0.0)
        print(f"[+] SSH session established to {SWITCH_IP}")

        async def ws_to_ssh():
            async for message in websocket:
                if chan.send_ready():
                    chan.send(message)

        async def ssh_to_ws():
            while True:
                await asyncio.sleep(0.01)
                if chan.recv_ready():
                    data = chan.recv(4096)
                    if data:
                try:
                            await websocket.send(data.decode('utf-8', errors='ignore'))
                        except Exception as e:
                            print(f"[!] WebSocket send error: {e}")
                        break

        await asyncio.gather(ws_to_ssh(), ssh_to_ws())
    except Exception as e:
        print(f"[!] Error: {e}")
        try:
            await websocket.send(f"\r\n[SSH Relay Error] {e}\r\n")
        except:
            pass
    finally:
        if chan:
            try:
        chan.close()
            except:
                pass
        if ssh:
            try:
        ssh.close()
            except:
                pass
        try:
            await websocket.close()
        except:
            pass
        print("[-] SSH/WebSocket session closed.")

if __name__ == "__main__":
    print(f"[SSH Relay] Listening on port {RELAY_PORT} (WebSocket) -> {SWITCH_IP} (SSH)")
    asyncio.get_event_loop().run_until_complete(
        websockets.serve(ssh_handler, '0.0.0.0', RELAY_PORT)
    )
    asyncio.get_event_loop().run_forever() 