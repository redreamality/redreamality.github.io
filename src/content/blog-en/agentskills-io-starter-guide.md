---
title: 'How to Build AI Agents with Skills and Tools: Complete 2025 Beginner Guide'
pubDate: 2025-01-15T10:00:00.000Z
description: 'Learn how to build intelligent AI agents with practical skills and tools. Complete beginner-friendly tutorial covering agent skills, tool integration, computer use, file operations, and real-world examples using Claude and OpenAI.'
author: 'Remy'
tags: ['AI', 'agents', 'tutorial', 'beginner-guide', 'claude', 'openai', 'llm', 'automation']
lang: 'en'
---

## What Are AI Agent Skills?

AI agent skills (also called "tools" or "functions") are capabilities that enable language models to interact with the real world and perform actions beyond text generation. Instead of just responding with text, agents equipped with skills can:

- **Execute code** to perform calculations or data analysis
- **Access files** to read, write, and manage documents
- **Search the web** for real-time information
- **Interact with APIs** to integrate with external services
- **Control computers** to automate desktop tasks
- **Manage databases** to store and retrieve data

In 2025, major AI providers like Anthropic (Claude), OpenAI (GPT), and Google (Gemini) all support agent skills through various mechanisms:

- **Claude**: Computer use, bash tool, text editor tool
- **OpenAI**: Function calling, code interpreter, file search
- **Open-source**: LangChain tools, AutoGPT, custom implementations

## Why Agent Skills Matter in 2025

### The Evolution from Chatbots to Agents

Traditional chatbots (2022-2023):
- ✅ Answer questions with pre-trained knowledge
- ✅ Generate human-like text
- ❌ Cannot access current information
- ❌ Cannot perform actions
- ❌ Limited to conversational responses

Modern AI agents (2024-2025):
- ✅ Everything chatbots can do
- ✅ Execute real-world tasks
- ✅ Access real-time data
- ✅ Integrate with your tools and workflows
- ✅ Operate autonomously with minimal supervision

### Real-World Impact

Consider these practical scenarios:

**Before agent skills:**
- User: "Analyze this CSV file and create a summary report"
- AI: "I can't actually open files, but here's how you could do it..."

**With agent skills:**
- User: "Analyze this CSV file and create a summary report"
- AI: *Opens file, reads data, performs analysis, generates charts, creates PDF report*
- Result: Complete report delivered in seconds

## Core Concepts: Understanding AI Agents and Tools

### The Agent Loop

AI agents follow a continuous decision-making loop:

```
1. Perceive → Understand user request and context
2. Plan    → Decide what actions to take
3. Act     → Execute using available tools
4. Observe → Evaluate results
5. Repeat  → Continue until task complete
```

Example conversation:
```
User: "Find the latest AI news and email me a summary"

Agent thinking:
1. Perceive: User wants news + email delivery
2. Plan: I need to use web_search tool, then email tool
3. Act: Execute web_search("latest AI news 2025")
4. Observe: Got 10 relevant articles
5. Plan: Summarize articles, then use email tool
6. Act: Send email with summary
7. Done: Confirm to user
```

### Skills vs. Tools vs. Functions (Terminology)

The AI industry uses these terms somewhat interchangeably:

| Term | Definition | Example |
|------|------------|---------|
| **Tool** | A capability the agent can invoke | `web_search`, `file_reader`, `calculator` |
| **Function** | The implementation of a tool (technical term) | JavaScript function, API endpoint |
| **Skill** | Higher-level capability (may use multiple tools) | "Research assistant" uses search + summarize + write |
| **Action** | A single invocation of a tool | Calling `web_search("AI trends")` |

In this guide, we'll use "tools" and "skills" interchangeably.

## Official AI Agent Skills: What's Available

### Claude's Official Tools (Anthropic)

As of 2025, Claude offers three powerful built-in tools:

#### 1. Computer Use (`computer_20241022`)
Allows Claude to interact with a computer like a human:
- Control mouse and keyboard
- Take screenshots and analyze UI
- Navigate applications
- Fill forms, click buttons, browse web

**Use cases:**
- Automated testing
- Web scraping
- Desktop automation
- UI interaction

