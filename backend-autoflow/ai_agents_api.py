from flask import Flask, jsonify, request
from crewai import Agent, Crew, Task
from langchain_community.llms import Ollama

app = Flask(__name__)

# Set up local LLM via Ollama (make sure Ollama is running with this model)
llm = Ollama(model="llama2:7b", base_url="http://localhost:11434")  # Using smaller 7B model

# Define agents
monitoring_agent = Agent(
    role="MonitoringAgent",
    goal="Monitor system logs and report anomalies.",
    backstory="You are responsible for real-time monitoring of the platform.",
    llm=llm,
)

automation_agent = Agent(
    role="AutomationAgent",
    goal="Automate network tasks such as VLAN creation.",
    backstory="You handle network automation tasks for the platform.",
    llm=llm,
)

# Define tasks for the agents
def get_monitoring_task():
    return Task(
        description="Check the latest monitoring logs and summarize any issues.",
        agent=monitoring_agent,
        expected_output="A summary of monitoring status and any detected issues."
    )

def get_automation_task():
    return Task(
        description="Simulate creating a VLAN and report the result.",
        agent=automation_agent,
        expected_output="A report of the VLAN creation simulation with status and details."
    )

@app.route("/run_agents", methods=["POST"])
def run_agents():
    # Create new tasks each time to avoid CrewAI reuse issues
    monitoring_task = get_monitoring_task()
    automation_task = get_automation_task()
    crew = Crew(
        agents=[monitoring_agent, automation_agent],
        tasks=[monitoring_task, automation_task],
        verbose=True,
    )
    result = crew.kickoff()
    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(port=5001, debug=True) 