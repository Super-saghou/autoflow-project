from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
import requests
import warnings
from datetime import datetime
import threading
import uuid
import time

# Suppress deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="cryptography")
warnings.filterwarnings("ignore", category=DeprecationWarning, module="paramiko")

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "llama3.2:1b"

def check_ollama_available():
    """Check if Ollama is running and the model is available"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags")
        if response.status_code == 200:
            models = response.json().get('models', [])
            return any(model['name'] == OLLAMA_MODEL for model in models)
        return False
    except Exception as e:
        logger.error(f"Failed to check Ollama availability: {e}")
        return False

def generate_ai_response(prompt, role="Security Analyst"):
    """Generate AI response using Ollama"""
    try:
        # Create a system prompt based on the role
        system_prompts = {
            "Security Analyst": "You are an expert cybersecurity analyst. Provide detailed security analysis, threat assessments, and actionable recommendations. Be thorough and professional in your responses.",
            "Network Engineer": "You are a senior network engineer specializing in Cisco devices, VLANs, DHCP, and network security. Provide technical recommendations and best practices.",
            "Threat Intelligence": "You are a threat intelligence expert. Analyze security threats, provide risk assessments, and recommend mitigation strategies."
        }
        
        system_prompt = system_prompts.get(role, system_prompts["Security Analyst"])
        
        # Prepare the request to Ollama
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": f"{system_prompt}\n\nUser Request: {prompt}\n\nProvide a comprehensive analysis:",
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 2000
            }
        }
        
        response = requests.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
        
        if response.status_code == 200:
            result = response.json()
            return result.get('response', 'No response generated')
        else:
            logger.error(f"Ollama API error: {response.status_code} - {response.text}")
            return f"Error: Failed to generate response (Status: {response.status_code})"
            
    except Exception as e:
        logger.error(f"Error generating AI response: {e}")
        return f"Error: {str(e)}"

@app.route("/health", methods=["GET"])
def health_check():
    ollama_available = check_ollama_available()
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ollama_available": ollama_available,
        "model": OLLAMA_MODEL
    })

@app.route("/custom_analysis", methods=["POST"])
def custom_analysis():
    try:
        data = request.get_json()
        custom_prompt = data.get('prompt', '')
        role = data.get('role', 'Security Analyst')
        
        if not custom_prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Check if Ollama is available
        if not check_ollama_available():
            return jsonify({"error": "Ollama is not available. Please ensure Ollama is running with the llama2:7b model."}), 500
        
        logger.info(f"Starting custom analysis with prompt: {custom_prompt[:100]}...")
        
        # Generate AI response
        result = generate_ai_response(custom_prompt, role)
        
        return jsonify({
            "result": result,
            "prompt": custom_prompt,
            "role": role,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error in custom analysis: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/run_agents", methods=["POST"])
def run_agents():
    try:
        # Check if Ollama is available
        if not check_ollama_available():
            return jsonify({"error": "Ollama is not available. Please ensure Ollama is running with the llama2:7b model."}), 500
        
        # Generate responses for different security aspects
        security_analysis = generate_ai_response(
            "Analyze the current network security status and provide a comprehensive security assessment with recommendations.",
            "Security Analyst"
        )
        
        network_recommendations = generate_ai_response(
            "Review network configuration and provide recommendations for VLAN optimization, DHCP improvements, and security enhancements.",
            "Network Engineer"
        )
        
        threat_assessment = generate_ai_response(
            "Perform a threat assessment and provide risk analysis with mitigation strategies.",
            "Threat Intelligence"
        )
        
        combined_result = f"""
=== SECURITY ANALYSIS ===
{security_analysis}

=== NETWORK RECOMMENDATIONS ===
{network_recommendations}