**Example:**
```python
import anthropic

client = anthropic.Anthropic(api_key="your-api-key")

response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "computer_20241022",
            "name": "computer",
            "display_width_px": 1920,
            "display_height_px": 1080,
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "Open a browser and search for the latest AI news"
        }
    ]
)
```

#### 2. Bash Tool (`bash_20241022`)
Execute bash commands in a secure environment:
- Run shell scripts
- Install packages
- Process files with CLI tools
- System operations

**Use cases:**
- DevOps automation
- File processing
- Data transformation
- System administration

**Example:**
```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "bash_20241022",
            "name": "bash",
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "List all Python files in the current directory and count lines of code"
        }
    ]
)
```

#### 3. Text Editor (`text_editor_20241022`)
Create and edit files with precision:
- View file contents
- Edit specific lines
- Create new files
- String replacement

**Use cases:**
- Code editing
- Configuration management
- Document generation
- Automated refactoring

**Example:**
```python
response = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    tools=[
        {
            "type": "text_editor_20241022",
            "name": "str_replace_editor",
        }
    ],
    messages=[
        {
            "role": "user",
            "content": "Create a Python script that fetches weather data from an API"
        }
    ]
)
```

### OpenAI's Function Calling

OpenAI's GPT models support custom function calling:

```javascript
const functions = [
  {
    name: "get_weather",
    description: "Get current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "City name, e.g., San Francisco"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"]
        }
      },
      required: ["location"]
    }
  }
];

const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [
    { role: "user", content: "What's the weather in Tokyo?" }
  ],
  functions: functions,
  function_call: "auto"
});

// If GPT wants to call a function, it returns:
// {
//   "name": "get_weather",
//   "arguments": "{\"location\": \"Tokyo\", \"unit\": \"celsius\"}"
// }

// You then execute the function and return results to GPT
```

### Popular Open-Source Tool Frameworks

#### LangChain Tools
LangChain provides 100+ pre-built tools:

```python
from langchain.agents import load_tools, initialize_agent
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

# Load built-in tools
tools = load_tools(
    ["wikipedia", "llm-math", "python_repl"],
    llm=llm
)

agent = initialize_agent(
    tools,
    llm,
    agent="zero-shot-react-description",
    verbose=True
)

# Use the agent
agent.run("What's the population of Tokyo? Calculate 10% of that number.")
```

**Available LangChain tools:**
- Wikipedia search
- Google search
- WolframAlpha
- Python REPL
- Shell commands
- SQL database
- HTTP requests
- File operations
- And 90+ more...

## Building Your First AI Agent with Skills

Let's build a practical research assistant agent step by step.

### Prerequisites

1. **Python 3.8+** installed
2. **API key** from Anthropic or OpenAI
3. **Basic Python knowledge**
4. Install required packages:

```bash
pip install anthropic openai python-dotenv requests beautifulsoup4
```

### Step 1: Define Your Tools

First, create custom tools for your agent:

```python
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def web_search(query: str, num_results: int = 5) -> list:
    """
    Search the web for information.
    
    Args:
        query: Search query string
        num_results: Number of results to return
    
    Returns:
        List of search results with title, URL, and snippet
    """
    # Using a search API (example with DuckDuckGo)
    try:
        url = f"https://html.duckduckgo.com/html/?q={query}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        results = []
        for result in soup.find_all('div', class_='result')[:num_results]:
            title = result.find('a', class_='result__a')
            snippet = result.find('a', class_='result__snippet')
            
            if title and snippet:
                results.append({
                    'title': title.text,
                    'url': title['href'],
                    'snippet': snippet.text
                })
        
        return results
    except Exception as e:
        return [{"error": str(e)}]

def save_to_file(content: str, filename: str) -> str:
    """
    Save content to a file.
    
    Args:
        content: Text content to save
        filename: Name of file to create
    
    Returns:
        Success message with file path
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"✅ Content saved to {filename}"
    except Exception as e:
        return f"❌ Error saving file: {str(e)}"

def calculate(expression: str) -> str:
    """
    Safely evaluate mathematical expressions.
    
    Args:
        expression: Math expression like "2 + 2" or "10 * 5"
    
    Returns:
        Result of calculation
    """
    try:
        # Safe eval - only allow numbers and basic operators
        allowed = set('0123456789+-*/(). ')
        if not all(c in allowed for c in expression):
            return "Error: Invalid characters in expression"
        
        result = eval(expression)
        return f"{expression} = {result}"
    except Exception as e:
        return f"Error: {str(e)}"
```

