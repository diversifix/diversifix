import os
from openai import OpenAI

from dotenv import load_dotenv
from diversifix_server.gpt.prompt import system_prompt, schema, example_messages
import json
from joblib import Memory

load_dotenv()
memory = Memory(".cache", verbose=0)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


# @memory.cache
def ask_gpt(prompt, model="gpt-4"):
    messages = [
        {"role": "system", "content": system_prompt},
        # *example_messages,
        {"role": "user", "content": prompt},
    ]
    completion = client.chat.completions.create(
        model=model,
        temperature=0,
        messages=messages,
        tools=[
            {
                "type": "function",
                "function": {
                    "name": "provide_inclusive_suggestions",
                    "description": "Takes inclusive suggestions and shows them to the user.",
                    "parameters": schema,
                },
            }
        ],
        tool_choice={
            "type": "function",
            "function": {"name": "provide_inclusive_suggestions"},
        },
    )
    tool_calls = completion.choices[0].message.tool_calls
    if tool_calls:
        response = tool_calls[0].function.arguments
        response = json.loads(response)
        if "matches" in response.keys():
            return response["matches"]
    return []
