import os
import openai
from dotenv import load_dotenv
from diversifix_server.gpt.prompt import fast_prompt as system_prompt
import json
from joblib import Memory

load_dotenv()
memory = Memory(".cache", verbose=0)

openai.api_key = os.getenv("OPENAI_API_KEY")


# @memory.cache
def ask_gpt(prompt, model="gpt-4"):
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": "```json\n"},
    ]
    completion = openai.ChatCompletion.create(
        model=model,
        temperature=0,
        messages=messages,
        stop=["```"],
        max_tokens=500,
    )
    reply = completion.choices[0].message["content"]
    reply = reply.replace("```json\n", "").replace("\n```", "")
    reply = json.loads(reply)
    return reply