### Step 2: Create the Agent with OpenAI

```python
import openai
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Define function schemas
functions = [
    {
        "name": "web_search",
        "description": "Search the web for current information on a topic",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return (default 5)"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "Save text content to a file",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The content to save"
                },
                "filename": {
                    "type": "string",
                    "description": "Name of the file to create"
                }
            },
            "required": ["content", "filename"]
        }
    },
    {
        "name": "calculate",
        "description": "Perform mathematical calculations",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "Mathematical expression to evaluate"
                }
            },
            "required": ["expression"]
        }
    }
]

# Map function names to actual functions
available_functions = {
    "web_search": web_search,
    "save_to_file": save_to_file,
    "calculate": calculate
}

def run_agent(user_message: str) -> str:
    """
    Run the agent with tool support.
    """
    messages = [
        {
            "role": "system",
            "content": """You are a helpful research assistant with access to tools.
            When the user asks for information, use web_search to find current data.
            When asked to save information, use save_to_file.
            For calculations, use the calculate tool.
            
            Always explain what you're doing and provide clear, helpful responses."""
        },
        {
            "role": "user",
            "content": user_message
        }
    ]
    
    # Agent loop - allow up to 5 tool calls
    for _ in range(5):
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            functions=functions,
            function_call="auto"
        )
        
        message = response.choices[0].message
        
        # If no function call, we're done
        if not message.function_call:
            return message.content
        
        # Execute the function
        function_name = message.function_call.name
        function_args = json.loads(message.function_call.arguments)
        
        print(f"🔧 Calling {function_name} with args: {function_args}")
        
        function_result = available_functions[function_name](**function_args)
        
        # Add function call and result to conversation
        messages.append({
            "role": "assistant",
            "content": None,
            "function_call": {
                "name": function_name,
                "arguments": message.function_call.arguments
            }
        })
        messages.append({
            "role": "function",
            "name": function_name,
            "content": str(function_result)
        })
    
    return "Agent reached maximum iterations"

# Test the agent
if __name__ == "__main__":
    result = run_agent(
        "Search for the latest AI agent developments in 2025, "
        "summarize the top 3 findings, and save the summary to a file."
    )
    print("\n📋 Agent Response:")
    print(result)
```

### Step 3: Create the Same Agent with Claude

```python
import anthropic
import json

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Claude uses a different format for tools
claude_tools = [
    {
        "name": "web_search",
        "description": "Search the web for current information on a topic",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                },
                "num_results": {
                    "type": "integer",
                    "description": "Number of results to return",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "Save text content to a file",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {"type": "string"},
                "filename": {"type": "string"}
            },
            "required": ["content", "filename"]
        }
    },
    {
        "name": "calculate",
        "description": "Perform mathematical calculations",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {"type": "string"}
            },
            "required": ["expression"]
        }
    }
]

def run_claude_agent(user_message: str) -> str:
    """
    Run agent with Claude.
    """
    messages = [{"role": "user", "content": user_message}]
    
    # Agent loop
    for _ in range(5):
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            tools=claude_tools,
            messages=messages
        )
        
        # Check if Claude wants to use a tool
        if response.stop_reason == "tool_use":
            # Add assistant's response to messages
            messages.append({
                "role": "assistant",
                "content": response.content
            })
            
            # Execute each tool call
            tool_results = []
            for content_block in response.content:
                if content_block.type == "tool_use":
                    tool_name = content_block.name
                    tool_input = content_block.input
                    
                    print(f"🔧 Claude calling {tool_name} with: {tool_input}")
                    
                    # Execute the tool
                    result = available_functions[tool_name](**tool_input)
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": content_block.id,
                        "content": str(result)
                    })
            
            # Send tool results back to Claude
            messages.append({
                "role": "user",
                "content": tool_results
            })
        else:
            # No more tool calls, return final response
            return response.content[0].text
    
    return "Agent reached maximum iterations"

# Test Claude agent
if __name__ == "__main__":
    result = run_claude_agent(
        "Research the latest developments in AI agents for 2025 and create a brief summary."
    )
    print("\n📋 Claude's Response:")
    print(result)
```

