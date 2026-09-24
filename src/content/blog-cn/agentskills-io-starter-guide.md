---
title: '如何使用技能和工具构建 AI 代理：2026 完整新手指南'
pubDate: 2026-01-15T10:00:00.000Z
description: '学习如何使用实用技能和工具构建智能 AI 代理。包含代理技能、工具集成、计算机使用、文件操作和 Claude、OpenAI 实际示例的完整新手友好教程。'
author: 'Remy'
tags: ['ai', 'ai-agents', 'tutorial', 'beginner-guide', 'claude', 'openai', 'llm', 'automation']
lang: 'zh'
translatedFrom: 'agentskills-io-starter-guide'
---

## 什么是 AI 代理技能？

AI 代理技能（也称为"工具"或"函数"）是使语言模型能够与现实世界交互并执行文本生成之外操作的能力。与仅用文本响应不同，配备技能的代理可以：

- **执行代码**进行计算或数据分析
- **访问文件**读取、写入和管理文档
- **搜索网络**获取实时信息
- **与 API 交互**集成外部服务
- **控制计算机**自动化桌面任务
- **管理数据库**存储和检索数据

在 2026 年，Anthropic（Claude）、OpenAI（GPT）和 Google（Gemini）等主要 AI 提供商都通过各种机制支持代理技能：

- **Claude**：计算机使用、bash 工具、文本编辑器工具
- **OpenAI**：函数调用、代码解释器、文件搜索
- **开源**：LangChain 工具、AutoGPT、自定义实现

## 为什么代理技能在 2026 年很重要

### 从聊天机器人到代理的演变

传统聊天机器人（2022-2023）：
- ✅ 用预训练知识回答问题
- ✅ 生成类人文本
- ❌ 无法访问当前信息
- ❌ 无法执行操作
- ❌ 仅限于对话响应

现代 AI 代理（2024-2026）：
- ✅ 聊天机器人能做的一切
- ✅ 执行实际任务
- ✅ 访问实时数据
- ✅ 与你的工具和工作流集成
- ✅ 在最少监督下自主运行

### 现实世界的影响

考虑这些实际场景：

**代理技能之前：**
- 用户："分析这个 CSV 文件并创建摘要报告"
- AI："我实际上无法打开文件，但你可以这样做..."

**有了代理技能：**
- 用户："分析这个 CSV 文件并创建摘要报告"
- AI：*打开文件、读取数据、执行分析、生成图表、创建 PDF 报告*
- 结果：几秒钟内交付完整报告

## 核心概念：理解 AI 代理和工具

### 代理循环

AI 代理遵循持续的决策循环：

```
1. 感知 → 理解用户请求和上下文
2. 规划 → 决定采取什么行动
3. 行动 → 使用可用工具执行
4. 观察 → 评估结果
5. 重复 → 继续直到任务完成
```

对话示例：
```
用户："找到最新的 AI 新闻并给我发邮件摘要"

代理思考：
1. 感知：用户想要新闻 + 邮件发送
2. 规划：我需要使用 web_search 工具，然后是 email 工具
3. 行动：执行 web_search("2026 年最新 AI 新闻")
4. 观察：获得 10 篇相关文章
5. 规划：总结文章，然后使用 email 工具
6. 行动：发送带摘要的邮件
7. 完成：向用户确认
```

### 技能 vs. 工具 vs. 函数（术语）

AI 行业在某种程度上可互换地使用这些术语：

| 术语 | 定义 | 示例 |
|------|------|------|
| **工具（Tool）** | 代理可以调用的能力 | `web_search`、`file_reader`、`calculator` |
| **函数（Function）** | 工具的实现（技术术语） | JavaScript 函数、API 端点 |
| **技能（Skill）** | 更高级别的能力（可能使用多个工具） | "研究助手"使用搜索 + 总结 + 写作 |
| **动作（Action）** | 工具的单次调用 | 调用 `web_search("AI 趋势")` |

在本指南中，我们将互换使用"工具"和"技能"。

## 官方 AI 代理技能：可用功能

### Claude 的官方工具（Anthropic）

截至 2026 年，Claude 提供三个强大的内置工具：

#### 1. 计算机使用（`computer_20241022`）
允许 Claude 像人类一样与计算机交互：
- 控制鼠标和键盘
- 截屏并分析 UI
- 导航应用程序
- 填写表单、点击按钮、浏览网页

