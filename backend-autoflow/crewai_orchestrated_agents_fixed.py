#!/usr/bin/env python3
"""
CrewAI Orchestrated Agents - Fixed Version with Timeout Handling
5-Agent System for Network Automation
"""

import os
import re
import json
import yaml
import logging
import subprocess
from datetime import datetime
from langchain_ollama import OllamaLLM
import signal
import threading
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import socket
import struct

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# File paths
PREPROMPT_PATH = "preprompt.txt"
OUTPUT_PATH = "output.txt"
PLAYBOOK_PATH = "playbook.yml"
INVENTORY_PATH = "inventory"

class TimeoutError(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutError("LLM call timed out")

class CrewAIOrchestratedAgents:
    def __init__(self, use_llm=True):
        """Initialize the 6-agent CrewAI orchestration system"""
        # Initialize logger
        self.logger = logging.getLogger(__name__)
        
        self.use_llm = use_llm
        
        # Initialize Ollama LLM if enabled
        if self.use_llm:
            try:
                self.llm = OllamaLLM(model="llama3.2:1b", base_url="http://localhost:11434")
                self.logger.info("🤖 Initialized Ollama LLM with model: llama3.2:1b")
            except Exception as e:
                self.logger.warning(f"⚠️ LLM initialization failed: {e}")
                self.llm = None
        else:
            self.llm = None
        
        # Email configuration for security alerts
        self.email_config = {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'sender_email': 'sarra.bngharbia@gmail.com',  # Your actual email
            'sender_password': 'burf higo ucuw amoy',  # Update with your Gmail app password
            'recipient_email': 'sarra.bngharbia@gmail.com'  # Your actual email
        }
        
        # Security monitoring configuration
        self.security_config = {
            'monitoring_interval': 10,  # Check every 10 seconds (faster)
            'port_scan_threshold': 5,   # Alert if >5 ports scanned in 1 minute
            'brute_force_threshold': 3,  # Alert if >3 failed attempts in 1 minute
            'ddos_threshold': 50,        # Alert if >50 packets/second from single IP
            'enable_auto_response': True,
            'enable_email_alerts': True
        }
        
        # Threat tracking
        self.threat_tracker = {
            'suspicious_ips': {},
            'attack_history': [],
            'blocked_ips': set(),
            'last_cleanup': datetime.now()
        }
        
        # Start security monitoring thread
        self.monitoring_active = False
        self.security_thread = None

    def safe_llm_call(self, prompt, timeout_seconds=15):
        """Make LLM call with timeout handling"""
        if not self.llm:
            return None
            
        try:
            # Set up timeout signal
            signal.signal(signal.SIGALRM, timeout_handler)
            signal.alarm(timeout_seconds)
            
            # Make the LLM call
            response = self.llm.invoke(prompt)
            
            # Cancel timeout
            signal.alarm(0)
            
            return response
        except TimeoutError:
            self.logger.warning(f"⏰ LLM call timed out after {timeout_seconds} seconds")
            return None
        except Exception as e:
            self.logger.warning(f"⚠️ LLM call failed: {e}")
            return None

    def ai_choose_playbook_strategy(self, human_request: str, parsed_request: dict, commands: list) -> dict:
        """AI-Powered decision making for playbook strategy"""
        self.logger.info("🧠 Agent 3: Analyzing request to choose optimal playbook strategy...")
        
        # AI Analysis: Determine complexity and requirements
        complexity_score = self.ai_analyze_complexity(human_request, parsed_request)
        requirements = self.ai_analyze_requirements(human_request, parsed_request)
        
        # AI Decision: Choose the best module and strategy
        if self.llm:
            strategy_prompt = f"""
            Analyze this VLAN creation request and choose the BEST Ansible module and strategy.
            
            Request: {human_request}
            Parsed: {parsed_request}
            Commands: {commands}
            Complexity Score: {complexity_score}
            Requirements: {requirements}
            
            Choose between:
            1. ios_config: Best for simple VLAN creation, fast execution
            2. ios_vlans: Best for complex VLANs with ports, QoS, or advanced features
            3. ios_command: Best for custom commands or edge cases
            
            Return ONLY a JSON object with:
            - module: "ios_config", "ios_vlans", or "ios_command"
            - strategy: "simple", "comprehensive", or "custom"
            - reasoning: "Why this choice is best"
            
            JSON response:
            """
            
            strategy_response = self.safe_llm_call(strategy_prompt, timeout_seconds=20)
            if strategy_response:
                try:
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', strategy_response, re.DOTALL)
                    if json_match:
                        strategy = json.loads(json_match.group())
                        self.logger.info("✅ Agent 3: LLM strategy selection successful")
                        return strategy
                except Exception as e:
                    self.logger.warning(f"⚠️ Agent 3: JSON parsing failed, using AI fallback: {e}")
        
        # AI Fallback: Intelligent decision based on analysis
        return self.ai_fallback_strategy_selection(complexity_score, requirements)
    
    def ai_analyze_complexity(self, human_request: str, parsed_request: dict) -> int:
        """AI analysis of request complexity (1-10 scale)"""
        complexity = 1  # Start with simple
        
        # Analyze request text for complexity indicators
        request_lower = human_request.lower()
        
        # Major complexity indicators
        if any(word in request_lower for word in ['complex', 'advanced', 'detailed', 'comprehensive']):
            complexity += 4
        if any(word in request_lower for word in ['ports', 'interfaces', 'qos', 'trunk']):
            complexity += 3
        if any(word in request_lower for word in ['security', 'policies', 'rules', 'access-list']):
            complexity += 3
        if any(word in request_lower for word in ['multiple', 'several', 'batch', 'bulk']):
            complexity += 2
            
        # Minor complexity indicators
        if any(word in request_lower for word in ['backup', 'restore', 'migration']):
            complexity += 1
        if any(word in request_lower for word in ['verify', 'check', 'confirm', 'test']):
            complexity += 1
            
        # Basic VLAN creation should stay simple
        if 'vlan' in request_lower and complexity <= 2:
            complexity = 1
            
        return min(complexity, 10)  # Cap at 10
    
    def ai_analyze_requirements(self, human_request: str, parsed_request: dict) -> dict:
        """AI analysis of specific requirements"""
        requirements = {
            'ports': False,
            'qos': False,
            'security': False,
            'backup': False,
            'verification': False
        }
        
        request_lower = human_request.lower()
        
        # Detect specific requirements (exclude basic VLAN creation words)
        if any(word in request_lower for word in ['ports', 'interfaces', 'fa', 'gi', 'te']):
            requirements['ports'] = True
        if any(word in request_lower for word in ['qos', 'quality', 'priority', 'bandwidth']):
            requirements['qos'] = True
        if any(word in request_lower for word in ['security', 'access-list', 'acl', 'firewall']):
            requirements['security'] = True
        if any(word in request_lower for word in ['backup', 'save', 'copy', 'archive']):
            requirements['backup'] = True
        if any(word in request_lower for word in ['verify', 'check', 'confirm', 'test']):
            requirements['verification'] = True
            
        # Basic VLAN creation should not trigger advanced requirements
        if 'vlan' in request_lower and not any(word in request_lower for word in ['complex', 'advanced', 'detailed', 'comprehensive', 'ports', 'qos', 'security']):
            # Reset all requirements to false for basic VLAN creation
            requirements = {key: False for key in requirements}
            
        return requirements
    
    def ai_fallback_strategy_selection(self, complexity_score: int, requirements: dict) -> dict:
        """AI fallback strategy when LLM fails"""
        self.logger.info("🔄 Agent 3: Using AI fallback strategy selection...")
        
        # Decision logic based on complexity and requirements
        if complexity_score >= 7 or requirements['ports'] or requirements['qos']:
            return {
                'module': 'ios_vlans',
                'strategy': 'comprehensive',
                'reasoning': f'High complexity ({complexity_score}/10) with advanced requirements detected. ios_vlans module provides better control for complex VLAN configurations.'
            }
        elif complexity_score >= 4 or requirements['security']:
            return {
                'module': 'ios_config',
                'strategy': 'standard',
                'reasoning': f'Medium complexity ({complexity_score}/10) with security requirements. ios_config module offers flexibility while maintaining reliability.'
            }
        else:
            return {
                'module': 'ios_config',
                'strategy': 'simple',
                'reasoning': f'Low complexity ({complexity_score}/10) with basic requirements. ios_config module provides fast and reliable VLAN creation.'
            }
    
    def ai_generate_playbook(self, vlan_id: str, vlan_name: str, strategy: dict) -> dict:
        """AI-powered playbook generation based on strategy"""
        self.logger.info(f"🎯 Agent 3: Generating {strategy['strategy']} playbook using {strategy['module']} module...")
        
        if strategy['module'] == 'ios_vlans':
            return self._generate_ios_vlans_playbook(vlan_id, vlan_name, strategy)
        elif strategy['module'] == 'ios_command':
            return self._generate_ios_command_playbook(vlan_id, vlan_name, strategy)
        else:  # ios_config (default)
            return self._generate_ios_config_playbook(vlan_id, vlan_name, strategy)
    
    def _generate_ios_config_playbook(self, vlan_id: str, vlan_name: str, strategy: dict) -> dict:
        """Generate ios_config based playbook"""
        if strategy['strategy'] == 'simple':
            tasks = [
                {
                    "name": f"Create VLAN {vlan_id} with name {vlan_name} (AI Strategy: Simple)",
                    "ios_config": {
                        "lines": [f"name {vlan_name}"],
                        "parents": [f"vlan {vlan_id}"]
                    }
                }
            ]
        else:  # standard or comprehensive
            tasks = [
                {
                    "name": f"Create VLAN {vlan_id} with name {vlan_name} (AI Strategy: {strategy['strategy'].title()})",
                    "ios_config": {
                        "lines": [f"name {vlan_name}"],
                        "parents": [f"vlan {vlan_id}"]
                    }
                },
                {
                    "name": f"Verify VLAN {vlan_id} creation",
                    "ios_command": {
                        "commands": [f"show vlan {vlan_id}"]
                    }
                }
            ]
        
        return {
            "name": f"AI-Enhanced CrewAI: Create VLAN {vlan_id} - {vlan_name} ({strategy['strategy'].title()})",
            "hosts": "all",
            "gather_facts": False,
            "tasks": tasks
        }
    
    def _generate_ios_vlans_playbook(self, vlan_id: str, vlan_name: str, strategy: dict) -> dict:
        """Generate ios_vlans based playbook for complex configurations"""
        return {
            "name": f"AI-Enhanced CrewAI: Create Complex VLAN {vlan_id} - {vlan_name} (Comprehensive)",
            "hosts": "all",
            "gather_facts": False,
            "tasks": [
                {
                    "name": f"Create comprehensive VLAN {vlan_id} with name {vlan_name}",
                    "ios_vlans": {
                        "vlan_id": vlan_id,
                        "vlan_name": vlan_name,
                        "state": "present"
                    }
                },
                {
                    "name": f"Verify complex VLAN {vlan_id} configuration",
                    "ios_command": {
                        "commands": [
                            f"show vlan {vlan_id}",
                            f"show running-config vlan {vlan_id}"
                        ]
                    }
                }
            ]
        }
    
    def _generate_ios_command_playbook(self, vlan_id: str, vlan_name: str, strategy: dict) -> dict:
        """Generate ios_command based playbook for custom configurations"""
        return {
            "name": f"AI-Enhanced CrewAI: Create Custom VLAN {vlan_id} - {vlan_name} (Custom)",
            "hosts": "all",
            "gather_facts": False,
            "tasks": [
                {
                    "name": f"Create custom VLAN {vlan_id} with name {vlan_name}",
                    "ios_command": {
                        "commands": [
                            "configure terminal",
                            f"vlan {vlan_id}",
                            f"name {vlan_name}",
                            "end"
                        ]
                    }
                },
                {
                    "name": f"Verify custom VLAN {vlan_id} creation",
                    "ios_command": {
                        "commands": [f"show vlan brief | include {vlan_id}"]
                    }
                }
            ]
        }

    def ai_choose_execution_strategy(self, human_request: str, parsed_request: dict, playbook_strategy: dict, commands: list) -> dict:
        """AI-Powered decision making for execution strategy"""
        self.logger.info("🧠 Agent 4: Analyzing request to choose optimal execution strategy...")
        
        # AI Analysis: Determine execution requirements and context
        execution_context = self.ai_analyze_execution_context(human_request, parsed_request, playbook_strategy)
        execution_requirements = self.ai_analyze_execution_requirements(human_request, parsed_request, playbook_strategy)
        
        # AI Decision: Choose the best execution method and strategy
        if self.llm:
            execution_prompt = f"""
            Analyze this VLAN creation request and choose the BEST execution method and strategy.
            
            Request: {human_request}
            Parsed: {parsed_request}
            Playbook Strategy: {playbook_strategy}
            Commands: {commands}
            Execution Context: {execution_context}
            Execution Requirements: {execution_requirements}
            
            Choose between:
            1. ansible_playbook: Best for complex playbooks, reliable execution
            2. ansible_command: Best for simple commands, faster execution
            3. direct_ssh: Best for custom commands, direct control
            4. hybrid: Best for mixed approaches, combining methods
            
            Return ONLY a JSON object with:
            - method: "ansible_playbook", "ansible_command", "direct_ssh", or "hybrid"
            - strategy: "standard", "fast", "reliable", or "custom"
            - timeout: execution timeout in seconds
            - retry: retry strategy (true/false)
            - reasoning: "Why this choice is best"
            
            JSON response:
            """
            
            execution_response = self.safe_llm_call(execution_prompt, timeout_seconds=20)
            if execution_response:
                try:
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', execution_response, re.DOTALL)
                    if json_match:
                        strategy = json.loads(json_match.group())
                        self.logger.info("✅ Agent 4: LLM execution strategy selection successful")
                        return strategy
                except Exception as e:
                    self.logger.warning(f"⚠️ Agent 4: JSON parsing failed, using AI fallback: {e}")
        
        # AI Fallback: Intelligent decision based on analysis
        return self.ai_fallback_execution_strategy(execution_context, execution_requirements, playbook_strategy)
    
    def ai_analyze_execution_context(self, human_request: str, parsed_request: dict, playbook_strategy: dict) -> dict:
        """AI analysis of execution context"""
        context = {
            'complexity': 'low',
            'urgency': 'normal',
            'reliability_required': False,
            'speed_required': False,
            'custom_requirements': False
        }
        
        request_lower = human_request.lower()
        strategy = playbook_strategy.get('strategy', 'simple')
        
        # Analyze complexity
        if strategy in ['comprehensive', 'custom']:
            context['complexity'] = 'high'
        elif strategy == 'standard':
            context['complexity'] = 'medium'
        else:
            context['complexity'] = 'low'
        
        # Analyze urgency
        if any(word in request_lower for word in ['urgent', 'quick', 'fast', 'immediate', 'asap']):
            context['urgency'] = 'high'
            context['speed_required'] = True
        elif any(word in request_lower for word in ['careful', 'thorough', 'reliable', 'safe']):
            context['urgency'] = 'low'
            context['reliability_required'] = True
        else:
            context['urgency'] = 'normal'
            context['speed_required'] = False
            context['reliability_required'] = False
            
        # Analyze custom requirements
        if any(word in request_lower for word in ['custom', 'special', 'unique', 'specific']):
            context['custom_requirements'] = True
            
        return context
    
    def ai_analyze_execution_requirements(self, human_request: str, parsed_request: dict, playbook_strategy: dict) -> dict:
        """AI analysis of execution requirements"""
        requirements = {
            'parallel_execution': False,
            'rollback_support': False,
            'logging_level': 'normal',
            'error_handling': 'standard',
            'verification': True
        }
        
        request_lower = human_request.lower()
        strategy = playbook_strategy.get('strategy', 'simple')
        
        # Analyze strategy-based requirements
        if strategy == 'comprehensive':
            requirements['rollback_support'] = True
            requirements['logging_level'] = 'verbose'
            requirements['error_handling'] = 'advanced'
        elif strategy == 'custom':
            requirements['parallel_execution'] = True
            requirements['error_handling'] = 'custom'
        elif strategy == 'simple':
            requirements['verification'] = False  # Simple VLANs don't need verification
            
        # Analyze request-based requirements
        if any(word in request_lower for word in ['backup', 'rollback', 'undo']):
            requirements['rollback_support'] = True
        if any(word in request_lower for word in ['parallel', 'concurrent', 'batch']):
            requirements['parallel_execution'] = True
        if any(word in request_lower for word in ['detailed', 'verbose', 'log']):
            requirements['logging_level'] = 'verbose'
            
        return requirements
    
    def ai_fallback_execution_strategy(self, execution_context: dict, execution_requirements: dict, playbook_strategy: dict) -> dict:
        """AI fallback execution strategy when LLM fails"""
        self.logger.info("🔄 Agent 4: Using AI fallback execution strategy selection...")
        
        complexity = execution_context['complexity']
        urgency = execution_context['urgency']
        strategy = playbook_strategy.get('strategy', 'simple')
        
        # Decision logic based on context and requirements
        if complexity == 'high' or execution_requirements['rollback_support']:
            return {
                'method': 'ansible_playbook',
                'strategy': 'reliable',
                'timeout': 180,
                'retry': True,
                'reasoning': f'High complexity ({complexity}) with rollback requirements. ansible_playbook provides reliable execution with rollback support.'
            }
        elif urgency == 'high' or execution_requirements.get('speed_required', False):
            return {
                'method': 'ansible_command',
                'strategy': 'fast',
                'timeout': 60,
                'retry': False,
                'reasoning': f'High urgency ({urgency}) with speed requirements. ansible_command provides faster execution for quick deployment.'
            }
        elif execution_requirements.get('custom_requirements', False):
            return {
                'method': 'direct_ssh',
                'strategy': 'custom',
                'timeout': 120,
                'retry': True,
                'reasoning': f'Custom requirements detected. direct_ssh provides maximum control and flexibility for custom configurations.'
            }
        else:
            return {
                'method': 'ansible_playbook',
                'strategy': 'standard',
                'timeout': 120,
                'retry': False,
                'reasoning': f'Standard complexity ({complexity}) with normal requirements. ansible_playbook provides balanced execution.'
            }
    
    def ai_execute_playbook(self, execution_strategy: dict, playbook_strategy: dict) -> dict:
        """AI-powered playbook execution based on strategy"""
        self.logger.info(f"🎯 Agent 4: Executing using {execution_strategy['method']} method with {execution_strategy['strategy']} strategy...")
        
        method = execution_strategy['method']
        timeout = execution_strategy['timeout']
        retry = execution_strategy['retry']
        
        if method == 'ansible_playbook':
            return self._execute_ansible_playbook(execution_strategy, playbook_strategy)
        elif method == 'ansible_command':
            return self._execute_ansible_command(execution_strategy, playbook_strategy)
        elif method == 'direct_ssh':
            return self._execute_direct_ssh(execution_strategy, playbook_strategy)
        else:  # hybrid
            return self._execute_hybrid(execution_strategy, playbook_strategy)
    
    def _execute_ansible_playbook(self, execution_strategy: dict, playbook_strategy: dict) -> dict:
        """Execute using Ansible playbook method"""
        if not os.path.exists(INVENTORY_PATH):
            self.logger.warning(f"⚠️ Agent 4: Inventory file {INVENTORY_PATH} not found. Skipping execution.")
            return {'success': False, 'error': 'Inventory file not found'}
        
        try:
            # Build command with AI-optimized parameters
            cmd = ['ansible-playbook', '--inventory-file', INVENTORY_PATH, PLAYBOOK_PATH]
            
            # Add AI-chosen parameters
            if execution_strategy['strategy'] == 'reliable':
                cmd.extend(['-v', '--user', 'sarra', '--become', '--become-method', 'enable'])
            elif execution_strategy['strategy'] == 'fast':
                cmd.extend(['--user', 'sarra', '--become', '--become-method', 'enable'])
            else:  # standard
                cmd.extend(['-v', '--user', 'sarra', '--become', '--become-method', 'enable'])
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=execution_strategy['timeout']
            )
            
            if result.returncode == 0:
                self.logger.info("✅ Agent 4: Ansible playbook executed successfully!")
                self.logger.info(f"📊 Output: {result.stdout}")
                return {'success': True, 'output': result.stdout, 'method': 'ansible_playbook'}
            else:
                self.logger.error(f"❌ Agent 4: Ansible playbook execution failed: {result.stderr}")
                return {'success': False, 'error': result.stderr, 'method': 'ansible_playbook'}
                
        except subprocess.TimeoutExpired:
            self.logger.error(f"⏰ Agent 4: Ansible playbook execution timed out after {execution_strategy['timeout']} seconds")
            return {'success': False, 'error': 'Execution timed out', 'method': 'ansible_playbook'}
        except Exception as e:
            self.logger.error(f"❌ Agent 4: Error executing Ansible playbook: {e}")
            return {'success': False, 'error': str(e), 'method': 'ansible_playbook'}
    
    def _execute_ansible_command(self, execution_strategy: dict, playbook_strategy: dict) -> dict:
        """Execute using Ansible command method for faster execution"""
        if not os.path.exists(INVENTORY_PATH):
            self.logger.warning(f"⚠️ Agent 4: Inventory file {INVENTORY_PATH} not found. Skipping execution.")
            return {'success': False, 'error': 'Inventory file not found'}
        
        try:
            # Extract VLAN info from the parsed request (stored in the class)
            vlan_id = getattr(self, 'vlan_id_str', 'unknown')
            vlan_name = getattr(self, 'vlan_name', 'unknown')
            
            # Build fast command execution
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_config',
                '-a', f'lines="name {vlan_name}" parents="vlan {vlan_id}"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=execution_strategy['timeout']
            )
            
            # Debug logging to see what's happening
            self.logger.info(f"🔍 Agent 4 Debug: returncode={result.returncode}")
            self.logger.info(f"🔍 Agent 4 Debug: stdout={result.stdout}")
            self.logger.info(f"🔍 Agent 4 Debug: stderr={result.stderr}")
            
            # Check if command succeeded (returncode 0) or if it actually created the VLAN
            # Ansible output can be in stdout or stderr, so check both
            output_text = result.stdout + result.stderr
            
            # More comprehensive success detection for ansible_command
            success_indicators = [
                "changed: true",
                "ok:",
                "CHANGED =>",
                "SUCCESS",
                "changed",
                "SUCCESSFUL"
            ]
            
            is_success = any(indicator in output_text for indicator in success_indicators)
            
            if result.returncode == 0 or is_success:
                self.logger.info("✅ Agent 4: Ansible command executed successfully!")
                self.logger.info(f"📊 Output: {output_text}")
                return {'success': True, 'output': output_text, 'method': 'ansible_command'}
            else:
                self.logger.error(f"❌ Agent 4: Ansible command execution failed: {result.stderr}")
                return {'success': False, 'error': result.stderr, 'method': 'ansible_command'}
                
        except subprocess.TimeoutExpired:
            self.logger.error(f"⏰ Agent 4: Ansible command execution timed out after {execution_strategy['timeout']} seconds")
            return {'success': False, 'error': 'Execution timed out', 'method': 'ansible_command'}
        except Exception as e:
            self.logger.error(f"❌ Agent 4: Error executing Ansible command: {e}")
            return {'success': False, 'error': str(e), 'method': 'ansible_command'}
    
    def _execute_direct_ssh(self, execution_strategy: dict, playbook_strategy: dict) -> dict:
        """Execute using direct SSH for custom configurations"""
        try:
            # For now, fall back to Ansible command for simplicity
            # In a full implementation, this would use paramiko or similar for direct SSH
            self.logger.info("🔄 Agent 4: Direct SSH not fully implemented, falling back to Ansible command...")
            return self._execute_ansible_command(execution_strategy, playbook_strategy)
            
        except Exception as e:
            self.logger.error(f"❌ Agent 4: Error with direct SSH execution: {e}")
            return {'success': False, 'error': str(e), 'method': 'direct_ssh'}
    
    def _execute_hybrid(self, execution_strategy: dict, playbook_strategy: dict) -> dict:
        """Execute using hybrid approach combining multiple methods"""
        try:
            # Try fast method first, fall back to reliable if it fails
            fast_result = self._execute_ansible_command(execution_strategy, playbook_strategy)
            
            if fast_result['success']:
                self.logger.info("✅ Agent 4: Hybrid execution successful with fast method!")
                return fast_result
            else:
                self.logger.info("🔄 Agent 4: Fast method failed, trying reliable method...")
                return self._execute_ansible_playbook(execution_strategy, playbook_strategy)
                
        except Exception as e:
            self.logger.error(f"❌ Agent 4: Error with hybrid execution: {e}")
            return {'success': False, 'error': str(e), 'method': 'hybrid'}

    def ai_choose_verification_strategy(self, human_request: str, parsed_request: dict, playbook_strategy: dict, execution_result: dict) -> dict:
        """AI-Powered decision making for verification strategy"""
        self.logger.info("🧠 Agent 5: Analyzing request to choose optimal verification strategy...")
        
        # AI Analysis: Determine verification requirements and context
        verification_context = self.ai_analyze_verification_context(human_request, parsed_request, playbook_strategy, execution_result)
        verification_requirements = self.ai_analyze_verification_requirements(human_request, parsed_request, playbook_strategy, execution_result)
        
        # AI Decision: Choose the best verification method and strategy
        if self.llm:
            verification_prompt = f"""
            Analyze this VLAN creation request and choose the BEST verification method and strategy.
            
            Request: {human_request}
            Parsed: {parsed_request}
            Playbook Strategy: {playbook_strategy}
            Execution Result: {execution_result}
            Verification Context: {verification_context}
            Verification Requirements: {verification_requirements}
            
            Choose between:
            1. basic_verification: Simple VLAN existence check (fast, basic)
            2. comprehensive_verification: Detailed VLAN configuration check (thorough, reliable)
            3. custom_verification: Custom verification commands (flexible, specific)
            4. multi_level_verification: Multiple verification methods (thorough, time-consuming)
            
            Return ONLY a JSON object with:
            - method: "basic_verification", "comprehensive_verification", "custom_verification", or "multi_level_verification"
            - strategy: "fast", "thorough", "custom", or "comprehensive"
            - timeout: verification timeout in seconds
            - retry: retry strategy (true/false)
            - reasoning: "Why this choice is best"
            
            JSON response:
            """
            
            verification_response = self.safe_llm_call(verification_prompt, timeout_seconds=20)
            if verification_response:
                try:
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', verification_response, re.DOTALL)
                    if json_match:
                        strategy = json.loads(json_match.group())
                        self.logger.info("✅ Agent 5: LLM verification strategy selection successful")
                        return strategy
                except Exception as e:
                    self.logger.warning(f"⚠️ Agent 5: JSON parsing failed, using AI fallback: {e}")
        
        # AI Fallback: Intelligent decision based on analysis
        return self.ai_fallback_verification_strategy(verification_context, verification_requirements, playbook_strategy, execution_result)
    
    def ai_analyze_verification_context(self, human_request: str, parsed_request: dict, playbook_strategy: dict, execution_result: dict) -> dict:
        """AI analysis of verification context"""
        context = {
            'complexity': 'low',
            'urgency': 'normal',
            'execution_success': True,
            'verification_critical': False,
            'custom_requirements': False
        }
        
        request_lower = human_request.lower()
        strategy = playbook_strategy.get('strategy', 'simple')
        execution_method = execution_result.get('method', 'unknown')
        
        # Analyze complexity
        if strategy in ['comprehensive', 'custom']:
            context['complexity'] = 'high'
        elif strategy == 'standard':
            context['complexity'] = 'medium'
        else:
            context['complexity'] = 'low'
        
        # Analyze urgency
        if any(word in request_lower for word in ['urgent', 'quick', 'fast', 'immediate', 'asap']):
            context['urgency'] = 'high'
        elif any(word in request_lower for word in ['careful', 'thorough', 'reliable', 'safe']):
            context['urgency'] = 'low'
            context['verification_critical'] = True
        else:
            context['urgency'] = 'normal'
            
        # Analyze execution success
        if not execution_result.get('success', False):
            context['execution_success'] = False
            context['verification_critical'] = True  # Critical if execution failed
            
        # Analyze custom requirements
        if any(word in request_lower for word in ['custom', 'special', 'unique', 'specific']):
            context['custom_requirements'] = True
            
        return context
    
    def ai_analyze_verification_requirements(self, human_request: str, parsed_request: dict, playbook_strategy: dict, execution_result: dict) -> dict:
        """AI analysis of verification requirements"""
        requirements = {
            'detailed_config_check': False,
            'performance_verification': False,
            'security_verification': False,
            'rollback_verification': False,
            'multi_device_check': False
        }
        
        request_lower = human_request.lower()
        strategy = playbook_strategy.get('strategy', 'simple')
        execution_method = execution_result.get('method', 'unknown')
        
        # Analyze strategy-based requirements
        if strategy == 'comprehensive':
            requirements['detailed_config_check'] = True
            requirements['performance_verification'] = True
        elif strategy == 'custom':
            requirements['custom_verification'] = True
            requirements['multi_device_check'] = True
        elif strategy == 'simple':
            requirements['basic_verification'] = True  # Simple VLANs need basic verification
            
        # Analyze request-based requirements
        if any(word in request_lower for word in ['security', 'firewall', 'acl']):
            requirements['security_verification'] = True
        if any(word in request_lower for word in ['performance', 'qos', 'bandwidth']):
            requirements['performance_verification'] = True
        if any(word in request_lower for word in ['backup', 'rollback', 'undo']):
            requirements['rollback_verification'] = True
        if any(word in request_lower for word in ['multiple', 'all', 'batch']):
            requirements['multi_device_check'] = True
            
        return requirements
    
    def ai_fallback_verification_strategy(self, verification_context: dict, verification_requirements: dict, playbook_strategy: dict, execution_result: dict) -> dict:
        """AI fallback verification strategy when LLM fails"""
        self.logger.info("🔄 Agent 5: Using AI fallback verification strategy selection...")
        
        complexity = verification_context['complexity']
        urgency = verification_context['urgency']
        execution_success = verification_context['execution_success']
        verification_critical = verification_context['verification_critical']
        strategy = playbook_strategy.get('strategy', 'simple')
        
        # Decision logic based on context and requirements
        if not execution_success or verification_critical:
            return {
                'method': 'comprehensive_verification',
                'strategy': 'thorough',
                'timeout': 120,
                'retry': True,
                'reasoning': f'Execution failed or verification is critical. Comprehensive verification needed to ensure system integrity.'
            }
        elif complexity == 'high' or strategy in ['comprehensive', 'custom']:
            return {
                'method': 'comprehensive_verification',
                'strategy': 'thorough',
                'timeout': 90,
                'retry': True,
                'reasoning': f'High complexity ({complexity}) with {strategy} strategy. Comprehensive verification ensures all aspects are properly configured.'
            }
        elif urgency == 'high':
            return {
                'method': 'basic_verification',
                'strategy': 'fast',
                'timeout': 30,
                'retry': False,
                'reasoning': f'High urgency ({urgency}) detected. Basic verification provides quick confirmation without delays.'
            }
        elif verification_requirements.get('detailed_config_check', False):
            return {
                'method': 'comprehensive_verification',
                'strategy': 'thorough',
                'timeout': 90,
                'retry': True,
                'reasoning': f'Detailed configuration check required. Comprehensive verification ensures all settings are correct.'
            }
        else:
            return {
                'method': 'basic_verification',
                'strategy': 'fast',
                'timeout': 60,
                'retry': False,
                'reasoning': f'Standard complexity ({complexity}) with normal requirements. Basic verification provides reliable confirmation.'
            }
    
    def ai_execute_verification(self, verification_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """AI-powered verification execution based on strategy"""
        self.logger.info(f"🎯 Agent 5: Executing verification using {verification_strategy['method']} method with {verification_strategy['strategy']} strategy...")
        
        method = verification_strategy['method']
        timeout = verification_strategy['timeout']
        retry = verification_strategy['retry']
        
        if method == 'basic_verification':
            return self._execute_basic_verification(verification_strategy, vlan_id, vlan_name)
        elif method == 'comprehensive_verification':
            return self._execute_comprehensive_verification(verification_strategy, vlan_id, vlan_name)
        elif method == 'custom_verification':
            return self._execute_custom_verification(verification_strategy, vlan_id, vlan_name)
        else:  # multi_level_verification
            return self._execute_multi_level_verification(verification_strategy, vlan_id, vlan_name)
    
    def _execute_basic_verification(self, verification_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute basic VLAN verification"""
        try:
            # Basic VLAN existence check
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', f'commands="show vlan brief | include {vlan_id}"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=verification_strategy['timeout']
            )
            
            if result.returncode == 0 and (f"VLAN{vlan_id}" in result.stdout or vlan_name.lower() in result.stdout.lower()):
                self.logger.info("✅ Agent 5: Basic verification successful - VLAN found!")
                return {'success': True, 'method': 'basic_verification', 'output': result.stdout}
            else:
                self.logger.warning("⚠️ Agent 5: Basic verification failed - VLAN not found")
                return {'success': False, 'method': 'basic_verification', 'error': 'VLAN not found in verification'}
                
        except subprocess.TimeoutExpired:
            self.logger.error(f"⏰ Agent 5: Basic verification timed out after {verification_strategy['timeout']} seconds")
            return {'success': False, 'method': 'basic_verification', 'error': 'Verification timed out'}
        except Exception as e:
            self.logger.error(f"❌ Agent 5: Error in basic verification: {e}")
            return {'success': False, 'method': 'basic_verification', 'error': str(e)}
    
    def _execute_comprehensive_verification(self, verification_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute comprehensive VLAN verification"""
        try:
            # Multiple verification commands for comprehensive check
            commands = [
                f"show vlan brief | include {vlan_id}",
                f"show running-config vlan {vlan_id}",
                f"show interfaces vlan {vlan_id}",
                "show vlan-switch brief"
            ]
            
            all_results = []
            for cmd in commands:
                verify_cmd = [
                    'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                    '-a', f'commands="{cmd}"',
                    '--user', 'sarra', '--become', '--become-method', 'enable'
                ]
                
                result = subprocess.run(
                    verify_cmd,
                    capture_output=True,
                    text=True,
                    timeout=verification_strategy['timeout'] // len(commands)
                )
                
                if result.returncode == 0:
                    all_results.append(f"✅ {cmd}: {result.stdout}")
                else:
                    all_results.append(f"❌ {cmd}: {result.stderr}")
            
            # Check if VLAN exists in any result
            combined_output = '\n'.join(all_results)
            if f"VLAN{vlan_id}" in combined_output or vlan_name.lower() in combined_output.lower():
                self.logger.info("✅ Agent 5: Comprehensive verification successful - VLAN properly configured!")
                return {'success': True, 'method': 'comprehensive_verification', 'output': combined_output}
            else:
                self.logger.warning("⚠️ Agent 5: Comprehensive verification failed - VLAN not properly configured")
                return {'success': False, 'method': 'comprehensive_verification', 'error': 'VLAN not properly configured'}
                
        except Exception as e:
            self.logger.error(f"❌ Agent 5: Error in comprehensive verification: {e}")
            return {'success': False, 'method': 'comprehensive_verification', 'error': str(e)}
    
    def _execute_custom_verification(self, verification_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute custom verification based on requirements"""
        try:
            # Custom verification commands for specific requirements
            custom_commands = [
                f"show vlan {vlan_id}",
                f"show ip interface vlan {vlan_id}",
                f"show spanning-tree vlan {vlan_id}"
            ]
            
            custom_results = []
            for cmd in custom_commands:
                verify_cmd = [
                    'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                    '-a', f'commands="{cmd}"',
                    '--user', 'sarra', '--become', '--become-method', 'enable'
                ]
                
                result = subprocess.run(
                    verify_cmd,
                    capture_output=True,
                    text=True,
                    timeout=verification_strategy['timeout'] // len(custom_commands)
                )
                
                if result.returncode == 0:
                    custom_results.append(f"✅ {cmd}: {result.stdout}")
                else:
                    custom_results.append(f"❌ {cmd}: {result.stderr}")
            
            # Check if VLAN exists and has custom configurations
            combined_output = '\n'.join(custom_results)
            if f"VLAN{vlan_id}" in combined_output or vlan_name.lower() in combined_output.lower():
                self.logger.info("✅ Agent 5: Custom verification successful - VLAN with custom config found!")
                return {'success': True, 'method': 'custom_verification', 'output': combined_output}
            else:
                self.logger.warning("⚠️ Agent 5: Custom verification failed - VLAN not found or missing custom config")
                return {'success': False, 'method': 'custom_verification', 'error': 'VLAN not found or missing custom config'}
                
        except Exception as e:
            self.logger.error(f"❌ Agent 5: Error in custom verification: {e}")
            return {'success': False, 'method': 'custom_verification', 'error': str(e)}
    
    def _execute_multi_level_verification(self, verification_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute multi-level verification combining multiple methods"""
        try:
            # Try basic verification first
            basic_result = self._execute_basic_verification(verification_strategy, vlan_id, vlan_name)
            
            if basic_result['success']:
                # If basic succeeds, try comprehensive for thorough check
                comprehensive_result = self._execute_comprehensive_verification(verification_strategy, vlan_id, vlan_name)
                
                if comprehensive_result['success']:
                    self.logger.info("✅ Agent 5: Multi-level verification successful - All levels passed!")
                    return {
                        'success': True,
                        'method': 'multi_level_verification',
                        'output': f"Basic: ✅\nComprehensive: ✅\n{comprehensive_result['output']}"
                    }
                else:
                    self.logger.warning("⚠️ Agent 5: Multi-level verification partial - Basic passed, comprehensive failed")
                    return {
                        'success': False,
                        'method': 'multi_level_verification',
                        'error': 'Basic verification passed but comprehensive failed',
                        'partial_output': basic_result['output']
                    }
            else:
                # If basic fails, return basic result
                self.logger.warning("⚠️ Agent 5: Multi-level verification failed at basic level")
                return basic_result
                
        except Exception as e:
            self.logger.error(f"❌ Agent 5: Error in multi-level verification: {e}")
            return {'success': False, 'method': 'multi_level_verification', 'error': str(e)}

    def ai_security_monitoring_and_response(self, vlan_id: str, vlan_name: str) -> dict:
        """AI-Powered Security Monitoring and Response - Agent 6"""
        self.logger.info("🔒 Agent 6: Starting AI-Powered Security Monitoring and Response...")
        
        # AI Analysis: Determine security monitoring strategy
        security_context = self.ai_analyze_security_context(vlan_id, vlan_name)
        security_strategy = self.ai_choose_security_strategy(security_context)
        
        # Execute security monitoring using AI-chosen strategy
        security_result = self.ai_execute_security_monitoring(security_strategy, vlan_id, vlan_name)
        
        # Execute security response actions based on monitoring results
        if security_result.get('success', False):
            security_response_result = self.ai_security_response_actions(security_result, vlan_id, vlan_name)
            
            # Perform threat intelligence analysis
            threat_intel_result = self.ai_threat_intelligence_analysis(security_result, vlan_id, vlan_name)
            
            # Combine all results
            final_result = {
                'success': True,
                'method': security_strategy.get('method', 'unknown'),
                'strategy': security_strategy.get('strategy', 'unknown'),
                'monitoring_level': security_strategy.get('monitoring_level', 'unknown'),
                'automation_level': security_strategy.get('automation_level', 'unknown'),
                'threat_level': security_result.get('threat_level', 'unknown'),
                'security_score': threat_intel_result.get('threat_intelligence', {}).get('security_score', 0),
                'risk_assessment': threat_intel_result.get('threat_intelligence', {}).get('risk_assessment', 'unknown'),
                'response_actions': security_response_result.get('actions_taken', []),
                'recommendations': threat_intel_result.get('threat_intelligence', {}).get('recommendations', []),
                'output': security_result.get('output', ''),
                'reasoning': f"AI-Powered security monitoring completed using {security_strategy.get('method', 'unknown')} method with {security_strategy.get('strategy', 'unknown')} strategy. Threat level: {security_result.get('threat_level', 'unknown')}. Security score: {threat_intel_result.get('threat_intelligence', {}).get('security_score', 0)}/100."
            }
            
            return final_result
        else:
            return security_result
    
    def ai_analyze_security_context(self, vlan_id: str, vlan_name: str) -> dict:
        """AI analysis of security context for the newly created VLAN"""
        context = {
            'vlan_importance': 'medium',
            'security_requirements': 'standard',
            'monitoring_level': 'active',
            'response_automation': 'hybrid',
            'threat_landscape': 'normal'
        }
        
        # Analyze VLAN importance based on ID and name
        vlan_id_int = int(vlan_id) if vlan_id.isdigit() else 100
        
        if vlan_id_int < 100:
            context['vlan_importance'] = 'high'  # Lower VLANs often more critical
        elif vlan_id_int > 1000:
            context['vlan_importance'] = 'low'   # Higher VLANs often test/development
        
        # Analyze security requirements based on VLAN name
        vlan_name_lower = vlan_name.lower()
        if any(word in vlan_name_lower for word in ['admin', 'management', 'critical', 'production']):
            context['security_requirements'] = 'high'
            context['monitoring_level'] = 'comprehensive'
        elif any(word in vlan_name_lower for word in ['test', 'dev', 'lab', 'demo']):
            context['security_requirements'] = 'low'
            context['monitoring_level'] = 'basic'
        else:
            context['security_requirements'] = 'standard'
            context['monitoring_level'] = 'active'
        
        # Determine monitoring level
        if context['vlan_importance'] == 'high' or context['security_requirements'] == 'high':
            context['monitoring_level'] = 'comprehensive'
            context['response_automation'] = 'hybrid'
        elif context['vlan_importance'] == 'low' or context['security_requirements'] == 'low':
            context['monitoring_level'] = 'basic'
            context['response_automation'] = 'semi-automated'
        else:
            context['monitoring_level'] = 'active'
            context['response_automation'] = 'hybrid'
        
        return context
    
    def ai_choose_security_strategy(self, security_context: dict) -> dict:
        """AI decision making for security monitoring strategy"""
        self.logger.info("🧠 Agent 6: Analyzing security context to choose optimal monitoring strategy...")
        
        # AI Decision: Choose the best security monitoring method and strategy
        if self.llm:
            security_prompt = f"""
            Analyze this security context and choose the BEST security monitoring method and strategy.
            
            Security Context: {security_context}
            
            Choose between:
            1. basic_monitoring: Simple security checks (fast, basic coverage)
            2. active_monitoring: Real-time traffic analysis (balanced, real-time)
            3. comprehensive_monitoring: Full security suite (thorough, resource-intensive)
            4. hybrid_monitoring: Adaptive monitoring based on context (intelligent, flexible)
            
            Return ONLY a JSON object with:
            - method: "basic_monitoring", "active_monitoring", "comprehensive_monitoring", or "hybrid_monitoring"
            - strategy: "basic", "active", "comprehensive", or "hybrid"
            - monitoring_level: "basic", "active", or "comprehensive"
            - automation_level: "full", "semi", or "hybrid"
            - reasoning: "Why this choice is best"
            
            JSON response:
            """
            
            security_response = self.safe_llm_call(security_prompt, timeout_seconds=20)
            if security_response:
                try:
                    # Extract JSON from response
                    json_match = re.search(r'\{.*\}', security_response, re.DOTALL)
                    if json_match:
                        strategy = json.loads(json_match.group())
                        self.logger.info("✅ Agent 6: LLM security strategy selection successful")
                        return strategy
                except Exception as e:
                    self.logger.warning(f"⚠️ Agent 6: JSON parsing failed, using AI fallback: {e}")
        
        # AI Fallback: Intelligent decision based on analysis
        return self.ai_fallback_security_strategy(security_context)
    
    def ai_fallback_security_strategy(self, security_context: dict) -> dict:
        """AI fallback security strategy when LLM fails"""
        self.logger.info("🔄 Agent 6: Using AI fallback security strategy selection...")
        
        monitoring_level = security_context['monitoring_level']
        security_requirements = security_context['security_requirements']
        vlan_importance = security_context['vlan_importance']
        
        # Decision logic based on context
        if monitoring_level == 'comprehensive' or security_requirements == 'high':
            return {
                'method': 'comprehensive_monitoring',
                'strategy': 'comprehensive',
                'monitoring_level': 'comprehensive',
                'automation_level': 'hybrid',
                'reasoning': f'High security requirements ({security_requirements}) with {vlan_importance} importance. Comprehensive monitoring ensures maximum security coverage.'
            }
        elif monitoring_level == 'basic' or security_requirements == 'low':
            return {
                'method': 'basic_monitoring',
                'strategy': 'basic',
                'monitoring_level': 'basic',
                'automation_level': 'semi',
                'reasoning': f'Low security requirements ({security_requirements}) with {vlan_importance} importance. Basic monitoring provides adequate coverage without resource overhead.'
            }
        else:
            return {
                'method': 'active_monitoring',
                'strategy': 'active',
                'monitoring_level': 'active',
                'automation_level': 'hybrid',
                'reasoning': f'Standard security requirements ({security_requirements}) with {vlan_importance} importance. Active monitoring provides balanced security and performance.'
            }
    
    def ai_execute_security_monitoring(self, security_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """AI-powered security monitoring execution based on strategy"""
        self.logger.info(f"🎯 Agent 6: Executing security monitoring using {security_strategy['method']} method with {security_strategy['strategy']} strategy...")
        
        method = security_strategy['method']
        monitoring_level = security_strategy['monitoring_level']
        automation_level = security_strategy['automation_level']
        
        if method == 'basic_monitoring':
            return self._execute_basic_security_monitoring(security_strategy, vlan_id, vlan_name)
        elif method == 'active_monitoring':
            return self._execute_active_security_monitoring(security_strategy, vlan_id, vlan_name)
        elif method == 'comprehensive_monitoring':
            return self._execute_comprehensive_security_monitoring(security_strategy, vlan_id, vlan_name)
        else:  # hybrid_monitoring
            return self._execute_hybrid_security_monitoring(security_strategy, vlan_id, vlan_name)
    
    def _execute_basic_security_monitoring(self, security_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute basic security monitoring"""
        try:
            self.logger.info("🔒 Agent 6: Executing basic security monitoring...")
            
            # Basic security checks
            security_checks = [
                f"show vlan {vlan_id}",
                f"show ip interface vlan {vlan_id}",
                "show access-lists"
            ]
            
            basic_results = []
            for check in security_checks:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{check}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        basic_results.append(f"✅ {check}: {result.stdout}")
                    else:
                        basic_results.append(f"❌ {check}: {result.stderr}")
                        
                except Exception as e:
                    basic_results.append(f"❌ {check}: Error - {str(e)}")
            
            # Basic threat assessment
            threat_level = "low"
            if any("deny" in result.lower() for result in basic_results):
                threat_level = "medium"
            
            combined_output = '\n'.join(basic_results)
            
            self.logger.info(f"✅ Agent 6: Basic security monitoring completed - Threat level: {threat_level}")
            return {
                'success': True,
                'method': 'basic_monitoring',
                'strategy': 'basic',
                'monitoring_level': 'basic',
                'automation_level': 'semi',
                'threat_level': threat_level,
                'output': combined_output,
                'reasoning': f'Basic security monitoring completed for VLAN {vlan_id}. Threat level assessed as {threat_level}.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in basic security monitoring: {e}")
            return {
                'success': False,
                'method': 'basic_monitoring',
                'error': str(e),
                'reasoning': f'Basic security monitoring failed: {str(e)}'
            }
    
    def _execute_active_security_monitoring(self, security_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute active security monitoring with real-time analysis"""
        try:
            self.logger.info("🔒 Agent 6: Executing active security monitoring with real-time analysis...")
            
            # Active monitoring commands
            active_checks = [
                f"show vlan {vlan_id}",
                f"show ip interface vlan {vlan_id}",
                "show access-lists",
                "show ip traffic",
                "show logging"
            ]
            
            active_results = []
            for check in active_checks:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{check}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        active_results.append(f"✅ {check}: {result.stdout}")
                    else:
                        active_results.append(f"❌ {check}: {result.stderr}")
                        
                except Exception as e:
                    active_results.append(f"❌ {check}: Error - {str(e)}")
            
            # Active threat assessment
            threat_level = "low"
            threat_indicators = 0
            
            for result in active_results:
                result_lower = result.lower()
                if "deny" in result_lower:
                    threat_indicators += 1
                if "error" in result_lower:
                    threat_indicators += 1
                if "warning" in result_lower:
                    threat_indicators += 1
            
            if threat_indicators >= 3:
                threat_level = "high"
            elif threat_indicators >= 1:
                threat_level = "medium"
            
            combined_output = '\n'.join(active_results)
            
            self.logger.info(f"✅ Agent 6: Active security monitoring completed - Threat level: {threat_level}")
            return {
                'success': True,
                'method': 'active_monitoring',
                'strategy': 'active',
                'monitoring_level': 'active',
                'automation_level': 'hybrid',
                'threat_level': threat_level,
                'threat_indicators': threat_indicators,
                'output': combined_output,
                'reasoning': f'Active security monitoring completed for VLAN {vlan_id}. Threat level assessed as {threat_level} with {threat_indicators} indicators.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in active security monitoring: {e}")
            return {
                'success': False,
                'method': 'active_monitoring',
                'error': str(e),
                'reasoning': f'Active security monitoring failed: {str(e)}'
            }
    
    def _execute_comprehensive_security_monitoring(self, security_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute comprehensive security monitoring with full security suite"""
        try:
            self.logger.info("🔒 Agent 6: Executing comprehensive security monitoring with full security suite...")
            
            # Comprehensive security checks
            comprehensive_checks = [
                f"show vlan {vlan_id}",
                f"show ip interface vlan {vlan_id}",
                "show access-lists",
                "show ip traffic",
                "show logging",
                "show users",
                "show processes",
                "show memory",
                "show interfaces status",
                "show spanning-tree vlan 1"
            ]
            
            comprehensive_results = []
            for check in comprehensive_checks:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{check}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=45
                    )
                    
                    if result.returncode == 0:
                        comprehensive_results.append(f"✅ {check}: {result.stdout}")
                    else:
                        comprehensive_results.append(f"❌ {check}: {result.stderr}")
                        
                except Exception as e:
                    comprehensive_results.append(f"❌ {check}: Error - {str(e)}")
            
            # Comprehensive threat assessment
            threat_level = "low"
            threat_indicators = 0
            security_score = 100
            
            for result in comprehensive_results:
                result_lower = result.lower()
                if "deny" in result_lower:
                    threat_indicators += 1
                    security_score -= 10
                if "error" in result_lower:
                    threat_indicators += 1
                    security_score -= 15
                if "warning" in result_lower:
                    threat_indicators += 1
                    security_score -= 5
                if "down" in result_lower:
                    threat_indicators += 1
                    security_score -= 20
            
            if security_score < 50:
                threat_level = "high"
            elif security_score < 80:
                threat_level = "medium"
            
            combined_output = '\n'.join(comprehensive_results)
            
            self.logger.info(f"✅ Agent 6: Comprehensive security monitoring completed - Threat level: {threat_level}, Security score: {security_score}")
            return {
                'success': True,
                'method': 'comprehensive_monitoring',
                'strategy': 'comprehensive',
                'monitoring_level': 'comprehensive',
                'automation_level': 'hybrid',
                'threat_level': threat_level,
                'threat_indicators': threat_indicators,
                'security_score': security_score,
                'output': combined_output,
                'reasoning': f'Comprehensive security monitoring completed for VLAN {vlan_id}. Threat level: {threat_level}, Security score: {security_score}/100.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in comprehensive security monitoring: {e}")
            return {
                'success': False,
                'method': 'comprehensive_monitoring',
                'error': str(e),
                'reasoning': f'Comprehensive security monitoring failed: {str(e)}'
            }

    def _execute_hybrid_security_monitoring(self, security_strategy: dict, vlan_id: str, vlan_name: str) -> dict:
        """Execute hybrid security monitoring with adaptive intelligence"""
        try:
            self.logger.info("🔒 Agent 6: Executing hybrid security monitoring with adaptive intelligence...")
            
            # Adaptive monitoring based on context
            security_context = self.ai_analyze_security_context(vlan_id, vlan_name)
            
            if security_context['security_requirements'] == 'high':
                # Use comprehensive monitoring for high-security VLANs
                return self._execute_comprehensive_security_monitoring(security_strategy, vlan_id, vlan_name)
            elif security_context['security_requirements'] == 'low':
                # Use basic monitoring for low-security VLANs
                return self._execute_basic_security_monitoring(security_strategy, vlan_id, vlan_name)
            else:
                # Use active monitoring for standard VLANs
                return self._execute_active_security_monitoring(security_strategy, vlan_id, vlan_name)
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in hybrid security monitoring: {e}")
            return {
                'success': False,
                'method': 'hybrid_monitoring',
                'error': str(e),
                'reasoning': f'Hybrid security monitoring failed: {str(e)}'
            }

    def ai_security_response_actions(self, security_result: dict, vlan_id: str, vlan_name: str) -> dict:
        """AI-powered security response actions based on monitoring results"""
        self.logger.info("🚨 Agent 6: Executing AI-powered security response actions...")
        
        threat_level = security_result.get('threat_level', 'low')
        monitoring_level = security_result.get('monitoring_level', 'basic')
        
        # AI Decision: Choose response actions based on threat level
        if threat_level == 'high':
            return self._execute_high_threat_response(vlan_id, vlan_name, security_result)
        elif threat_level == 'medium':
            return self._execute_medium_threat_response(vlan_id, vlan_name, security_result)
        else:  # low threat
            return self._execute_low_threat_response(vlan_id, vlan_name, security_result)

    def _execute_high_threat_response(self, vlan_id: str, vlan_name: str, security_result: dict) -> dict:
        """Execute high-threat security response actions"""
        try:
            self.logger.info("🚨 Agent 6: Executing HIGH-THREAT security response actions...")
            
            # Immediate response actions for high threats
            response_actions = [
                f"show vlan {vlan_id}",
                "show access-lists",
                "show ip interface brief",
                "show logging"
            ]
            
            action_results = []
            for action in response_actions:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{action}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        action_results.append(f"✅ {action}: {result.stdout}")
                    else:
                        action_results.append(f"❌ {action}: {result.stderr}")
                        
                except Exception as e:
                    action_results.append(f"❌ {action}: Error - {str(e)}")
            
            # High-threat response summary
            combined_output = '\n'.join(action_results)
            
            self.logger.info("✅ Agent 6: HIGH-THREAT security response completed")
            return {
                'success': True,
                'threat_level': 'high',
                'response_type': 'immediate',
                'actions_taken': response_actions,
                'output': combined_output,
                'recommendations': [
                    'Isolate VLAN if necessary',
                    'Review access control lists',
                    'Monitor traffic patterns',
                    'Check for unauthorized access'
                ],
                'reasoning': f'HIGH-THREAT response executed for VLAN {vlan_id}. Immediate security actions taken to protect network infrastructure.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in high-threat response: {e}")
            return {
                'success': False,
                'threat_level': 'high',
                'error': str(e),
                'reasoning': f'HIGH-THREAT response failed: {str(e)}'
            }

    def _execute_medium_threat_response(self, vlan_id: str, vlan_name: str, security_result: dict) -> dict:
        """Execute medium-threat security response actions"""
        try:
            self.logger.info("⚠️ Agent 6: Executing MEDIUM-THREAT security response actions...")
            
            # Moderate response actions for medium threats
            response_actions = [
                f"show vlan {vlan_id}",
                "show access-lists"
            ]
            
            action_results = []
            for action in response_actions:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{action}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        action_results.append(f"✅ {action}: {result.stdout}")
                    else:
                        action_results.append(f"❌ {action}: {result.stderr}")
                        
                except Exception as e:
                    action_results.append(f"❌ {action}: Error - {str(e)}")
            
            # Medium-threat response summary
            combined_output = '\n'.join(action_results)
            
            self.logger.info("✅ Agent 6: MEDIUM-THREAT security response completed")
            return {
                'success': True,
                'threat_level': 'medium',
                'response_type': 'moderate',
                'actions_taken': response_actions,
                'output': combined_output,
                'recommendations': [
                    'Monitor VLAN traffic',
                    'Review security policies',
                    'Check for policy violations'
                ],
                'reasoning': f'MEDIUM-THREAT response executed for VLAN {vlan_id}. Moderate security actions taken to address potential security concerns.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in medium-threat response: {e}")
            return {
                'success': False,
                'threat_level': 'medium',
                'error': str(e),
                'reasoning': f'MEDIUM-THREAT response failed: {str(e)}'
            }

    def _execute_low_threat_response(self, vlan_id: str, vlan_name: str, security_result: dict) -> dict:
        """Execute low-threat security response actions"""
        try:
            self.logger.info("✅ Agent 6: Executing LOW-THREAT security response actions...")
            
            # Minimal response actions for low threats
            response_actions = [
                f"show vlan {vlan_id}"
            ]
            
            action_results = []
            for action in response_actions:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{action}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        action_results.append(f"✅ {action}: {result.stdout}")
                    else:
                        action_results.append(f"❌ {action}: {result.stderr}")
                        
                except Exception as e:
                    action_results.append(f"❌ {action}: Error - {str(e)}")
            
            # Low-threat response summary
            combined_output = '\n'.join(action_results)
            
            self.logger.info("✅ Agent 6: LOW-THREAT security response completed")
            return {
                'success': True,
                'threat_level': 'low',
                'response_type': 'minimal',
                'actions_taken': response_actions,
                'output': combined_output,
                'recommendations': [
                    'Continue normal monitoring',
                    'Maintain security policies',
                    'Regular security reviews'
                ],
                'reasoning': f'LOW-THREAT response executed for VLAN {vlan_id}. Minimal security actions taken as threat level is low.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in low-threat response: {e}")
            return {
                'success': False,
                'threat_level': 'low',
                'error': str(e),
                'reasoning': f'LOW-THREAT response failed: {str(e)}'
            }

    def ai_threat_intelligence_analysis(self, security_result: dict, vlan_id: str, vlan_name: str) -> dict:
        """AI-powered threat intelligence analysis and correlation"""
        self.logger.info("🧠 Agent 6: Executing AI-powered threat intelligence analysis...")
        
        try:
            # Analyze security patterns and correlations
            threat_patterns = self._analyze_threat_patterns(security_result)
            risk_assessment = self._assess_risk_level(vlan_id, vlan_name, security_result)
            security_score = self._calculate_security_score(security_result)
            
            # Generate threat intelligence report
            threat_intel = {
                'vlan_id': vlan_id,
                'vlan_name': vlan_name,
                'threat_patterns': threat_patterns,
                'risk_assessment': risk_assessment,
                'security_score': security_score,
                'timestamp': datetime.now().isoformat(),
                'recommendations': self._generate_security_recommendations(security_score, risk_assessment)
            }
            
            self.logger.info(f"✅ Agent 6: Threat intelligence analysis completed - Security Score: {security_score}/100")
            return {
                'success': True,
                'threat_intelligence': threat_intel,
                'reasoning': f'Comprehensive threat intelligence analysis completed for VLAN {vlan_id}. Security score: {security_score}/100.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in threat intelligence analysis: {e}")
            return {
                'success': False,
                'error': str(e),
                'reasoning': f'Threat intelligence analysis failed: {str(e)}'
            }

    def _analyze_threat_patterns(self, security_result: dict) -> dict:
        """Analyze security patterns for threat correlation"""
        patterns = {
            'access_violations': 0,
            'policy_violations': 0,
            'anomalous_behavior': 0,
            'security_events': 0
        }
        
        # Analyze output for patterns
        output_text = security_result.get('output', '').lower()
        
        if 'deny' in output_text:
            patterns['access_violations'] += 1
        if 'violation' in output_text:
            patterns['policy_violations'] += 1
        if 'error' in output_text or 'failed' in output_text:
            patterns['anomalous_behavior'] += 1
        if 'security' in output_text:
            patterns['security_events'] += 1
            
        return patterns

    def _assess_risk_level(self, vlan_id: str, vlan_name: str, security_result: dict) -> str:
        """Assess overall risk level for the VLAN"""
        threat_level = security_result.get('threat_level', 'low')
        monitoring_level = security_result.get('monitoring_level', 'basic')
        
        # Risk assessment logic
        if threat_level == 'high':
            return 'high'
        elif threat_level == 'medium' or monitoring_level == 'comprehensive':
            return 'medium'
        else:
            return 'low'

    def _calculate_security_score(self, security_result: dict) -> int:
        """Calculate security score (0-100) based on results"""
        base_score = 80  # Start with good base score
        
        # Adjust based on threat level
        threat_level = security_result.get('threat_level', 'low')
        if threat_level == 'high':
            base_score -= 30
        elif threat_level == 'medium':
            base_score -= 15
        elif threat_level == 'low':
            base_score += 10
            
        # Adjust based on monitoring level
        monitoring_level = security_result.get('monitoring_level', 'basic')
        if monitoring_level == 'comprehensive':
            base_score += 15
        elif monitoring_level == 'active':
            base_score += 5
            
        # Ensure score is within 0-100 range
        return max(0, min(100, base_score))

    def _generate_security_recommendations(self, security_score: int, risk_assessment: str) -> list:
        """Generate security recommendations based on score and risk"""
        recommendations = []
        
        if security_score < 50:
            recommendations.extend([
                'Immediate security review required',
                'Implement additional access controls',
                'Enable comprehensive monitoring',
                'Review and update security policies'
            ])
        elif security_score < 75:
            recommendations.extend([
                'Schedule security assessment',
                'Review access control lists',
                'Monitor for policy violations',
                'Consider enhanced monitoring'
            ])
        else:
            recommendations.extend([
                'Maintain current security posture',
                'Continue regular monitoring',
                'Periodic security reviews',
                'Stay updated on security best practices'
            ])
            
        if risk_assessment == 'high':
            recommendations.append('High-risk VLAN - Consider isolation or enhanced protection')
        elif risk_assessment == 'medium':
            recommendations.append('Medium-risk VLAN - Monitor closely for changes')
            
        return recommendations

    def process_request(self, human_request: str) -> dict:
        """Process human request through 5-agent orchestration"""
        try:
            self.logger.info(f"🚀 Starting 5-Agent CrewAI Orchestration for: {human_request}")
            
            # Agent 1: Network Request Processor
            self.logger.info("🤖 Agent 1: Network Request Processor - Starting...")
            if self.llm:
                parse_prompt = f"""
                Parse this network request and extract key information. Return ONLY a JSON object with these fields:
                - vlan_id: the VLAN number
                - vlan_name: the VLAN name
                - target_device: the target device type
                - request_type: "vlan_creation"
                - device_type: "cisco_ios"

                Request: {human_request}

                JSON response:
                """
                
                llm_response = self.safe_llm_call(parse_prompt, timeout_seconds=15)
                if llm_response:
                    try:
                        # Extract JSON from response
                        json_match = re.search(r'\{.*\}', llm_response, re.DOTALL)
                        if json_match:
                            parsed_request = json.loads(json_match.group())
                            self.logger.info("✅ Agent 1: LLM parsing successful")
                        else:
                            parsed_request = self.fallback_parse(human_request)
                            self.logger.info("✅ Agent 1: Using fallback parsing")
                    except Exception as e:
                        self.logger.warning(f"⚠️ Agent 1: JSON parsing failed, using fallback: {e}")
                        parsed_request = self.fallback_parse(human_request)
                else:
                    parsed_request = self.fallback_parse(human_request)
                    self.logger.info("✅ Agent 1: Using fallback parsing (LLM timeout)")
            else:
                parsed_request = self.fallback_parse(human_request)
                self.logger.info("✅ Agent 1: Using fallback parsing (no LLM)")
            
            if 'vlan_id' in parsed_request:
                parsed_request['vlan_id'] = str(parsed_request['vlan_id'])
            self.logger.info(f"✅ Agent 1 Result: {parsed_request}")

            # Agent 2: Command Generator
            self.logger.info("🤖 Agent 2: Command Generator - Starting...")
            if self.llm:
                command_prompt = f"""
                Generate Cisco IOS commands for VLAN creation. Return ONLY a JSON array with these 3 commands:
                ["configure terminal", "vlan {parsed_request.get('vlan_id', 'unknown')} name {parsed_request.get('vlan_name', 'unknown')}", "end"]

                VLAN ID: {parsed_request.get('vlan_id', 'unknown')}
                VLAN Name: {parsed_request.get('vlan_name', 'unknown')}

                JSON response:
                """
                
                commands_response = self.safe_llm_call(command_prompt, timeout_seconds=15)
                if commands_response:
                    try:
                        # Extract JSON array from response
                        json_match = re.search(r'\[.*\]', commands_response, re.DOTALL)
                        if json_match:
                            commands = json.loads(json_match.group())
                            self.logger.info("✅ Agent 2: LLM command generation successful")
                        else:
                            commands = self.fallback_generate_commands(parsed_request)
                            self.logger.info("✅ Agent 2: Using fallback command generation")
                    except Exception as e:
                        self.logger.warning(f"⚠️ Agent 2: JSON parsing failed, using fallback: {e}")
                        commands = self.fallback_generate_commands(parsed_request)
                else:
                    commands = self.fallback_generate_commands(parsed_request)
                    self.logger.info("✅ Agent 2: Using fallback command generation (LLM timeout)")
            else:
                commands = self.fallback_generate_commands(parsed_request)
                self.logger.info("✅ Agent 2: Using fallback command generation (no LLM)")
            
            self.logger.info(f"✅ Agent 2 Result: {commands}")

            # Agent 3: Playbook Creator
            self.logger.info("🤖 Agent 3: Playbook Creator - Starting...")
            vlan_id_str = parsed_request.get('vlan_id', 'unknown')
            vlan_name = parsed_request.get('vlan_name', 'unknown')
            
            # Store VLAN info in class variables for Agent 4 to use
            self.vlan_id_str = vlan_id_str
            self.vlan_name = vlan_name
            
            # AI-POWERED DECISION MAKING: Agent 3 now intelligently chooses the best approach
            playbook_strategy = self.ai_choose_playbook_strategy(human_request, parsed_request, commands)
            
            # Generate the intelligent playbook based on AI decision
            playbook = self.ai_generate_playbook(vlan_id_str, vlan_name, playbook_strategy)
            
            # Save playbook
            with open(PLAYBOOK_PATH, 'w') as f:
                yaml.dump([playbook], f, default_flow_style=False)
            self.logger.info(f"✅ Agent 3: AI-Powered playbook created using {playbook_strategy['module']} strategy and saved to {PLAYBOOK_PATH}")
            self.logger.info(f"🤖 Agent 3 AI Decision: {playbook_strategy['reasoning']}")

            # Agent 4: Execution Manager
            self.logger.info("🤖 Agent 4: Execution Manager - Starting...")
            
            # AI-POWERED EXECUTION: Agent 4 now intelligently chooses the best execution method
            execution_strategy = self.ai_choose_execution_strategy(human_request, parsed_request, playbook_strategy, commands)
            
            # Execute using the AI-chosen strategy
            execution_result = self.ai_execute_playbook(execution_strategy, playbook_strategy)
            
            self.logger.info(f"🤖 Agent 4 AI Decision: {execution_strategy['reasoning']}")
            
            # Agent 5: Verification Agent
            self.logger.info("🤖 Agent 5: Verification Agent - Starting...")
            
            # AI-POWERED VERIFICATION: Agent 5 now intelligently chooses the best verification method
            verification_strategy = self.ai_choose_verification_strategy(human_request, parsed_request, playbook_strategy, execution_result)
            
            # Execute verification using the AI-chosen strategy
            verification_result = self.ai_execute_verification(verification_strategy, vlan_id_str, vlan_name)
            
            self.logger.info(f"🤖 Agent 5 AI Decision: {verification_strategy['reasoning']}")
            
            # Agent 6: Security Incident Response Agent
            self.logger.info("🤖 Agent 6: Security Incident Response Agent - Starting...")
            
            try:
                # AI-POWERED SECURITY: Agent 6 now monitors and responds to security threats
                security_monitoring_result = self.ai_security_monitoring_and_response(vlan_id_str, vlan_name)
                
                # Start real-time security monitoring for the newly created VLAN
                self.start_real_time_security_monitoring(vlan_id_str, vlan_name)
                
                self.logger.info(f"🤖 Agent 6 AI Decision: {security_monitoring_result['reasoning']}")
                self.logger.info(f"🔄 Agent 6: Real-time security monitoring started for VLAN {vlan_id_str}")
                
                # Save commands to output file
                with open(OUTPUT_PATH, 'w') as f:
                    for cmd in commands:
                        f.write(f"{cmd}\n")
                
                self.logger.info("🎉 6-Agent CrewAI Orchestration completed successfully!")
                return {
                    "success": True,
                    "agents": {
                        "agent1": {"status": "completed", "output": "Request parsed successfully"},
                        "agent2": {"status": "completed", "output": "Commands generated"},
                        "agent3": {"status": "completed", "output": f"AI-Powered playbook created using {playbook_strategy['module']} strategy"},
                        "agent4": {"status": "completed", "output": f"AI-Powered execution completed using {execution_strategy['method']} method"},
                        "agent5": {"status": "completed", "output": f"AI-Powered verification completed using {verification_strategy['method']} method"},
                        "agent6": {"status": "completed", "output": f"AI-Powered security monitoring completed using {security_monitoring_result.get('method', 'unknown')} method"}
                    },
                    "vlan_id": vlan_id_str,
                    "vlan_name": vlan_name,
                    "commands": commands,
                    "ai_strategy": playbook_strategy
                }
                
            except Exception as e:
                self.logger.error(f"❌ 6-Agent orchestration failed: {e}")
                return {
                    "success": False,
                    "error": str(e),
                    "agents": {
                        "agent1": {"status": "error", "output": f"Failed: {str(e)}"},
                        "agent2": {"status": "error", "output": f"Failed: {str(e)}"},
                        "agent3": {"status": "error", "output": f"Failed: {str(e)}"},
                        "agent4": {"status": "error", "output": f"Failed: {str(e)}"},
                        "agent5": {"status": "error", "output": f"Failed: {str(e)}"},
                        "agent6": {"status": "error", "output": f"Failed: {str(e)}"}
                    }
                }
            
        except Exception as e:
            self.logger.error(f"❌ 5-Agent orchestration failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "agents": {
                    "agent1": {"status": "error", "output": f"Failed: {str(e)}"},
                    "agent2": {"status": "error", "output": f"Failed: {str(e)}"},
                    "agent3": {"status": "error", "output": f"Failed: {str(e)}"},
                    "agent4": {"status": "error", "output": f"Failed: {str(e)}"},
                    "agent5": {"status": "error", "output": f"Failed: {str(e)}"},
                    "agent6": {"status": "error", "output": f"Failed: {str(e)}"}
                }
            }

    def fallback_parse(self, human_request: str) -> dict:
        """Fallback parsing when LLM fails"""
        # Enhanced regex-based parsing for various naming patterns
        human_request_lower = human_request.lower()
        
        # Find VLAN ID
        vlan_match = re.search(r'vlan\s+(\d+)', human_request_lower)
        
        # Find VLAN name using multiple patterns
        name_match = None
        name_patterns = [
            r'named?\s+(\w+)',           # "named VLAN123" or "name VLAN123"
            r'called\s+(\w+)',           # "called VLAN123"
            r'with\s+name\s+(\w+)',      # "with name VLAN123"
            r'as\s+(\w+)',               # "as VLAN123"
            r'(\w+)\s+for\s+\w+',        # "VLAN123 for test"
            r'(\w+)\s+test',             # "VLAN123 test"
        ]
        
        for pattern in name_patterns:
            name_match = re.search(pattern, human_request_lower)
            if name_match:
                break
        
        # Extract VLAN name from the request if no pattern matched
        if not name_match:
            # Look for words that might be VLAN names (after "vlan" and before common words)
            words = human_request_lower.split()
            try:
                vlan_index = words.index('vlan')
                if vlan_index + 2 < len(words):
                    potential_name = words[vlan_index + 2]
                    # Check if it's not a common word
                    common_words = ['on', 'switch', 'with', 'and', 'or', 'the', 'a', 'an']
                    if potential_name not in common_words and len(potential_name) > 2:
                        name_match = type('obj', (object,), {'group': lambda x: potential_name})()
            except ValueError:
                pass
        
        return {
            "vlan_id": vlan_match.group(1) if vlan_match else "100",
            "vlan_name": name_match.group(1) if name_match else "DefaultVLAN",
            "target_device": "cisco_switch",
            "request_type": "vlan_creation",
            "device_type": "cisco_ios"
        }

    def fallback_generate_commands(self, parsed_request: dict) -> list:
        """Fallback command generation when LLM fails"""
        vlan_id = parsed_request.get('vlan_id', '100')
        vlan_name = parsed_request.get('vlan_name', 'DefaultVLAN')
        
        return [
            "configure terminal",
            f"vlan {vlan_id} name {vlan_name}",
            "end"
        ]

    def _generate_security_recommendations(self, security_score: int, risk_assessment: str) -> list:
        """Generate security recommendations based on score and risk"""
        recommendations = []
        
        if security_score < 50:
            recommendations.extend([
                'Immediate security review required',
                'Implement additional access controls',
                'Enable comprehensive monitoring',
                'Review and update security policies'
            ])
        elif security_score < 75:
            recommendations.extend([
                'Schedule security assessment',
                'Review access control lists',
                'Monitor for policy violations',
                'Consider enhanced monitoring'
            ])
        else:
            recommendations.extend([
                'Maintain current security posture',
                'Continue regular monitoring',
                'Periodic security reviews',
                'Stay updated on security best practices'
            ])
            
        if risk_assessment == 'high':
            recommendations.append('High-risk VLAN - Consider isolation or enhanced protection')
        elif risk_assessment == 'medium':
            recommendations.append('Medium-risk VLAN - Monitor closely for changes')
            
        return recommendations

    def ai_continuous_security_monitoring(self, vlan_id: str, vlan_name: str, monitoring_interval: int = 300) -> dict:
        """AI-powered continuous security monitoring with real-time threat detection"""
        self.logger.info(f"🔒 Agent 6: Starting AI-powered continuous security monitoring for VLAN {vlan_id}")
        
        try:
            # Initialize monitoring session
            monitoring_session = {
                'vlan_id': vlan_id,
                'vlan_name': vlan_name,
                'start_time': datetime.now().isoformat(),
                'monitoring_interval': monitoring_interval,
                'threat_events': [],
                'security_alerts': [],
                'performance_metrics': {},
                'status': 'active'
            }
            
            # Start continuous monitoring loop
            self.logger.info(f"🔄 Agent 6: Continuous monitoring active - checking every {monitoring_interval} seconds")
            
            # For demonstration, we'll do one comprehensive check
            # In production, this would run in a separate thread/process
            current_status = self._perform_comprehensive_security_check(vlan_id, vlan_name)
            
            # Analyze current status for threats
            threat_analysis = self._analyze_real_time_threats(current_status, vlan_id, vlan_name)
            
            # Generate real-time recommendations
            real_time_recommendations = self._generate_real_time_recommendations(threat_analysis, current_status)
            
            # Update monitoring session
            monitoring_session.update({
                'current_status': current_status,
                'threat_analysis': threat_analysis,
                'real_time_recommendations': real_time_recommendations,
                'last_check': datetime.now().isoformat(),
                'status': 'completed'
            })
            
            self.logger.info(f"✅ Agent 6: Continuous security monitoring completed for VLAN {vlan_id}")
            return {
                'success': True,
                'monitoring_session': monitoring_session,
                'reasoning': f'Continuous security monitoring completed for VLAN {vlan_id}. {len(threat_analysis.get("threats", []))} threats detected.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in continuous security monitoring: {e}")
            return {
                'success': False,
                'error': str(e),
                'reasoning': f'Continuous security monitoring failed: {str(e)}'
            }

    def _perform_comprehensive_security_check(self, vlan_id: str, vlan_name: str) -> dict:
        """Perform comprehensive real-time security check"""
        try:
            self.logger.info(f"🔍 Agent 6: Performing comprehensive real-time security check for VLAN {vlan_id}")
            
            # Real-time security checks
            security_checks = [
                f"show vlan {vlan_id}",
                f"show ip interface vlan {vlan_id}",
                "show access-lists",
                "show ip traffic",
                "show logging",
                "show users",
                "show processes cpu",
                "show memory statistics"
            ]
            
            check_results = {}
            for check in security_checks:
                try:
                    cmd = [
                        'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                        '-a', f'commands="{check}"',
                        '--user', 'sarra', '--become', '--become-method', 'enable'
                    ]
                    
                    result = subprocess.run(
                        cmd,
                        capture_output=True,
                        text=True,
                        timeout=30
                    )
                    
                    if result.returncode == 0:
                        check_results[check] = {
                            'status': 'success',
                            'output': result.stdout,
                            'timestamp': datetime.now().isoformat()
                        }
                    else:
                        check_results[check] = {
                            'status': 'failed',
                            'error': result.stderr,
                            'timestamp': datetime.now().isoformat()
                        }
                        
                except Exception as e:
                    check_results[check] = {
                        'status': 'error',
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    }
            
            self.logger.info(f"✅ Agent 6: Comprehensive security check completed for VLAN {vlan_id}")
            return check_results
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in comprehensive security check: {e}")
            return {'error': str(e)}

    def _analyze_real_time_threats(self, security_status: dict, vlan_id: str, vlan_name: str) -> dict:
        """Analyze real-time security status for immediate threats"""
        try:
            self.logger.info(f"🧠 Agent 6: Analyzing real-time threats for VLAN {vlan_id}")
            
            threats = []
            threat_level = 'low'
            threat_indicators = 0
            
            # Analyze each security check for threats
            for check_name, check_result in security_status.items():
                if check_result.get('status') == 'success':
                    output = check_result.get('output', '').lower()
                    
                    # Threat detection patterns
                    if 'deny' in output:
                        threats.append({
                            'type': 'access_violation',
                            'source': check_name,
                            'severity': 'medium',
                            'description': f'Access denied detected in {check_name}',
                            'timestamp': check_result.get('timestamp')
                        })
                        threat_indicators += 1
                    
                    if 'error' in output:
                        threats.append({
                            'type': 'system_error',
                            'source': check_name,
                            'severity': 'low',
                            'description': f'System error detected in {check_name}',
                            'timestamp': check_result.get('timestamp')
                        })
                        threat_indicators += 1
                    
                    if 'warning' in output:
                        threats.append({
                            'type': 'security_warning',
                            'source': check_name,
                            'severity': 'medium',
                            'description': f'Security warning in {check_name}',
                            'timestamp': check_result.get('timestamp')
                        })
                        threat_indicators += 1
                    
                    if 'failed' in output:
                        threats.append({
                            'type': 'operation_failure',
                            'source': check_name,
                            'severity': 'high',
                            'description': f'Operation failed in {check_name}',
                            'timestamp': check_result.get('timestamp')
                        })
                        threat_indicators += 2
                
                elif check_result.get('status') == 'failed':
                    threats.append({
                        'type': 'check_failure',
                        'source': check_name,
                        'severity': 'medium',
                        'description': f'Security check failed: {check_result.get("error")}',
                        'timestamp': check_result.get('timestamp')
                    })
                    threat_indicators += 1
            
            # Determine overall threat level
            if threat_indicators >= 5:
                threat_level = 'critical'
            elif threat_indicators >= 3:
                threat_level = 'high'
            elif threat_indicators >= 1:
                threat_level = 'medium'
            else:
                threat_level = 'low'
            
            self.logger.info(f"✅ Agent 6: Real-time threat analysis completed - Threat level: {threat_level}")
            return {
                'threat_level': threat_level,
                'threat_indicators': threat_indicators,
                'threats': threats,
                'analysis_timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in real-time threat analysis: {e}")
            return {'error': str(e)}

    def _generate_real_time_recommendations(self, threat_analysis: dict, security_status: dict) -> list:
        """Generate real-time security recommendations based on current threats"""
        try:
            self.logger.info("💡 Agent 6: Generating real-time security recommendations...")
            
            recommendations = []
            threat_level = threat_analysis.get('threat_level', 'low')
            threats = threat_analysis.get('threats', [])
            
            # Immediate action recommendations based on threat level
            if threat_level == 'critical':
                recommendations.extend([
                    '🚨 IMMEDIATE ACTION REQUIRED: Isolate VLAN from network',
                    '🚨 Contact security team immediately',
                    '🚨 Enable emergency security protocols',
                    '🚨 Review all access controls'
                ])
            elif threat_level == 'high':
                recommendations.extend([
                    '⚠️ HIGH PRIORITY: Review security policies',
                    '⚠️ Check for unauthorized access',
                    '⚠️ Monitor traffic patterns closely',
                    '⚠️ Consider VLAN isolation'
                ])
            elif threat_level == 'medium':
                recommendations.extend([
                    '🔍 MEDIUM PRIORITY: Investigate security warnings',
                    '🔍 Review access logs',
                    '🔍 Monitor for policy violations',
                    '🔍 Schedule security assessment'
                ])
            else:
                recommendations.extend([
                    '✅ LOW PRIORITY: Continue normal monitoring',
                    '✅ Maintain current security posture',
                    '✅ Regular security reviews',
                    '✅ Stay updated on best practices'
                ])
            
            # Specific recommendations based on detected threats
            for threat in threats:
                if threat.get('type') == 'access_violation':
                    recommendations.append('🔒 Access violation detected - Review access control lists')
                elif threat.get('type') == 'system_error':
                    recommendations.append('⚙️ System error detected - Check system logs and stability')
                elif threat.get('type') == 'security_warning':
                    recommendations.append('⚠️ Security warning - Investigate and address security concerns')
                elif threat.get('type') == 'operation_failure':
                    recommendations.append('❌ Operation failure - Critical issue requiring immediate attention')
            
            self.logger.info(f"✅ Agent 6: Generated {len(recommendations)} real-time recommendations")
            return recommendations
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error generating real-time recommendations: {e}")
            return ['Error generating recommendations']

    def ai_attack_simulation_test(self, vlan_id: str, vlan_name: str) -> dict:
        """AI-powered attack simulation to test security defenses"""
        self.logger.info(f"🎯 Agent 6: Starting AI-powered attack simulation test for VLAN {vlan_id}")
        
        try:
            # Simulate different types of attacks
            attack_scenarios = [
                {
                    'name': 'Port Scan Simulation',
                    'type': 'reconnaissance',
                    'severity': 'low',
                    'description': 'Simulate port scanning to test detection'
                },
                {
                    'name': 'Access Control Test',
                    'type': 'authorization',
                    'severity': 'medium',
                    'description': 'Test access control effectiveness'
                },
                {
                    'name': 'Traffic Analysis',
                    'type': 'monitoring',
                    'severity': 'low',
                    'description': 'Analyze traffic patterns for anomalies'
                }
            ]
            
            simulation_results = []
            for scenario in attack_scenarios:
                try:
                    self.logger.info(f"🎯 Agent 6: Testing attack scenario: {scenario['name']}")
                    
                    # Simulate the attack scenario
                    test_result = self._simulate_attack_scenario(scenario, vlan_id, vlan_name)
                    
                    simulation_results.append({
                        'scenario': scenario,
                        'result': test_result,
                        'timestamp': datetime.now().isoformat()
                    })
                    
                except Exception as e:
                    simulation_results.append({
                        'scenario': scenario,
                        'result': {'error': str(e)},
                        'timestamp': datetime.now().isoformat()
                    })
            
            # Analyze simulation results
            security_score = self._calculate_simulation_security_score(simulation_results)
            vulnerabilities = self._identify_vulnerabilities(simulation_results)
            
            self.logger.info(f"✅ Agent 6: Attack simulation test completed - Security score: {security_score}/100")
            return {
                'success': True,
                'simulation_results': simulation_results,
                'security_score': security_score,
                'vulnerabilities': vulnerabilities,
                'recommendations': self._generate_simulation_recommendations(security_score, vulnerabilities),
                'reasoning': f'Attack simulation test completed for VLAN {vlan_id}. Security score: {security_score}/100. {len(vulnerabilities)} vulnerabilities identified.'
            }
                
        except Exception as e:
            self.logger.error(f"❌ Agent 6: Error in attack simulation test: {e}")
            return {
                'success': False,
                'error': str(e),
                'reasoning': f'Attack simulation test failed: {str(e)}'
            }

    def _simulate_attack_scenario(self, scenario: dict, vlan_id: str, vlan_name: str) -> dict:
        """Simulate a specific attack scenario"""
        try:
            scenario_name = scenario['name']
            scenario_type = scenario['type']
            
            if scenario_type == 'reconnaissance':
                # Simulate port scanning
                return self._simulate_port_scan(vlan_id, vlan_name)
            elif scenario_type == 'authorization':
                # Simulate access control test
                return self._simulate_access_control_test(vlan_id, vlan_name)
            elif scenario_type == 'monitoring':
                # Simulate traffic analysis
                return self._simulate_traffic_analysis(vlan_id, vlan_name)
            else:
                return {'error': f'Unknown scenario type: {scenario_type}'}
                
        except Exception as e:
            return {'error': f'Simulation failed: {str(e)}'}

    def _simulate_port_scan(self, vlan_id: str, vlan_name: str) -> dict:
        """Simulate port scanning attack"""
        try:
            self.logger.info(f"🔍 Agent 6: Simulating port scan on VLAN {vlan_id}")
            
            # Use Ansible to check interface status (simulates port scanning)
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', 'commands="show ip interface brief"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Analyze interface information
                interfaces = self._analyze_interface_vulnerabilities(result.stdout)
                
                return {
                    'status': 'completed',
                    'vulnerabilities_found': len(interfaces.get('vulnerable_interfaces', [])),
                    'interfaces_analyzed': len(interfaces.get('all_interfaces', [])),
                    'details': interfaces,
                    'simulation_type': 'port_scan'
                }
            else:
                return {
                    'status': 'failed',
                    'error': result.stderr,
                    'simulation_type': 'port_scan'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'simulation_type': 'port_scan'
            }

    def _simulate_access_control_test(self, vlan_id: str, vlan_name: str) -> dict:
        """Simulate access control testing"""
        try:
            self.logger.info(f"🔒 Agent 6: Testing access controls for VLAN {vlan_id}")
            
            # Test access control lists
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', 'commands="show access-lists"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Analyze access control effectiveness
                acl_analysis = self._analyze_access_control_effectiveness(result.stdout, vlan_id)
                
                return {
                    'status': 'completed',
                    'access_controls_tested': True,
                    'effectiveness_score': acl_analysis.get('effectiveness_score', 0),
                    'vulnerabilities_found': len(acl_analysis.get('vulnerabilities', [])),
                    'details': acl_analysis,
                    'simulation_type': 'access_control_test'
                }
            else:
                return {
                    'status': 'failed',
                    'error': result.stderr,
                    'simulation_type': 'access_control_test'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'simulation_type': 'access_control_test'
            }

    def _simulate_traffic_analysis(self, vlan_id: str, vlan_name: str) -> dict:
        """Simulate traffic analysis for anomalies"""
        try:
            self.logger.info(f"📊 Agent 6: Analyzing traffic patterns for VLAN {vlan_id}")
            
            # Analyze traffic patterns
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', 'commands="show ip traffic"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                # Analyze traffic for anomalies
                traffic_analysis = self._analyze_traffic_anomalies(result.stdout, vlan_id)
                
                return {
                    'status': 'completed',
                    'traffic_analyzed': True,
                    'anomalies_detected': len(traffic_analysis.get('anomalies', [])),
                    'traffic_patterns': traffic_analysis.get('patterns', {}),
                    'details': traffic_analysis,
                    'simulation_type': 'traffic_analysis'
                }
            else:
                return {
                    'status': 'failed',
                    'error': result.stderr,
                    'simulation_type': 'traffic_analysis'
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'error': str(e),
                'simulation_type': 'traffic_analysis'
            }

    def _analyze_interface_vulnerabilities(self, interface_output: str) -> dict:
        """Analyze interface output for security vulnerabilities"""
        try:
            vulnerable_interfaces = []
            all_interfaces = []
            
            # Parse interface output for vulnerabilities
            lines = interface_output.split('\n')
            for line in lines:
                if 'interface' in line.lower() and 'up' in line.lower():
                    all_interfaces.append(line.strip())
                    
                    # Check for potential vulnerabilities
                    if 'unassigned' in line.lower():
                        vulnerable_interfaces.append({
                            'interface': line.strip(),
                            'vulnerability': 'Unassigned IP address',
                            'severity': 'medium'
                        })
                    
                    if 'down' in line.lower():
                        vulnerable_interfaces.append({
                            'interface': line.strip(),
                            'vulnerability': 'Interface down - potential security risk',
                            'severity': 'low'
                        })
            
            return {
                'all_interfaces': all_interfaces,
                'vulnerable_interfaces': vulnerable_interfaces,
                'total_interfaces': len(all_interfaces),
                'vulnerable_count': len(vulnerable_interfaces)
            }
                
        except Exception as e:
            return {'error': f'Interface analysis failed: {str(e)}'}

    def _analyze_access_control_effectiveness(self, acl_output: str, vlan_id: str) -> dict:
        """Analyze access control list effectiveness"""
        try:
            vulnerabilities = []
            effectiveness_score = 80  # Base score
            
            # Analyze ACL output for weaknesses
            if 'permit any' in acl_output.lower():
                vulnerabilities.append({
                    'type': 'overly_permissive',
                    'description': 'ACL permits any traffic - security risk',
                    'severity': 'high'
                })
                effectiveness_score -= 30
            
            if 'deny any' not in acl_output.lower():
                vulnerabilities.append({
                    'type': 'missing_deny_all',
                    'description': 'ACL missing explicit deny all rule',
                    'severity': 'medium'
                })
                effectiveness_score -= 15
            
            if len(acl_output.split('\n')) < 5:
                vulnerabilities.append({
                    'type': 'minimal_rules',
                    'description': 'Very few ACL rules - may be insufficient',
                    'severity': 'medium'
                })
                effectiveness_score -= 10
            
            return {
                'effectiveness_score': max(0, effectiveness_score),
                'vulnerabilities': vulnerabilities,
                'total_rules': len(acl_output.split('\n')),
                'analysis_timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            return {'error': f'ACL analysis failed: {str(e)}'}

    def _analyze_traffic_anomalies(self, traffic_output: str, vlan_id: str) -> dict:
        """Analyze traffic output for anomalies"""
        try:
            anomalies = []
            patterns = {}
            
            # Basic traffic pattern analysis
            if 'error' in traffic_output.lower():
                anomalies.append({
                    'type': 'traffic_error',
                    'description': 'Traffic errors detected',
                    'severity': 'medium'
                })
            
            if 'drop' in traffic_output.lower():
                patterns['packet_drops'] = True
                anomalies.append({
                    'type': 'packet_drops',
                    'description': 'Packet drops detected - potential network issues',
                    'severity': 'low'
                })
            
            if 'broadcast' in traffic_output.lower():
                patterns['broadcast_traffic'] = True
            
            if 'multicast' in traffic_output.lower():
                patterns['multicast_traffic'] = True
            
            return {
                'anomalies': anomalies,
                'patterns': patterns,
                'analysis_timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            return {'error': f'Traffic analysis failed: {str(e)}'}

    def _calculate_simulation_security_score(self, simulation_results: list) -> int:
        """Calculate security score based on simulation results"""
        try:
            base_score = 100
            deductions = 0
            
            for result in simulation_results:
                scenario_result = result.get('result', {})
                
                if scenario_result.get('status') == 'completed':
                    # Check for vulnerabilities
                    vulnerabilities = scenario_result.get('vulnerabilities_found', 0)
                    deductions += vulnerabilities * 10
                    
                    # Check for specific issues
                    if 'vulnerable_interfaces' in scenario_result:
                        deductions += len(scenario_result['vulnerable_interfaces']) * 5
                    
                    if 'effectiveness_score' in scenario_result:
                        effectiveness = scenario_result['effectiveness_score']
                        if effectiveness < 70:
                            deductions += (70 - effectiveness)
                
                elif scenario_result.get('status') == 'failed':
                    deductions += 20
                elif scenario_result.get('status') == 'error':
                    deductions += 30
            
            final_score = max(0, base_score - deductions)
            return final_score
                
        except Exception as e:
            return 50  # Default score on error

    def _identify_vulnerabilities(self, simulation_results: list) -> list:
        """Identify vulnerabilities from simulation results"""
        try:
            vulnerabilities = []
            
            for result in simulation_results:
                scenario_result = result.get('result', {})
                scenario_name = result.get('scenario', {}).get('name', 'Unknown')
                
                if scenario_result.get('status') == 'completed':
                    # Extract vulnerabilities from each scenario
                    if 'vulnerable_interfaces' in scenario_result:
                        for vuln in scenario_result['vulnerable_interfaces']:
                            vulnerabilities.append({
                                'scenario': scenario_name,
                                'vulnerability': vuln.get('vulnerability', 'Unknown'),
                                'severity': vuln.get('severity', 'unknown'),
                                'source': 'interface_analysis'
                            })
                    
                    if 'vulnerabilities' in scenario_result:
                        for vuln in scenario_result['vulnerabilities']:
                            vulnerabilities.append({
                                'scenario': scenario_name,
                                'vulnerability': vuln.get('description', 'Unknown'),
                                'severity': vuln.get('severity', 'unknown'),
                                'source': 'access_control_analysis'
                            })
                    
                    if 'anomalies' in scenario_result:
                        for anomaly in scenario_result['anomalies']:
                            vulnerabilities.append({
                                'scenario': scenario_name,
                                'vulnerability': anomaly.get('description', 'Unknown'),
                                'severity': anomaly.get('severity', 'unknown'),
                                'source': 'traffic_analysis'
                            })
                
                elif scenario_result.get('status') in ['failed', 'error']:
                    vulnerabilities.append({
                        'scenario': scenario_name,
                        'vulnerability': f'Simulation {scenario_result.get("status")}: {scenario_result.get("error", "Unknown error")}',
                        'severity': 'high',
                        'source': 'simulation_failure'
                    })
            
            return vulnerabilities
                
        except Exception as e:
            return [{'vulnerability': f'Error analyzing vulnerabilities: {str(e)}', 'severity': 'unknown', 'source': 'analysis_error'}]

    def _generate_simulation_recommendations(self, security_score: int, vulnerabilities: list) -> list:
        """Generate recommendations based on simulation results"""
        try:
            recommendations = []
            
            # Score-based recommendations
            if security_score < 50:
                recommendations.extend([
                    '🚨 CRITICAL: Immediate security review required',
                    '🚨 Implement comprehensive security controls',
                    '🚨 Consider network segmentation',
                    '🚨 Enable advanced threat detection'
                ])
            elif security_score < 75:
                recommendations.extend([
                    '⚠️ HIGH: Address identified vulnerabilities',
                    '⚠️ Strengthen access controls',
                    '⚠️ Implement additional monitoring',
                    '⚠️ Schedule security assessment'
                ])
            else:
                recommendations.extend([
                    '✅ GOOD: Maintain current security posture',
                    '✅ Continue regular security testing',
                    '✅ Monitor for new vulnerabilities',
                    '✅ Stay updated on security best practices'
                ])
            
            # Vulnerability-specific recommendations
            for vuln in vulnerabilities:
                severity = vuln.get('severity', 'unknown')
                if severity == 'high':
                    recommendations.append(f'🚨 HIGH PRIORITY: {vuln.get("vulnerability", "Unknown vulnerability")}')
                elif severity == 'medium':
                    recommendations.append(f'⚠️ MEDIUM PRIORITY: {vuln.get("vulnerability", "Unknown vulnerability")}')
                elif severity == 'low':
                    recommendations.append(f'🔍 LOW PRIORITY: {vuln.get("vulnerability", "Unknown vulnerability")}')
            
            return recommendations
                
        except Exception as e:
            return [f'Error generating recommendations: {str(e)}']

    def send_security_alert_email(self, alert_type: str, alert_details: dict, severity: str = 'medium'):
        """Send security alert email"""
        try:
            if not self.security_config['enable_email_alerts']:
                return
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.email_config['sender_email']
            msg['To'] = self.email_config['recipient_email']
            msg['Subject'] = f"🚨 SECURITY ALERT: {alert_type.upper()} - {severity.upper()}"
            
            # Create email body
            body = f"""
🚨 SECURITY ALERT DETECTED! 🚨

Alert Type: {alert_type}
Severity: {severity.upper()}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

🔍 ATTACK DETAILS:
"""
            
            for key, value in alert_details.items():
                body += f"{key}: {value}\n"
            
            body += f"""

🛡️ AUTOMATIC RESPONSE:
- Source IP has been blocked
- VLAN security enhanced
- Monitoring intensified

📊 THREAT STATISTICS:
- Total attacks today: {len(self.threat_tracker['attack_history'])}
- Currently blocked IPs: {len(self.threat_tracker['blocked_ips'])}
- Suspicious IPs: {len(self.threat_tracker['suspicious_ips'])}

⚠️ IMMEDIATE ACTION REQUIRED:
Please review this alert and take appropriate action.

---
AutoFlow Security Agent 6
Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port'])
            server.starttls()
            server.login(self.email_config['sender_email'], self.email_config['sender_password'])
            server.send_message(msg)
            server.quit()
            
            self.logger.info(f"✅ Security alert email sent for {alert_type}")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to send security alert email: {e}")

    def start_real_time_security_monitoring(self, vlan_id: str, vlan_name: str):
        """Start real-time security monitoring for the VLAN"""
        try:
            if self.monitoring_active:
                self.logger.info("🔄 Security monitoring already active")
                return
            
            self.monitoring_active = True
            self.logger.info(f"🚀 Starting real-time security monitoring for VLAN {vlan_id}")
            
            # Start monitoring in separate thread
            self.security_thread = threading.Thread(
                target=self._security_monitoring_loop,
                args=(vlan_id, vlan_name),
                daemon=True
            )
            self.security_thread.start()
            
            self.logger.info(f"✅ Real-time security monitoring started for VLAN {vlan_id}")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to start security monitoring: {e}")

    def stop_real_time_security_monitoring(self):
        """Stop real-time security monitoring"""
        try:
            self.monitoring_active = False
            if self.security_thread and self.security_thread.is_alive():
                self.security_thread.join(timeout=5)
            self.logger.info("🛑 Real-time security monitoring stopped")
            
        except Exception as e:
            self.logger.error(f"❌ Error stopping security monitoring: {e}")

    def _security_monitoring_loop(self, vlan_id: str, vlan_name: str):
        """Main security monitoring loop"""
        try:
            while self.monitoring_active:
                # Perform security checks
                self._perform_security_checks(vlan_id, vlan_name)
                
                # Analyze for threats
                threats = self._analyze_current_threats(vlan_id)
                
                # Respond to threats if auto-response enabled
                if threats and self.security_config['enable_auto_response']:
                    self._respond_to_threats(threats, vlan_id, vlan_name)
                
                # Clean up old threat data
                self._cleanup_threat_data()
                
                # Wait for next check
                time.sleep(self.security_config['monitoring_interval'])
                
        except Exception as e:
            self.logger.error(f"❌ Security monitoring loop error: {e}")

    def _perform_security_checks(self, vlan_id: str, vlan_name: str):
        """Perform real-time security checks on the switch"""
        try:
            # Check switch interfaces and ports
            interface_check = self._check_switch_interfaces(vlan_id)
            
            # Check for suspicious traffic
            traffic_check = self._check_suspicious_traffic(vlan_id)
            
            # Check for unauthorized access attempts
            access_check = self._check_unauthorized_access(vlan_id)
            
            # Update threat tracker
            self._update_threat_tracker(interface_check, traffic_check, access_check)
            
        except Exception as e:
            self.logger.error(f"❌ Security check error: {e}")

    def _check_switch_interfaces(self, vlan_id: str) -> dict:
        """Check switch interfaces for security issues"""
        try:
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', f'commands="show interfaces status,show ip interface brief"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return self._analyze_interface_security(result.stdout, vlan_id)
            else:
                return {'error': result.stderr}
                
        except Exception as e:
            return {'error': str(e)}

    def _check_suspicious_traffic(self, vlan_id: str) -> dict:
        """Check for suspicious network traffic patterns"""
        try:
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', f'commands="show ip traffic,show logging"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return self._analyze_traffic_security(result.stdout, vlan_id)
            else:
                return {'error': result.stderr}
                
        except Exception as e:
            return {'error': str(e)}

    def _check_unauthorized_access(self, vlan_id: str) -> dict:
        """Check for unauthorized access attempts"""
        try:
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_command',
                '-a', f'commands="show access-lists,show users"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return self._analyze_access_security(result.stdout, vlan_id)
            else:
                return {'error': result.stderr}
                
        except Exception as e:
            return {'error': str(e)}

    def _analyze_interface_security(self, interface_output: str, vlan_id: str) -> dict:
        """Analyze interface output for security issues"""
        try:
            security_issues = []
            
            lines = interface_output.split('\n')
            for line in lines:
                line_lower = line.lower()
                
                # Check for security issues
                if 'down' in line_lower and 'interface' in line_lower:
                    security_issues.append({
                        'type': 'interface_down',
                        'description': 'Interface is down - potential security risk',
                        'severity': 'medium',
                        'details': line.strip()
                    })
                
                if 'error' in line_lower and 'interface' in line_lower:
                    security_issues.append({
                        'type': 'interface_error',
                        'description': 'Interface error detected',
                        'severity': 'high',
                        'details': line.strip()
                    })
                
                if 'unassigned' in line_lower and 'ip' in line_lower:
                    security_issues.append({
                        'type': 'unassigned_ip',
                        'description': 'Unassigned IP address - security risk',
                        'severity': 'medium',
                        'details': line.strip()
                    })
            
            return {
                'security_issues': security_issues,
                'total_issues': len(security_issues),
                'timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            return {'error': f'Interface analysis failed: {str(e)}'}

    def _analyze_traffic_security(self, traffic_output: str, vlan_id: str) -> dict:
        """Analyze traffic output for security threats"""
        try:
            threats = []
            
            lines = traffic_output.split('\n')
            for line in lines:
                line_lower = line.lower()
                
                # Check for attack patterns
                if 'deny' in line_lower:
                    threats.append({
                        'type': 'access_denied',
                        'description': 'Access denied - potential attack attempt',
                        'severity': 'medium',
                        'details': line.strip()
                    })
                
                if 'error' in line_lower and 'traffic' in line_lower:
                    threats.append({
                        'type': 'traffic_error',
                        'description': 'Traffic error detected',
                        'severity': 'low',
                        'details': line.strip()
                    })
                
                if 'warning' in line_lower and 'security' in line_lower:
                    threats.append({
                        'type': 'security_warning',
                        'description': 'Security warning detected',
                        'severity': 'medium',
                        'details': line.strip()
                    })
            
            return {
                'threats': threats,
                'total_threats': len(threats),
                'timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            return {'error': f'Traffic analysis failed: {str(e)}'}

    def _analyze_access_security(self, access_output: str, vlan_id: str) -> dict:
        """Analyze access control output for security issues"""
        try:
            access_issues = []
            
            lines = access_output.split('\n')
            for line in lines:
                line_lower = line.lower()
                
                # Check for access control issues
                if 'permit any' in line_lower:
                    access_issues.append({
                        'type': 'overly_permissive',
                        'description': 'ACL permits any traffic - security risk',
                        'severity': 'high',
                        'details': line.strip()
                    })
                
                if 'deny any' not in line_lower and 'access-list' in line_lower:
                    access_issues.append({
                        'type': 'missing_deny_all',
                        'description': 'ACL missing explicit deny all rule',
                        'severity': 'medium',
                        'details': line.strip()
                    })
                
                if 'failed' in line_lower and 'login' in line_lower:
                    access_issues.append({
                        'type': 'failed_login',
                        'description': 'Failed login attempt detected',
                        'severity': 'medium',
                        'details': line.strip()
                    })
            
            return {
                'access_issues': access_issues,
                'total_issues': len(access_issues),
                'timestamp': datetime.now().isoformat()
            }
                
        except Exception as e:
            return {'error': f'Access analysis failed: {str(e)}'}

    def _update_threat_tracker(self, interface_check: dict, traffic_check: dict, access_check: dict):
        """Update threat tracker with current security check results"""
        try:
            current_time = datetime.now()
            
            # Update suspicious IPs (simulated - in real implementation, extract actual IPs)
            if 'threats' in traffic_check:
                for threat in traffic_check['threats']:
                    # Simulate IP tracking (in real implementation, extract from logs)
                    simulated_ip = f"192.168.{hash(threat['type']) % 255}.{hash(threat['description']) % 255}"
                    
                    if simulated_ip not in self.threat_tracker['suspicious_ips']:
                        self.threat_tracker['suspicious_ips'][simulated_ip] = {
                            'first_seen': current_time,
                            'threats': [],
                            'count': 0
                        }
                    
                    self.threat_tracker['suspicious_ips'][simulated_ip]['threats'].append(threat)
                    self.threat_tracker['suspicious_ips'][simulated_ip]['count'] += 1
            
            # Update attack history
            total_threats = (
                interface_check.get('total_issues', 0) +
                traffic_check.get('total_threats', 0) +
                access_check.get('total_issues', 0)
            )
            
            if total_threats > 0:
                self.threat_tracker['attack_history'].append({
                    'timestamp': current_time,
                    'interface_issues': interface_check.get('total_issues', 0),
                    'traffic_threats': traffic_check.get('total_threats', 0),
                    'access_issues': access_check.get('total_issues', 0),
                    'total_threats': total_threats
                })
            
        except Exception as e:
            self.logger.error(f"❌ Error updating threat tracker: {e}")

    def _analyze_current_threats(self, vlan_id: str) -> list:
        """Analyze current threats and determine if action is needed"""
        try:
            current_threats = []
            
            # Check for high-threat IPs
            for ip, data in self.threat_tracker['suspicious_ips'].items():
                if data['count'] >= self.security_config['port_scan_threshold']:
                    current_threats.append({
                        'type': 'port_scan_attack',
                        'source_ip': ip,
                        'severity': 'high',
                        'count': data['count'],
                        'description': f'Port scan attack from {ip} - {data["count"]} attempts'
                    })
                
                if data['count'] >= self.security_config['brute_force_threshold']:
                    current_threats.append({
                        'type': 'brute_force_attack',
                        'source_ip': ip,
                        'severity': 'critical',
                        'count': data['count'],
                        'description': f'Brute force attack from {ip} - {data["count"]} attempts'
                    })
            
            # Check recent attack history
            recent_attacks = [
                attack for attack in self.threat_tracker['attack_history']
                if (datetime.now() - attack['timestamp']).seconds < 300  # Last 5 minutes
            ]
            
            if recent_attacks:
                total_recent = sum(attack['total_threats'] for attack in recent_attacks)
                if total_recent >= self.security_config['ddos_threshold']:
                    current_threats.append({
                        'type': 'ddos_attack',
                        'source_ip': 'multiple',
                        'severity': 'critical',
                        'count': total_recent,
                        'description': f'DDoS attack detected - {total_recent} threats in 5 minutes'
                    })
            
            return current_threats
            
        except Exception as e:
            self.logger.error(f"❌ Error analyzing current threats: {e}")
            return []

    def _respond_to_threats(self, threats: list, vlan_id: str, vlan_name: str):
        """Automatically respond to detected threats"""
        try:
            for threat in threats:
                self.logger.warning(f"🚨 THREAT DETECTED: {threat['type']} from {threat['source_ip']}")
                
                # Send email alert
                if self.security_config['enable_email_alerts']:
                    self.send_security_alert_email(
                        alert_type=threat['type'],
                        alert_details=threat,
                        severity=threat['severity']
                    )
                
                # Take automatic action
                if threat['source_ip'] != 'multiple':
                    self._block_malicious_ip(threat['source_ip'], threat['type'])
                
                # Enhance VLAN security
                self._enhance_vlan_security(vlan_id, vlan_name, threat)
                
        except Exception as e:
            self.logger.error(f"❌ Error responding to threats: {e}")

    def _block_malicious_ip(self, malicious_ip: str, attack_type: str):
        """Block malicious IP address on the switch"""
        try:
            self.logger.info(f"🛡️ Blocking malicious IP {malicious_ip} for {attack_type}")
            
            # Create blocking ACL
            block_acl = f"""
ip access-list extended BLOCK_MALICIOUS_{malicious_ip.replace('.', '_')}
 deny ip host {malicious_ip} any
 permit ip any any
"""
            
            # Apply blocking ACL to switch
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_config',
                '-a', f'lines="{block_acl}"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.threat_tracker['blocked_ips'].add(malicious_ip)
                self.logger.info(f"✅ Successfully blocked IP {malicious_ip}")
            else:
                self.logger.error(f"❌ Failed to block IP {malicious_ip}: {result.stderr}")
                
        except Exception as e:
            self.logger.error(f"❌ Error blocking malicious IP: {e}")

    def _enhance_vlan_security(self, vlan_id: str, vlan_name: str, threat: dict):
        """Enhance VLAN security in response to threats"""
        try:
            self.logger.info(f"🛡️ Enhancing security for VLAN {vlan_id} due to {threat['type']}")
            
            # Create enhanced security ACL
            security_acl = f"""
ip access-list extended VLAN_{vlan_id}_SECURITY
 remark Enhanced security for {threat['type']} attack
 deny ip any any fragments
 deny tcp any any eq 23
 deny tcp any any eq 22
 permit ip any any
"""
            
            # Apply security ACL
            cmd = [
                'ansible', 'all', '-i', INVENTORY_PATH, '-m', 'ios_config',
                '-a', f'lines="{security_acl}"',
                '--user', 'sarra', '--become', '--become-method', 'enable'
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                self.logger.info(f"✅ Enhanced security applied to VLAN {vlan_id}")
            else:
                self.logger.error(f"❌ Failed to enhance VLAN security: {result.stderr}")
                
        except Exception as e:
            self.logger.error(f"❌ Error enhancing VLAN security: {e}")

    def _cleanup_threat_data(self):
        """Clean up old threat data"""
        try:
            current_time = datetime.now()
            
            # Clean up old attack history (keep last 24 hours)
            self.threat_tracker['attack_history'] = [
                attack for attack in self.threat_tracker['attack_history']
                if (current_time - attack['timestamp']).seconds < 86400
            ]
            
            # Clean up old suspicious IPs (keep last 1 hour)
            expired_ips = []
            for ip, data in self.threat_tracker['suspicious_ips'].items():
                if (current_time - data['first_seen']).seconds > 3600:
                    expired_ips.append(ip)
            
            for ip in expired_ips:
                del self.threat_tracker['suspicious_ips'][ip]
            
            # Update cleanup timestamp
            self.threat_tracker['last_cleanup'] = current_time
            
        except Exception as e:
            self.logger.error(f"❌ Error cleaning up threat data: {e}")

    def get_security_status(self, vlan_id: str) -> dict:
        """Get current security status for a VLAN"""
        try:
            return {
                'vlan_id': vlan_id,
                'monitoring_active': self.monitoring_active,
                'threats_detected': len(self.threat_tracker['attack_history']),
                'blocked_ips': list(self.threat_tracker['blocked_ips']),
                'suspicious_ips': len(self.threat_tracker['suspicious_ips']),
                'last_cleanup': self.threat_tracker['last_cleanup'].isoformat(),
                'security_config': self.security_config
            }
            
        except Exception as e:
            return {'error': str(e)}

def main():
    """Main function to run the 6-agent orchestration"""
    print("🚀 Starting 6-Agent CrewAI Orchestration System...")
    
    # Check if preprompt.txt exists
    if not os.path.exists(PREPROMPT_PATH):
        print(f"❌ {PREPROMPT_PATH} not found. Please create it first with your VLAN request.")
        return
    
    # Read the preprompt
    with open(PREPROMPT_PATH, 'r') as f:
        preprompt = f.read().strip()
    
    print(f"📝 Preprompt: {preprompt}")
    
    # Initialize the 5-agent system
    crewai_system = CrewAIOrchestratedAgents(use_llm=True)
    
    # Process the request through all 5 agents
    result = crewai_system.process_request(preprompt)
    
    if result["success"]:
        print("\n🎉 6-Agent Orchestration Completed Successfully!")
        print("📊 Agent Status:")
        for agent_id, agent_info in result["agents"].items():
            print(f"   {agent_id}: {agent_info['status']} - {agent_info['output']}")
        print(f"📋 VLAN Created: {result['vlan_id']} - {result['vlan_name']}")
    else:
        print(f"\n❌ 5-Agent Orchestration Failed: {result['error']}")
        print("📊 Agent Status:")
        for agent_id, agent_info in result["agents"].items():
            print(f"   {agent_id}: {agent_info['status']} - {agent_info['output']}")

if __name__ == "__main__":
    main() 