## Advanced Agent Skills and Patterns

### Multi-Step Workflows

For complex tasks, agents need to chain multiple tools together:

```python
def research_and_publish_workflow(topic: str) -> str:
    """
    Complete workflow: research → analyze → summarize → save → email
    """
    steps = [
        f"1. Search for '{topic}' and gather information",
        f"2. Analyze and extract key insights",
        f"3. Create a comprehensive summary",
        f"4. Save summary to file: {topic.replace(' ', '-')}.md",
        f"5. Confirm completion"
    ]
    
    prompt = f"""Execute this research workflow:
    
    Topic: {topic}
    
    Steps:
    {chr(10).join(steps)}
    
    Use your tools to complete each step methodically."""
    
    return run_agent(prompt)

# Usage
result = research_and_publish_workflow("AI Agent Frameworks 2025")
```

### Error Handling and Retries

Make your agents more robust:

```python
def safe_tool_execution(tool_func, args, max_retries=3):
    """
    Execute a tool with automatic retries.
    """
    for attempt in range(max_retries):
        try:
            result = tool_func(**args)
            return {"success": True, "result": result}
        except Exception as e:
            if attempt == max_retries - 1:
                return {
                    "success": False,
                    "error": str(e),
                    "message": f"Failed after {max_retries} attempts"
                }
            print(f"⚠️ Attempt {attempt + 1} failed: {e}. Retrying...")
            time.sleep(2 ** attempt)  # Exponential backoff
```

### Tool Access Control

Limit what your agent can do for security:

```python
class SafeAgent:
    def __init__(self, allowed_tools=None, restricted_paths=None):
        self.allowed_tools = allowed_tools or []
        self.restricted_paths = restricted_paths or ['/etc', '/sys', '/root']
    
    def can_use_tool(self, tool_name: str) -> bool:
        """Check if tool is allowed."""
        return tool_name in self.allowed_tools
    
    def validate_file_path(self, path: str) -> bool:
        """Check if file path is allowed."""
        abs_path = os.path.abspath(path)
        for restricted in self.restricted_paths:
            if abs_path.startswith(restricted):
                return False
        return True
    
    def execute_tool(self, tool_name: str, args: dict):
        """Safely execute a tool with validation."""
        if not self.can_use_tool(tool_name):
            return {"error": f"Tool '{tool_name}' is not allowed"}
        
        # Validate file paths if present
        if 'filename' in args or 'path' in args:
            path = args.get('filename') or args.get('path')
            if not self.validate_file_path(path):
                return {"error": f"Access to '{path}' is restricted"}
        
        # Execute the tool
        return available_functions[tool_name](**args)

# Usage
safe_agent = SafeAgent(
    allowed_tools=['web_search', 'calculate'],
    restricted_paths=['/etc', '/sys', '~/.ssh']
)
```

### Logging and Observability

Track your agent's actions:

```python
import logging
from datetime import datetime

class AgentLogger:
    def __init__(self, agent_name: str):
        self.agent_name = agent_name
        self.log_file = f"agent_{agent_name}_{datetime.now().strftime('%Y%m%d')}.log"
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(self.log_file),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(agent_name)
    
    def log_tool_call(self, tool_name: str, args: dict, result: any):
        """Log each tool execution."""
        self.logger.info(f"Tool: {tool_name} | Args: {args}")
        self.logger.info(f"Result: {result}")
    
    def log_user_request(self, request: str):
        """Log user requests."""
        self.logger.info(f"User Request: {request}")
    
    def log_agent_response(self, response: str):
        """Log agent responses."""
        self.logger.info(f"Agent Response: {response}")
    
    def log_error(self, error: Exception):
        """Log errors."""
        self.logger.error(f"Error: {str(error)}", exc_info=True)

# Usage
logger = AgentLogger("research_assistant")
logger.log_user_request("Search for AI news")
logger.log_tool_call("web_search", {"query": "AI news"}, search_results)
```

## Real-World Use Cases and Examples

### 1. Customer Support Agent

