from crewai import Agent, Task, Crew
from langchain_community.llms import Ollama

# Test LangChain Ollama first
print("Testing LangChain Ollama...")
llm = Ollama(model="phi3:mini", base_url="http://localhost:11434")
try:
    response = llm("Say hello!")
    print(f"LangChain Ollama works: {response}")
except Exception as e:
    print(f"LangChain Ollama failed: {e}")
    exit(1)

# Test CrewAI with LangChain Ollama
print("\nTesting CrewAI with LangChain Ollama...")
agent = Agent(
    role="TestAgent",
    goal="Test LLM connection.",
    backstory="You are a test agent.",
    llm=llm,
)

task = Task(
    description="Say hello.",
    agent=agent,
    expected_output="A greeting."
)

crew = Crew(
    agents=[agent],
    tasks=[task],
    verbose=True,
)

try:
    result = crew.kickoff()
    print(f"CrewAI works: {result}")
except Exception as e:
    print(f"CrewAI failed: {e}")
    import traceback
    traceback.print_exc() 