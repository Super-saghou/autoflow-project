import os
from crewai import Agent, Task, Crew
from crewai.tools import BaseTool
import subprocess
from netmiko import ConnectHandler

try:
    from langchain_ollama import OllamaLLM
except ImportError:
    try:
        from langchain_ollama import OllamaLLM as Ollama
    except ImportError:
        raise ImportError("Could not import Ollama LLM from langchain_ollama. Please check your installed version and documentation.")

# Paths for file-based communication (can be adjusted)
PREPROMPT_PATH = 'preprompt.txt'
COMMANDS_PATH = 'output.txt'
PLAYBOOK_PATH = 'playbook.yml'
INVENTORY_PATH = '/agentic/inventory'

llm = OllamaLLM(model="llama3:latest", base_url="http://localhost:11434")

def read_file(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ''

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

class PrepromptTool(BaseTool):
    name: str = "preprompt_tool"
    description: str = "Prepare preprompt from user input"

    def _run(self, user_prompt: str) -> str:
        write_file(PREPROMPT_PATH, user_prompt)
        return f"Preprompt written: {user_prompt}"

class CommandGenTool(BaseTool):
    name: str = "command_gen_tool"
    description: str = "Generate CLI/Ansible commands from preprompt"

    def _run(self, _: str) -> str:
        preprompt = read_file(PREPROMPT_PATH)
        response = llm(f"Given this network request, generate the CLI commands to create the VLAN: {preprompt}")
        write_file(COMMANDS_PATH, response)
        return f"Commands generated and written to {COMMANDS_PATH}"

class PlaybookGenTool(BaseTool):
    name: str = "playbook_gen_tool"
    description: str = "Generate Ansible playbook from commands"

    def _run(self, _: str) -> str:
        commands = read_file(COMMANDS_PATH)
        commands_formatted = commands.strip().replace('\n', '\n          - ')
        playbook = (
            "---\n"
            "- name: VLAN creation\n"
            "  hosts: all\n"
            "  tasks:\n"
            "    - name: Run VLAN commands\n"
            "      ios_command:\n"
            "        commands:\n"
            f"          - {commands_formatted}\n"
        )
        write_file(PLAYBOOK_PATH, playbook)
        return f"Playbook generated and written to {PLAYBOOK_PATH}"

class ExecutorTool(BaseTool):
    name: str = "executor_tool"
    description: str = "Execute the playbook and verify the result on the network device"

    def _run(self, _: str) -> str:
        logs = []
        if os.path.exists(PLAYBOOK_PATH) and os.path.exists(INVENTORY_PATH):
            logs.append(f"Running playbook: {PLAYBOOK_PATH} with inventory: {INVENTORY_PATH}")
            try:
                result = subprocess.run(
                    ['ansible-playbook', '-i', INVENTORY_PATH, PLAYBOOK_PATH, '-v'],
                    capture_output=True,
                    text=True
                )
                logs.append(result.stdout)
                if result.returncode == 0:
                    logs.append("✅ Playbook executed successfully.")
                    try:
                        device = {
                            'device_type': 'cisco_ios',
                            'host': '192.168.111.198',
                            'username': 'sarra',
                            'password': 'sarra',
                            'secret': 'sarra',
                            'port': 22,
                        }
                        net_connect = ConnectHandler(**device)
                        net_connect.enable()
                        output = net_connect.send_command('show vlan-switch brief')
                        logs.append("\n--- VLAN Table After Execution ---\n" + output)
                        net_connect.disconnect()
                    except Exception as ve:
                        logs.append(f"[Verification error]: {ve}")
                else:
                    logs.append(f"❌ Playbook execution failed.\n{result.stderr}")
            except Exception as e:
                logs.append(f"❌ Error running playbook: {str(e)}")
        else:
            logs.append("Playbook or inventory not found.")
        return '\n'.join(logs)

preprompt_agent = Agent(
    role="Preprompt Preparer",
    goal="Convert user prompt into a structured network configuration request.",
    backstory="You are the first step in an agentic workflow for network automation.",
    llm=llm,
    tools=[PrepromptTool()],
)

command_agent = Agent(
    role="Command Generator",
    goal="Generate CLI or Ansible commands for the requested network change.",
    backstory="You translate structured requests into actionable commands.",
    llm=llm,
    tools=[CommandGenTool()],
)

playbook_agent = Agent(
    role="Playbook Generator",
    goal="Generate an Ansible playbook from the provided commands.",
    backstory="You are responsible for creating valid Ansible playbooks.",
    llm=llm,
    tools=[PlaybookGenTool()],
)

executor_agent = Agent(
    role="Executor",
    goal="Execute the playbook and verify the result on the network device.",
    backstory="You run the playbook and check the device state.",
    llm=llm,
    tools=[ExecutorTool()],
)

# Define tasks and chain them
def main():
    user_prompt = read_file(PREPROMPT_PATH)
    if not user_prompt:
        user_prompt = input("Enter user prompt for VLAN creation: ")
        write_file(PREPROMPT_PATH, user_prompt)

    task1 = Task(description="Prepare preprompt from user input.", agent=preprompt_agent)
    task2 = Task(description="Generate CLI/Ansible commands from preprompt.", agent=command_agent)
    task3 = Task(description="Generate Ansible playbook from commands.", agent=playbook_agent)
    task4 = Task(description="Check playbook and (optionally) execute.", agent=executor_agent)

    crew = Crew(
        agents=[preprompt_agent, command_agent, playbook_agent, executor_agent],
        tasks=[task1, task2, task3, task4],
        verbose=True,
    )
    result = crew.kickoff()
    print(result)

if __name__ == "__main__":
    main() 