```python
def customer_support_agent():
    """
    Agent that can search knowledge base, create tickets, and send emails.
    """
    tools = [
        {
            "name": "search_knowledge_base",
            "description": "Search internal documentation for solutions"
        },
        {
            "name": "create_ticket",
            "description": "Create a support ticket for escalation"
        },
        {
            "name": "send_email",
            "description": "Send email to customer"
        },
        {
            "name": "check_order_status",
            "description": "Look up order status in database"
        }
    ]
    
    system_prompt = """You are a customer support agent. Your goals:
    1. Understand the customer's issue clearly
    2. Search the knowledge base for solutions
    3. If you can solve it, provide clear steps
    4. If you can't, create a ticket and notify the customer
    5. Always be empathetic and professional
    """
    
    return create_agent(tools, system_prompt)
```

### 2. Data Analysis Agent

```python
def data_analyst_agent():
    """
    Agent that can query databases, create visualizations, and generate reports.
    """
    tools = [
        {
            "name": "query_database",
            "description": "Execute SQL queries on the database"
        },
        {
            "name": "create_chart",
            "description": "Generate charts and visualizations"
        },
        {
            "name": "calculate_statistics",
            "description": "Compute statistical measures"
        },
        {
            "name": "export_to_excel",
            "description": "Export data to Excel spreadsheet"
        }
    ]
    
    system_prompt = """You are a data analyst. When asked to analyze data:
    1. Query the database to retrieve relevant data
    2. Perform statistical analysis
    3. Create appropriate visualizations
    4. Summarize insights in plain language
    5. Export results if requested
    """
    
    return create_agent(tools, system_prompt)
```

### 3. DevOps Automation Agent

```python
def devops_agent():
    """
    Agent that can monitor servers, deploy code, and manage infrastructure.
    """
    tools = [
        {
            "name": "check_server_health",
            "description": "Monitor server metrics (CPU, memory, disk)"
        },
        {
            "name": "deploy_application",
            "description": "Deploy code to production"
        },
        {
            "name": "restart_service",
            "description": "Restart a system service"
        },
        {
            "name": "analyze_logs",
            "description": "Search and analyze log files"
        },
        {
            "name": "send_alert",
            "description": "Send alerts to on-call team"
        }
    ]
    
    system_prompt = """You are a DevOps agent. Your responsibilities:
    1. Monitor system health continuously
    2. Detect anomalies and potential issues
    3. Take corrective actions when possible
    4. Escalate critical issues to humans
    5. Document all actions taken
    """
    
    return create_agent(tools, system_prompt)
```

## Best Practices for Production Agents

### 1. Design Clear Tool Descriptions

```python
# ❌ Bad: Vague description
{
    "name": "search",
    "description": "Search for stuff"
}

# ✅ Good: Clear, specific description
{
    "name": "web_search",
    "description": """Search the internet for current information using a web search engine.
    Use this when the user asks for recent news, current events, or information
    that may have changed since your training data cutoff.
    
    Returns: List of search results with title, URL, and snippet.""",
    "parameters": {
        "query": "Specific search query (be precise)",
        "num_results": "Number of results to return (1-10)"
    }
}
```

### 2. Implement Rate Limiting

```python
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimiter:
    def __init__(self, max_calls: int, time_window: int):
        self.max_calls = max_calls
        self.time_window = time_window  # seconds
        self.calls = defaultdict(list)
    
    def can_call(self, tool_name: str) -> bool:
        """Check if tool can be called."""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.time_window)
        
        # Remove old calls
        self.calls[tool_name] = [
            call_time for call_time in self.calls[tool_name]
            if call_time > cutoff
        ]
        
        return len(self.calls[tool_name]) < self.max_calls
    
    def record_call(self, tool_name: str):
        """Record a tool call."""
        self.calls[tool_name].append(datetime.now())

# Usage
rate_limiter = RateLimiter(max_calls=10, time_window=60)

if rate_limiter.can_call("web_search"):
    result = web_search("AI news")
    rate_limiter.record_call("web_search")
else:
    print("Rate limit exceeded. Please wait.")
```

### 3. Add Caching for Expensive Operations