=== THREAT ASSESSMENT ===
{threat_assessment}
"""
        
        return jsonify({
            "result": combined_result,
            "timestamp": datetime.now().isoformat(),
            "status": "success"
        })
    except Exception as e:
        logger.error(f"Error running agents: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/agent_status", methods=["GET"])
def agent_status():
    ollama_available = check_ollama_available()
    return jsonify({
        "ollama_available": ollama_available,
        "model": OLLAMA_MODEL,
        "agents_ready": ollama_available,
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "health": "/health",
            "run_agents": "/run_agents",
            "custom_analysis": "/custom_analysis",
            "agent_status": "/agent_status"
        }
    })

# In-memory task store (for demo; use persistent store in production)
task_store = {}

def run_agent_ai_config_task(task_id, prompt):
    import subprocess
    import shlex
    try:
        # 1. Write preprompt to /agentic/preprompt.txt (for agent3.py)
        with open('/agentic/preprompt.txt', 'w', encoding='utf-8') as f:
            f.write(prompt)
        task_store[task_id]['step'] = 'Prompt written to /agentic/preprompt.txt'

        # 2. Try to call CrewAI orchestrator script (/agentic/crewai.py or local)
        crew_script = None
        if os.path.exists('/agentic/crewai.py'):
            crew_script = '/agentic/crewai.py'
        else:
            for candidate in ['crew.py', 'crewai.py', 'crewAI.py', 'crew_agent.py']:
                if os.path.exists(candidate):
                    crew_script = candidate
                    break
        if crew_script:
            # Call the script, pass prompt as argument if supported, else rely on preprompt.txt
            try:
                cmd = f'python3 {crew_script}'
                crew_output = subprocess.check_output(
                    shlex.split(cmd),
                    stderr=subprocess.STDOUT,
                    timeout=300,
                    cwd='/agentic'
                ).decode('utf-8', errors='ignore')
                task_store[task_id]['crew_output'] = crew_output
                # Try to parse key steps from output
                # (You can improve this parsing based on your script's output format)
                if 'playbook generated' in crew_output.lower():
                    task_store[task_id]['playbook_result'] = 'Playbook generated.'
                if 'exécution du playbook' in crew_output.lower() or 'execution of playbook' in crew_output.lower():
                    # Find execution log
                    lines = crew_output.splitlines()
                    exec_lines = [l for l in lines if 'ansible-playbook' in l or 'FAILED' in l or 'SUCCESS' in l]
                    task_store[task_id]['exec_result'] = '\n'.join(exec_lines)
                # Optionally, read output.txt for AI commands
                try:
                    with open('/agentic/output.txt', 'r', encoding='utf-8') as f:
                        task_store[task_id]['ai_commands'] = f.read()
                except Exception:
                    pass
                task_store[task_id]['status'] = 'completed'
                task_store[task_id]['success'] = True
                return
            except subprocess.CalledProcessError as e:
                # Always capture all output, even on error
                crew_output = e.output.decode('utf-8', errors='ignore')
                task_store[task_id]['crew_output'] = crew_output
                task_store[task_id]['status'] = 'error'
                task_store[task_id]['error'] = f'CrewAI script error: {crew_output}'
                # Optionally, try to parse logs as above
                return
            except Exception as e:
                task_store[task_id]['status'] = 'error'
                task_store[task_id]['error'] = f'CrewAI script exception: {str(e)}'
                return
        # Fallback: previous logic
        try:
            ai_commands = generate_ai_response(prompt, role="Network Engineer")
            with open('output.txt', 'w', encoding='utf-8') as f:
                f.write(ai_commands)
            task_store[task_id]['ai_commands'] = ai_commands
            task_store[task_id]['step'] = 'AI commands generated'
        except Exception as e:
            task_store[task_id]['status'] = 'error'
            task_store[task_id]['error'] = f'AI generation error: {str(e)}'
            return
        try:
            playbook_result = subprocess.check_output([
                'python3', 'agent2_generate_playbook.py', 'output.txt'
            ], stderr=subprocess.STDOUT, timeout=120).decode('utf-8', errors='ignore')
        except Exception as e:
            playbook_result = f"Playbook generation error: {str(e)}"
        task_store[task_id]['playbook_result'] = playbook_result
        try:
            exec_result = subprocess.check_output([
                'ansible-playbook', 'playbook.yml', '-i', 'inventory.ini', '-vv'
            ], stderr=subprocess.STDOUT, timeout=180).decode('utf-8', errors='ignore')
            success = True
        except subprocess.CalledProcessError as e:
            exec_result = e.output.decode('utf-8', errors='ignore')
            success = False
        task_store[task_id]['exec_result'] = exec_result
        task_store[task_id]['success'] = success
        task_store[task_id]['status'] = 'completed' if success else 'error'
    except Exception as e:
        task_store[task_id]['status'] = 'error'
        task_store[task_id]['error'] = str(e)

@app.route('/api/agent-ai-config-task', methods=['POST'])
def agent_ai_config_task():
    data = request.get_json()
    prompt = data.get('prompt')
    if not prompt:
        return jsonify({'error': 'No prompt provided'}), 400
    task_id = str(uuid.uuid4())
    task_store[task_id] = {'status': 'running', 'created': time.time()}
    thread = threading.Thread(target=run_agent_ai_config_task, args=(task_id, prompt))
    thread.start()
    return jsonify({'task_id': task_id, 'status': 'started'})

@app.route('/api/agent-ai-config-task/status/<task_id>', methods=['GET'])
def agent_ai_config_task_status(task_id):
    task = task_store.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(task)

if __name__ == "__main__":
    logger.info("Starting AI Agents API on port 5003...")
    logger.info(f"Using Ollama model: {OLLAMA_MODEL}")
    app.run(port=5003, debug=True, host='0.0.0.0') 