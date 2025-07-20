from langchain_community.llms import Ollama

# Test Ollama connection
llm = Ollama(model="ollama/llama2", base_url="http://localhost:11434")
print("Testing Ollama connection...")
try:
    response = llm("Say hello!")
    print(f"Success! Response: {response}")
except Exception as e:
    print(f"Error: {e}") 