```python
from functools import lru_cache
import hashlib
import json

class ToolCache:
    def __init__(self, ttl: int = 3600):
        self.cache = {}
        self.ttl = ttl  # Time to live in seconds
    
    def _make_key(self, tool_name: str, args: dict) -> str:
        """Create cache key from tool name and arguments."""
        args_str = json.dumps(args, sort_keys=True)
        return hashlib.md5(f"{tool_name}:{args_str}".encode()).hexdigest()
    
    def get(self, tool_name: str, args: dict):
        """Get cached result if available and not expired."""
        key = self._make_key(tool_name, args)
        if key in self.cache:
            result, timestamp = self.cache[key]
            if datetime.now().timestamp() - timestamp < self.ttl:
                print(f"✨ Cache hit for {tool_name}")
                return result
        return None
    
    def set(self, tool_name: str, args: dict, result):
        """Cache a result."""
        key = self._make_key(tool_name, args)
        self.cache[key] = (result, datetime.now().timestamp())

# Usage
cache = ToolCache(ttl=300)  # 5 minutes

def cached_web_search(query: str):
    # Check cache first
    cached = cache.get("web_search", {"query": query})
    if cached:
        return cached
    
    # Execute search
    result = web_search(query)
    
    # Cache result
    cache.set("web_search", {"query": query}, result)
    return result
```

### 4. Monitor Agent Performance

```python
import time
from dataclasses import dataclass, field
from typing import List

@dataclass
class AgentMetrics:
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    tool_calls: dict = field(default_factory=dict)
    average_response_time: float = 0.0
    response_times: List[float] = field(default_factory=list)
    
    def record_request(self, success: bool, response_time: float, tools_used: List[str]):
        """Record metrics for a request."""
        self.total_requests += 1
        
        if success:
            self.successful_requests += 1
        else:
            self.failed_requests += 1
        
        self.response_times.append(response_time)
        self.average_response_time = sum(self.response_times) / len(self.response_times)
        
        for tool in tools_used:
            self.tool_calls[tool] = self.tool_calls.get(tool, 0) + 1
    
    def get_success_rate(self) -> float:
        """Calculate success rate."""
        if self.total_requests == 0:
            return 0.0
        return (self.successful_requests / self.total_requests) * 100
    
    def print_summary(self):
        """Print metrics summary."""
        print("\n📊 Agent Metrics Summary")
        print(f"Total Requests: {self.total_requests}")
        print(f"Success Rate: {self.get_success_rate():.2f}%")
        print(f"Average Response Time: {self.average_response_time:.2f}s")
        print(f"\nTool Usage:")
        for tool, count in sorted(self.tool_calls.items(), key=lambda x: x[1], reverse=True):
            print(f"  {tool}: {count} calls")

# Usage
metrics = AgentMetrics()

def monitored_agent_run(user_message: str):
    start_time = time.time()
    tools_used = []
    success = False
    
    try:
        result = run_agent(user_message)
        success = True
        return result
    except Exception as e:
        print(f"Error: {e}")
        raise
    finally:
        response_time = time.time() - start_time
        metrics.record_request(success, response_time, tools_used)

# After running many requests
metrics.print_summary()
```

## Troubleshooting Common Issues

### Issue 1: Agent Not Using Tools

**Symptoms:**
- Agent responds with text only
- No function calls are made
- Agent says "I don't have access to that"

**Solutions:**

1. **Check system prompt** - Explicitly instruct the agent to use tools:
```python
system_prompt = """You MUST use the available tools to complete tasks.
When the user asks for information you don't have, use web_search.
When asked to save data, use save_to_file.
Do NOT make up information or refuse tasks you have tools for."""
```

2. **Verify function descriptions** - Make them clear and specific:
```python
# Bad
"description": "Search"

# Good
"description": "Search the internet for current information. Use this when you need real-time data."
```

3. **Check model capabilities** - Ensure your model supports function calling:
- ✅ GPT-4, GPT-3.5-turbo (June 2023+)
- ✅ Claude 3 Opus, Sonnet, Haiku
- ✅ Gemini Pro
- ❌ Older models may not support tools

### Issue 2: Tool Execution Errors

**Symptoms:**
- Functions fail with exceptions
- Timeouts or network errors
- Invalid parameters

**Solutions:**

