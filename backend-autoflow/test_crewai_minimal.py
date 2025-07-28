from crewai import Agent, Task, Crew, BaseTool
from langchain_ollama import OllamaLLM

# Initialize Ollama LLM
llm = OllamaLLM(model="llama3:latest", base_url="http://localhost:11434")

class HelloTool(BaseTool):
    name: str = "hello_tool"
    description: str = "Say hello to the user"

    def _run(self, input_text: str) -> str:
        return f"Hello, {input_text}!"

agent = Agent(
    role="Greeter",
    goal="Say hello to the user.",
    backstory="You are a friendly agent.",
    llm=llm,  # Add the LLM here
    tools=[HelloTool()]
)

task = Task(
    description="Say hello to Sarra.",
    agent=agent
)

crew = Crew(
    agents=[agent],
    tasks=[task],
    verbose=True
)

if __name__ == "__main__":
    result = crew.kickoff()
    print(result)
