from diversifix_server.gpt.api import ask_gpt


def matches(text: str, model="gpt-4"):
    unchecked_text = text
    reply = ask_gpt(unchecked_text, model=model)
    return [
        adjust_match(m, text)
        for m in reply
        if m["level"] != "content" and m["severity"] >= 0.3
    ]


def adjust_match(match, text):
    sentence_offset = text.index(match["sentence"])
    offset_start, offset_end, changes = changed_words(
        [
            match["sentence"],
            *[suggestion["text"] for suggestion in match["suggestions"]],
        ]
    )
    return {
        "message": match["explanation"],
        "shortMessage": match["problem"],
        "replacements": [
            {
                "value": change,
            }
            for change in changes[1:]
        ],
        "offset": sentence_offset + offset_start,
        "length": len(match["sentence"]) - offset_start - offset_end,
        "context": {
            "text": changes[0],
            "offset": 0,
            "length": len(changes[0]),
        },
        "rule": {
            "category": {
                "id": "GENERISCHES_MASKULINUM",
                "name": match["category"],
            }
        },
    }


def changed_words(texts):
    texts = [text.split() for text in texts]
    for i, words in enumerate(zip(*texts)):
        if len(set(words)) > 1:
            break
    i_chars = len(" ".join(texts[0][:i])) + (1 if i > 0 else 0)
    for j, words in enumerate(zip(*[text[::-1] for text in texts])):
        if len(set(words)) > 1:
            break
    j_chars = len(" ".join(texts[0][len(texts[0]) - j :])) + (1 if j > 0 else 0)
    return (
        i_chars,
        j_chars,
        [" ".join(words[i : len(words) - j]) for words in texts],
    )