```python
def robust_tool_execution(tool_func, args):
    """Execute tool with comprehensive error handling."""
    try:
        # Validate parameters
        if not args:
            return {"error": "No arguments provided"}
        
        # Set timeout
        import signal
        signal.alarm(30)  # 30 second timeout
        
        # Execute
        result = tool_func(**args)
        
        # Cancel timeout
        signal.alarm(0)
        
        return {"success": True, "result": result}
        
    except TypeError as e:
        return {"error": f"Invalid parameters: {e}"}
    except requests.Timeout:
        return {"error": "Request timed out"}
    except Exception as e:
        return {"error": f"Unexpected error: {e}"}
```

### Issue 3: Agent Loops Infinitely

**Symptoms:**
- Agent keeps calling the same tool
- Never reaches a conclusion
- Exceeds max iterations

**Solutions:**

1. **Limit iterations** in your agent loop:
```python
MAX_ITERATIONS = 10  # Prevent infinite loops

for iteration in range(MAX_ITERATIONS):
    if iteration == MAX_ITERATIONS - 1:
        return "Task too complex. Breaking into simpler steps may help."
```

2. **Track tool calls** and prevent repetition:
```python
recent_calls = []

def should_allow_call(tool_name, args):
    """Prevent repeated identical calls."""
    call_signature = (tool_name, json.dumps(args, sort_keys=True))
    
    if call_signature in recent_calls[-3:]:  # Last 3 calls
        return False, "Tool called too recently with same arguments"
    
    recent_calls.append(call_signature)
    return True, None
```

3. **Improve prompts** to be more decisive:
```python
system_prompt = """Complete the task efficiently:
1. Gather information with ONE tool call
2. Process and analyze
3. Provide final answer
4. Do NOT repeat tool calls with the same parameters"""
```

## Security Best Practices

### 1. Input Sanitization

```python
import re

def sanitize_input(user_input: str) -> str:
    """Remove potentially dangerous input."""
    # Remove shell command characters
    dangerous_chars = [';', '|', '&', '$', '`', '\n', '\r']
    for char in dangerous_chars:
        user_input = user_input.replace(char, '')
    
    # Limit length
    if len(user_input) > 10000:
        raise ValueError("Input too long")
    
    return user_input

def validate_file_path(path: str) -> bool:
    """Ensure file path is safe."""
    # Prevent directory traversal
    if '..' in path or path.startswith('/'):
        return False
    
    # Only allow certain extensions
    allowed_extensions = ['.txt', '.md', '.json', '.csv']
    if not any(path.endswith(ext) for ext in allowed_extensions):
        return False
    
    return True
```

### 2. Credential Management

```python
import os
from pathlib import Path

class SecureConfig:
    """Manage API keys and secrets securely."""
    
    def __init__(self):
        self.secrets = {}
        self._load_from_env()
    
    def _load_from_env(self):
        """Load secrets from environment variables."""
        required_keys = [
            'OPENAI_API_KEY',
            'ANTHROPIC_API_KEY',
            'DATABASE_URL'
        ]
        
        for key in required_keys:
            value = os.getenv(key)
            if value:
                self.secrets[key] = value
            else:
                print(f"⚠️ Warning: {key} not found in environment")
    
    def get(self, key: str) -> str:
        """Safely get a secret."""
        if key not in self.secrets:
            raise ValueError(f"Secret '{key}' not configured")
        return self.secrets[key]
    
    def mask_secret(self, secret: str) -> str:
        """Mask secret for logging."""
        if len(secret) <= 8:
            return "****"
        return f"{secret[:4]}...{secret[-4:]}"

# Usage
config = SecureConfig()
api_key = config.get('OPENAI_API_KEY')
print(f"Using API key: {config.mask_secret(api_key)}")
```

### 3. Sandboxing Tool Execution

```python
import subprocess
import tempfile
import os

class SandboxedExecutor:
    """Execute code in a sandboxed environment."""
    
    def __init__(self):
        self.temp_dir = tempfile.mkdtemp()
    
    def execute_python(self, code: str, timeout: int = 30):
        """Execute Python code safely."""
        # Create temporary file
        code_file = os.path.join(self.temp_dir, 'script.py')
        with open(code_file, 'w') as f:
            f.write(code)
        
        try:
            # Execute in subprocess with restrictions
            result = subprocess.run(
                ['python3', code_file],
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=self.temp_dir,  # Restrict to temp directory
                env={'HOME': self.temp_dir}  # Isolated environment
            )
            
            return {
                'stdout': result.stdout,
                'stderr': result.stderr,
                'returncode': result.returncode
            }
        except subprocess.TimeoutExpired:
            return {'error': 'Execution timeout'}
        except Exception as e:
            return {'error': str(e)}
        finally:
            # Cleanup
            if os.path.exists(code_file):
                os.remove(code_file)