**使用场景：**
- 自动化测试
- 网页抓取
- 桌面自动化
- UI 交互

**示例：**
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
            "content": "打开浏览器并搜索最新的 AI 新闻"
        }
    ]
)
```

#### 2. Bash 工具（`bash_20241022`）
在安全环境中执行 bash 命令：
- 运行 shell 脚本
- 安装软件包
- 使用 CLI 工具处理文件
- 系统操作

**使用场景：**
- DevOps 自动化
- 文件处理
- 数据转换
- 系统管理

**示例：**
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
            "content": "列出当前目录中的所有 Python 文件并统计代码行数"
        }
    ]
)
```

#### 3. 文本编辑器（`text_editor_20241022`）
精确创建和编辑文件：
- 查看文件内容
- 编辑特定行
- 创建新文件
- 字符串替换

**使用场景：**
- 代码编辑
- 配置管理
- 文档生成
- 自动化重构

**示例：**
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
            "content": "创建一个从 API 获取天气数据的 Python 脚本"
        }
    ]
)
```

### OpenAI 的函数调用

OpenAI 的 GPT 模型支持自定义函数调用：

```javascript
const functions = [
  {
    name: "get_weather",
    description: "获取某地的当前天气",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "城市名称，例如：北京"
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
    { role: "user", content: "东京的天气怎么样？" }
  ],
  functions: functions,
  function_call: "auto"
});

// 如果 GPT 想调用函数，它返回：
// {
//   "name": "get_weather",
//   "arguments": "{\"location\": \"Tokyo\", \"unit\": \"celsius\"}"
// }

// 然后你执行函数并将结果返回给 GPT
```

### 流行的开源工具框架

#### LangChain 工具
LangChain 提供 100+ 个预构建工具：

```python
from langchain.agents import load_tools, initialize_agent
from langchain.llms import OpenAI

llm = OpenAI(temperature=0)

# 加载内置工具
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

