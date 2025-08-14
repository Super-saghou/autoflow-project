import os
import subprocess
from crewai import Agent, Task, Crew
from langchain_ollama import OllamaLLM

# Paths for file-based communication
PREPROMPT_PATH = 'preprompt.txt'
COMMANDS_PATH = 'output.txt'
PLAYBOOK_PATH = 'playbook.yml'
INVENTORY_PATH = '/agentic/inventory'

# Initialize Ollama LLM
llm = OllamaLLM(model="llama3.2:1b", base_url="http://localhost:11434")

def read_file(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ''

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    print("🚀 Starting CrewAI VLAN Workflow...")
    
    # Check if preprompt.txt exists
    if not os.path.exists(PREPROMPT_PATH):
        print(f"❌ {PREPROMPT_PATH} not found. Please create it first with your VLAN request.")
        return
    
    # Read the preprompt
    preprompt = read_file(PREPROMPT_PATH)
    print(f"📝 Preprompt: {preprompt}")
    
    # Step 1: Generate CLI commands
    print("\n🔧 Step 1: Generating CLI commands...")
    try:
        command_prompt = f"Given this network request: {preprompt}\n\nGenerate ONLY the exact Cisco IOS CLI commands to create the VLAN. Use ONLY these exact commands:\n- configure terminal\n- vlan [number] name [name]\n- end\n\nReturn ONLY the commands, one per line, NO explanations, NO extra text."
        commands = llm.invoke(command_prompt)
        write_file(COMMANDS_PATH, str(commands))
        print(f"✅ Commands generated and saved to {COMMANDS_PATH}")
        print(f"📋 Commands: {commands}")
    except Exception as e:
        print(f"❌ Error generating commands: {e}")
        return
    
    # Step 2: Generate Ansible playbook
    print("\n📋 Step 2: Generating Ansible playbook...")
    try:
        commands_content = read_file(COMMANDS_PATH)
        # Clean up backticks and filter out empty lines
        commands_list = [cmd.strip() for cmd in commands_content.split('\n') 
                        if cmd.strip() and not cmd.strip().startswith('```') and not cmd.strip().endswith('```')]
        
        # Find the vlan command (should contain 'vlan' and a number)
        vlan_cmd = None
        for cmd in commands_list:
            if 'vlan' in cmd.lower() and any(char.isdigit() for char in cmd):
                vlan_cmd = cmd
                break
        
        if not vlan_cmd:
            raise Exception("No valid VLAN command found in generated commands")
        
        # Extract VLAN number and name
        parts = vlan_cmd.split()
        vlan_num = None
        vlan_name = None
        
        for i, part in enumerate(parts):
            if part.lower() == 'vlan' and i + 1 < len(parts):
                vlan_num = parts[i + 1]
                # Look for name after vlan number, skip 'name' keyword
                if i + 2 < len(parts) and parts[i + 2].lower() != 'name':
                    vlan_name = parts[i + 2]
                elif i + 3 < len(parts):
                    vlan_name = parts[i + 3]
                break
        
        if not vlan_num:
            raise Exception("Could not extract VLAN number from command")
        
        playbook_content = f"""---
- name: VLAN Creation
  hosts: all
  gather_facts: false
  tasks:
    - name: Create VLAN using ios_config
      ios_config:
        lines:
          - vlan {vlan_num}
          - name {vlan_name or 'VLAN_' + vlan_num}
        parents: configure terminal
      register: vlan_result
      
    - name: Show VLAN result
      debug:
        var: vlan_result
"""
        
        write_file(PLAYBOOK_PATH, playbook_content)
        print(f"✅ Playbook generated and saved to {PLAYBOOK_PATH}")
    except Exception as e:
        print(f"❌ Error generating playbook: {e}")
        return
    
    # Step 3: Execute playbook (if inventory exists)
    print("\n⚡ Step 3: Executing playbook...")
    if os.path.exists(INVENTORY_PATH):
        try:
            result = subprocess.run(
                ['ansible-playbook', '--inventory-file', INVENTORY_PATH, PLAYBOOK_PATH, '-v', '--user', 'sarra', '--become', '--become-method', 'enable'],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                print("✅ Playbook executed successfully!")
                print(f"📊 Output: {result.stdout}")
            else:
                print(f"❌ Playbook execution failed: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            print("⏰ Playbook execution timed out")
        except Exception as e:
            print(f"❌ Error executing playbook: {e}")
    else:
        print(f"⚠️  Inventory file {INVENTORY_PATH} not found. Skipping execution.")
        print("📋 Playbook is ready for manual execution.")
    
    print("\n🎉 CrewAI VLAN Workflow completed!")
    print(f"📁 Generated files:")
    print(f"   - {COMMANDS_PATH}: CLI commands")
    print(f"   - {PLAYBOOK_PATH}: Ansible playbook")

if __name__ == "__main__":
    main() 