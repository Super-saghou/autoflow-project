from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import os
import requests
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Ollama configuration
OLLAMA_BASE_URL = "http://localhost:11434"
OLLAMA_MODEL = "tinyllama:latest"

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

if __name__ == "__main__":
    logger.info("Starting AI Agents API on port 5003...")
    logger.info(f"Using Ollama model: {OLLAMA_MODEL}")
    app.run(port=5003, debug=True, host='0.0.0.0') 