# 使用代理
agent.run("东京的人口是多少？计算该数字的 10%。")
```

**可用的 LangChain 工具：**
- Wikipedia 搜索
- Google 搜索
- WolframAlpha
- Python REPL
- Shell 命令
- SQL 数据库
- HTTP 请求
- 文件操作
- 还有 90+ 个...

## 使用技能构建你的第一个 AI 代理

让我们一步步构建一个实用的研究助手代理。

### 前置条件

1. **Python 3.8+** 已安装
2. 来自 Anthropic 或 OpenAI 的 **API 密钥**
3. **基础 Python 知识**
4. 安装所需包：

```bash
pip install anthropic openai python-dotenv requests beautifulsoup4
```

### 步骤 1：定义你的工具

首先，为你的代理创建自定义工具：

```python
import os
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def web_search(query: str, num_results: int = 5) -> list:
    """
    在网络上搜索信息。
    
    参数：
        query: 搜索查询字符串
        num_results: 返回的结果数
    
    返回：
        包含标题、URL 和摘要的搜索结果列表
    """
    # 使用搜索 API（以 DuckDuckGo 为例）
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
    将内容保存到文件。
    
    参数：
        content: 要保存的文本内容
        filename: 要创建的文件名
    
    返回：
        带文件路径的成功消息
    """
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"✅ 内容已保存到 {filename}"
    except Exception as e:
        return f"❌ 保存文件错误：{str(e)}"

def calculate(expression: str) -> str:
    """
    安全地评估数学表达式。
    
    参数：
        expression: 数学表达式，如 "2 + 2" 或 "10 * 5"
    
    返回：
        计算结果
    """
    try:
        # 安全评估 - 只允许数字和基本运算符
        allowed = set('0123456789+-*/(). ')
        if not all(c in allowed for c in expression):
            return "错误：表达式中有无效字符"
        
        result = eval(expression)
        return f"{expression} = {result}"
    except Exception as e:
        return f"错误：{str(e)}"
```

### 步骤 2：使用 OpenAI 创建代理

```python
import openai
import json
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# 定义函数模式
functions = [
    {
        "name": "web_search",
        "description": "在网络上搜索关于某个主题的当前信息",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索查询"
                },
                "num_results": {
                    "type": "integer",
                    "description": "返回的结果数（默认 5）"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "将文本内容保存到文件",
        "parameters": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "要保存的内容"
                },
                "filename": {
                    "type": "string",
                    "description": "要创建的文件名"
                }
            },
            "required": ["content", "filename"]
        }
    },
    {
        "name": "calculate",
        "description": "执行数学计算",
        "parameters": {
            "type": "object",
            "properties": {
                "expression": {
                    "type": "string",
                    "description": "要评估的数学表达式"
                }
            },
            "required": ["expression"]
        }
    }
]

# 将函数名映射到实际函数
available_functions = {
    "web_search": web_search,
    "save_to_file": save_to_file,
    "calculate": calculate
}

def run_agent(user_message: str) -> str:
    """
    运行支持工具的代理。
    """
    messages = [
        {
            "role": "system",
            "content": """你是一个有工具访问权限的有用研究助手。
            当用户要求信息时，使用 web_search 查找当前数据。
            当被要求保存信息时，使用 save_to_file。
            对于计算，使用 calculate 工具。
            
            始终解释你在做什么，并提供清晰、有帮助的响应。"""
        },
        {
            "role": "user",
            "content": user_message
        }
    ]
    
    # 代理循环 - 允许最多 5 次工具调用
    for _ in range(5):
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=messages,
            functions=functions,
            function_call="auto"
        )
        
        message = response.choices[0].message
        
        # 如果没有函数调用，我们完成了
        if not message.function_call:
            return message.content
        
        # 执行函数
        function_name = message.function_call.name
        function_args = json.loads(message.function_call.arguments)
        
        print(f"🔧 调用 {function_name}，参数：{function_args}")
        
        function_result = available_functions[function_name](**function_args)
        
        # 将函数调用和结果添加到对话中
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
    
    return "代理达到最大迭代次数"

# 测试代理
if __name__ == "__main__":
    result = run_agent(
        "搜索 2026 年最新的 AI 代理发展，"
        "总结前 3 个发现，并将摘要保存到文件。"
    )
    print("\n📋 代理响应：")
    print(result)
```

### 步骤 3：使用 Claude 创建相同的代理

```python
import anthropic
import json

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Claude 使用不同的工具格式
claude_tools = [
    {
        "name": "web_search",
        "description": "在网络上搜索关于某个主题的当前信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索查询"
                },
                "num_results": {
                    "type": "integer",
                    "description": "返回的结果数",
                    "default": 5
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "save_to_file",
        "description": "将文本内容保存到文件",
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
        "description": "执行数学计算",
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
    使用 Claude 运行代理。
    """
    messages = [{"role": "user", "content": user_message}]
    
    # 代理循环
    for _ in range(5):
        response = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            tools=claude_tools,
            messages=messages
        )
        
        # 检查 Claude 是否想使用工具
        if response.stop_reason == "tool_use":
            # 将助手的响应添加到消息中
            messages.append({
                "role": "assistant",
                "content": response.content
            })
            
            # 执行每个工具调用
            tool_results = []
            for content_block in response.content:
                if content_block.type == "tool_use":
                    tool_name = content_block.name
                    tool_input = content_block.input
                    
                    print(f"🔧 Claude 调用 {tool_name}，参数：{tool_input}")
                    
                    # 执行工具
                    result = available_functions[tool_name](**tool_input)
                    
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": content_block.id,
                        "content": str(result)
                    })
            
            # 将工具结果发送回 Claude
            messages.append({
                "role": "user",
                "content": tool_results
            })
        else:
            # 没有更多工具调用，返回最终响应
            return response.content[0].text
    
    return "代理达到最大迭代次数"

# 测试 Claude 代理
if __name__ == "__main__":
    result = run_claude_agent(
        "研究 2026 年 AI 代理的最新发展并创建简要摘要。"
    )
    print("\n📋 Claude 的响应：")
    print(result)
```

## 高级代理技能和模式

### 多步骤工作流

对于复杂任务，代理需要将多个工具链接在一起：

```python
def research_and_publish_workflow(topic: str) -> str:
    """
    完整工作流：研究 → 分析 → 总结 → 保存 → 邮件
    """
    steps = [
        f"1. 搜索 '{topic}' 并收集信息",
        f"2. 分析并提取关键见解",
        f"3. 创建全面的摘要",
        f"4. 将摘要保存到文件：{topic.replace(' ', '-')}.md",
        f"5. 确认完成"
    ]
    
    prompt = f"""执行这个研究工作流：
    
    主题：{topic}
    
    步骤：
    {chr(10).join(steps)}
    
    系统地使用你的工具完成每个步骤。"""
    
    return run_agent(prompt)