```

## Performance Optimization Tips

### 1. Parallel Tool Execution

For independent tools, execute in parallel:

```python
import asyncio

async def parallel_agent_tasks(tasks: List[dict]):
    """Execute multiple tool calls in parallel."""
    
    async def execute_task(task):
        tool_name = task['tool']
        args = task['args']
        return await async_tool_execution(tool_name, args)
    
    # Run all tasks concurrently
    results = await asyncio.gather(*[execute_task(t) for t in tasks])
    return results

# Usage
tasks = [
    {'tool': 'web_search', 'args': {'query': 'AI news'}},
    {'tool': 'web_search', 'args': {'query': 'ML news'}},
    {'tool': 'calculate', 'args': {'expression': '100 * 2'}}
]

results = asyncio.run(parallel_agent_tasks(tasks))
```

### 2. Streaming Responses

For better UX, stream agent responses:

```python
def stream_agent_response(user_message: str):
    """Stream agent responses token by token."""
    
    response = openai.chat.completions.create(
        model="gpt-4",
        messages=[{"role": "user", "content": user_message}],
        stream=True
    )
    
    print("🤖 Agent: ", end="", flush=True)
    for chunk in response:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print()

# Usage
stream_agent_response("Explain AI agents in simple terms")
```

### 3. Optimize Tool Response Size

```python
def efficient_web_search(query: str, max_results: int = 5):
    """Return concise search results."""
    results = web_search(query, max_results)
    
    # Truncate long snippets
    for result in results:
        if len(result['snippet']) > 200:
            result['snippet'] = result['snippet'][:200] + "..."
    
    # Return only essential fields
    return [
        {
            'title': r['title'],
            'url': r['url'],
            'snippet': r['snippet']
        }
        for r in results
    ]
```

## Conclusion: The Future of AI Agents

AI agent skills are transforming how we interact with AI systems. In 2025 and beyond, we'll see:

### Emerging Trends

1. **Multi-modal agents**: Combining vision, audio, and text
2. **Long-running agents**: Agents that work on tasks for hours or days
3. **Agent collaboration**: Multiple agents working together
4. **Improved reasoning**: Better planning and decision-making
5. **Domain-specific agents**: Specialized agents for medicine, law, engineering

### Getting Started Today

1. **Start simple**: Pick 2-3 tools and build a basic agent
2. **Choose your tools**: Use Claude's built-in tools or OpenAI's function calling
3. **Test thoroughly**: Ensure reliability before production
4. **Monitor closely**: Track performance and errors
5. **Iterate rapidly**: Improve based on real usage

### Key Takeaways

✅ **Agent skills = Real-world actions**: Moving beyond text generation
✅ **Multiple approaches available**: Claude, OpenAI, LangChain all support tools
✅ **Start with existing tools**: Don't build everything from scratch
✅ **Security is critical**: Sanitize inputs, limit permissions, sandbox execution
✅ **Monitor and optimize**: Track metrics and improve continuously

The future is agentic - AI systems that can actually help us accomplish tasks, not just answer questions. Start building your intelligent agents today!

---

## Additional Resources

### Official Documentation
- **Claude Agent Skills**: [docs.anthropic.com/en/docs/agents-and-tools](https://docs.anthropic.com/en/docs/agents-and-tools)
- **OpenAI Function Calling**: [platform.openai.com/docs/guides/function-calling](https://platform.openai.com/docs/guides/function-calling)
- **LangChain Tools**: [python.langchain.com/docs/modules/agents/tools](https://python.langchain.com/docs/modules/agents/tools)

### Open Source Projects
- **AutoGPT**: Autonomous AI agent framework
- **LangChain**: Building applications with LLMs
- **Semantic Kernel**: Microsoft's agent framework
- **CrewAI**: Multi-agent orchestration

### Community
- **r/artificial**: Reddit community for AI discussion
- **LangChain Discord**: Active developer community
- **Anthropic Claude Discord**: Official Claude community

Happy building! 🤖✨