# 使用
result = research_and_publish_workflow("2026 年 AI 代理框架")
```

### 错误处理和重试

使你的代理更加健壮：

```python
def safe_tool_execution(tool_func, args, max_retries=3):
    """
    使用自动重试执行工具。
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
                    "message": f"在 {max_retries} 次尝试后失败"
                }
            print(f"⚠️ 尝试 {attempt + 1} 失败：{e}。重试中...")
            time.sleep(2 ** attempt)  # 指数退避
```

### 工具访问控制

限制你的代理可以做什么以确保安全：

```python
class SafeAgent:
    def __init__(self, allowed_tools=None, restricted_paths=None):
        self.allowed_tools = allowed_tools or []
        self.restricted_paths = restricted_paths or ['/etc', '/sys', '/root']
    
    def can_use_tool(self, tool_name: str) -> bool:
        """检查工具是否被允许。"""
        return tool_name in self.allowed_tools
    
    def validate_file_path(self, path: str) -> bool:
        """检查文件路径是否被允许。"""
        abs_path = os.path.abspath(path)
        for restricted in self.restricted_paths:
            if abs_path.startswith(restricted):
                return False
        return True
    
    def execute_tool(self, tool_name: str, args: dict):
        """使用验证安全地执行工具。"""
        if not self.can_use_tool(tool_name):
            return {"error": f"工具 '{tool_name}' 不被允许"}
        
        # 如果存在，验证文件路径
        if 'filename' in args or 'path' in args:
            path = args.get('filename') or args.get('path')
            if not self.validate_file_path(path):
                return {"error": f"访问 '{path}' 受限"}
        
        # 执行工具
        return available_functions[tool_name](**args)

# 使用
safe_agent = SafeAgent(
    allowed_tools=['web_search', 'calculate'],
    restricted_paths=['/etc', '/sys', '~/.ssh']
)
```

## 实际使用场景和示例

### 1. 客户支持代理

```python
def customer_support_agent():
    """
    可以搜索知识库、创建工单和发送邮件的代理。
    """
    tools = [
        {
            "name": "search_knowledge_base",
            "description": "搜索内部文档以寻找解决方案"
        },
        {
            "name": "create_ticket",
            "description": "创建支持工单进行升级"
        },
        {
            "name": "send_email",
            "description": "向客户发送邮件"
        },
        {
            "name": "check_order_status",
            "description": "在数据库中查找订单状态"
        }
    ]
    
    system_prompt = """你是一个客户支持代理。你的目标：
    1. 清楚地理解客户的问题
    2. 在知识库中搜索解决方案
    3. 如果你能解决，提供清晰的步骤
    4. 如果你不能，创建工单并通知客户
    5. 始终保持同理心和专业性
    """
    
    return create_agent(tools, system_prompt)
```

### 2. 数据分析代理

```python
def data_analyst_agent():
    """
    可以查询数据库、创建可视化和生成报告的代理。
    """
    tools = [
        {
            "name": "query_database",
            "description": "在数据库上执行 SQL 查询"
        },
        {
            "name": "create_chart",
            "description": "生成图表和可视化"
        },
        {
            "name": "calculate_statistics",
            "description": "计算统计指标"
        },
        {
            "name": "export_to_excel",
            "description": "将数据导出到 Excel 表格"
        }
    ]
    
    system_prompt = """你是一个数据分析师。当被要求分析数据时：
    1. 查询数据库以检索相关数据
    2. 执行统计分析
    3. 创建适当的可视化
    4. 用通俗语言总结见解
    5. 如果请求，导出结果
    """
    
    return create_agent(tools, system_prompt)
```

## 生产代理的最佳实践

### 1. 设计清晰的工具描述

```python
# ❌ 糟糕：模糊的描述
{
    "name": "search",
    "description": "搜索东西"
}

# ✅ 好：清晰、具体的描述
{
    "name": "web_search",
    "description": """使用网络搜索引擎在互联网上搜索当前信息。
    当用户询问最近的新闻、当前事件或自你的训练数据截止以来
    可能已经改变的信息时使用此工具。
    
    返回：包含标题、URL 和摘要的搜索结果列表。""",
    "parameters": {
        "query": "具体的搜索查询（要精确）",
        "num_results": "要返回的结果数（1-10）"
    }
}
```

### 2. 实施速率限制

```python
from datetime import datetime, timedelta
from collections import defaultdict

class RateLimiter:
    def __init__(self, max_calls: int, time_window: int):
        self.max_calls = max_calls
        self.time_window = time_window  # 秒
        self.calls = defaultdict(list)
    
    def can_call(self, tool_name: str) -> bool:
        """检查工具是否可以调用。"""
        now = datetime.now()
        cutoff = now - timedelta(seconds=self.time_window)
        
        # 删除旧调用
        self.calls[tool_name] = [
            call_time for call_time in self.calls[tool_name]
            if call_time > cutoff
        ]
        
        return len(self.calls[tool_name]) < self.max_calls
    
    def record_call(self, tool_name: str):
        """记录工具调用。"""
        self.calls[tool_name].append(datetime.now())

# 使用
rate_limiter = RateLimiter(max_calls=10, time_window=60)

if rate_limiter.can_call("web_search"):
    result = web_search("AI 新闻")
    rate_limiter.record_call("web_search")
else:
    print("超过速率限制。请稍等。")
```

## 常见问题排查

### 问题 1：代理不使用工具

**症状：**
- 代理只用文本响应
- 没有函数调用
- 代理说"我没有访问权限"

**解决方案：**

1. **检查系统提示** - 明确指示代理使用工具：
```python
system_prompt = """你必须使用可用工具来完成任务。
当用户询问你没有的信息时，使用 web_search。
当被要求保存数据时，使用 save_to_file。
不要编造信息或拒绝你有工具可以完成的任务。"""
```

2. **验证函数描述** - 使它们清晰具体

3. **检查模型能力** - 确保你的模型支持函数调用：
- ✅ GPT-4、GPT-3.5-turbo（2023 年 6 月+）
- ✅ Claude 3 Opus、Sonnet、Haiku
- ✅ Gemini Pro
- ❌ 较旧的模型可能不支持工具

## 结论：AI 代理的未来

AI 代理技能正在改变我们与 AI 系统交互的方式。在 2026 年及以后，我们将看到：

### 新兴趋势

1. **多模态代理**：结合视觉、音频和文本
2. **长时间运行的代理**：在任务上工作数小时或数天的代理
3. **代理协作**：多个代理一起工作
4. **改进的推理**：更好的规划和决策
5. **领域特定代理**：医学、法律、工程等专业代理

### 今天开始

1. **从简单开始**：选择 2-3 个工具并构建基本代理
2. **选择你的工具**：使用 Claude 的内置工具或 OpenAI 的函数调用
3. **彻底测试**：在生产之前确保可靠性
4. **密切监控**：跟踪性能和错误
5. **快速迭代**：基于实际使用改进

### 关键要点

✅ **代理技能 = 实际行动**：超越文本生成
✅ **多种方法可用**：Claude、OpenAI、LangChain 都支持工具
✅ **从现有工具开始**：不要从头开始构建所有内容
✅ **安全至关重要**：清理输入、限制权限、沙箱执行
✅ **监控和优化**：跟踪指标并持续改进

未来是代理化的 - 能够真正帮助我们完成任务的 AI 系统，而不仅仅是回答问题。今天就开始构建你的智能代理吧！

---

## 附加资源

### 官方文档
- **Claude 代理技能**：[platform.claude.com/docs/en/agents-and-tools/tool-use/overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)
- **OpenAI 函数调用**：[platform.openai.com/docs/guides/function-calling](https://platform.openai.com/docs/guides/function-calling)
- **LangChain 工具**：[reference.langchain.com/python/langchain/agents/](https://reference.langchain.com/python/langchain/agents/)

### 开源项目
- **AutoGPT**：自主 AI 代理框架
- **LangChain**：使用 LLM 构建应用程序
- **Semantic Kernel**：Microsoft 的代理框架
- **CrewAI**：多代理编排

### 社区
- **r/artificial**：AI 讨论的 Reddit 社区
- **LangChain Discord**：活跃的开发者社区
- **Anthropic Claude Discord**：官方 Claude 社区

祝你构建愉快！🤖✨
