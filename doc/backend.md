# DIVERSIFIX App - Python Backend Documentation

The backend is written in Python 3.12+ and uses the [FastAPI](https://fastapi.tiangolo.com/) framework. It serves both the static frontend pages, and an API for retrieving diversity suggestions for a given text. For development and production, we use [uvicorn](https://www.uvicorn.org/) as the ASGI server. Dependencies are managed with [uv](https://docs.astral.sh/uv/).

## Installing and starting the server

The following steps are automated in the Docker image, see [here](./development-environment.md).

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/):

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. Navigate to the backend directory and sync dependencies:

   ```bash
   cd backend
   uv sync
   ```

   This creates a virtual environment and installs all dependencies from `pyproject.toml`.

3. Start the server:

   - For development (with auto-reload):

     ```bash
     uv run uvicorn diversifix_server.app:app --host localhost --port 8081 --reload
     ```

   - For production:

     ```bash
     uv run uvicorn diversifix_server.app:app --host 0.0.0.0 --port 80
     ```

   - Or run as a Python module:

     ```bash
     uv run python -m diversifix_server.app
     ```

## Project Structure

```
backend/
├── pyproject.toml          # Dependencies and project config
├── uv.lock                  # Locked dependency versions
└── src/
    └── diversifix_server/
        ├── __init__.py
        ├── app.py           # FastAPI application
        ├── matches.py       # Rule-based NLP matching
        ├── helpers.py
        ├── prepare_list.py
        ├── download_language_models.py
        ├── gpt/             # GPT-based matching
        │   ├── api.py
        │   ├── matches.py
        │   └── prompt.py
        ├── morphy/          # Morphological dictionary
        └── data/            # Rule lists and suggestions
```

## API

- `/` (GET) serves the static website.
- `/taskpane.html` serves the static website for the Word add-in.
- `/docs` (GET) - **NEW**: Interactive API documentation (Swagger UI)
- `/redoc` (GET) - **NEW**: Alternative API documentation (ReDoc)
- `/v2/check` (POST)
  The body must contain form data with:
  - `text` (required): The text to check
  - `aiModel` (optional): Either `gpt-4-1106-preview` or `gpt-3.5-turbo` to use GPT-based matching. If omitted, uses rule-based NLP matching.

  Example request:
  ```bash
  curl -X POST http://localhost:8081/v2/check \
    -d "text=Die Präsidenten sind Langweiler."
  ```

  The response is a JSON object, where under the key `matches` there is a list of matches. Each match is about one phrase that should be replaced, and it contains information about the phrase and the replacement suggestions:

  ```json
  {
    "matches": [
      {
        "context": { "length": 11, "offset": 0, "text": "Präsidenten" },
        "length": 11,
        "message": "...",
        "offset": 4,
        "replacements": [
          { "value": "Präsident*innen" },
          { "value": "Präsidentinnen und Präsidenten" },
          { "value": "Staatsoberhaupt" },
          { "value": "Vorsitz" },
          { "value": "Vorsitzende" }
        ],
        "rule": {
          "category": {
            "id": "GENERISCHES_MASKULINUM",
            "name": "Generisches Maskulinum"
          }
        },
        "shortMessage": "..."
      }
    ]
  }
  ```

  `.offset` and `.length` give the position of the match in the text (possibly including some surrounding context words); `.context.offset` and `.context.length` give the position of the word to be replaced within this possibly larger part. In practice, we don't make use of this distinction, so `.context.offset` is always `0` and `.context.length` is always identical to `.length`.

  As seen in the above example JSON snippet, the `replacements` list contains a mix of different gender styles: There are neutral words, words with gender star, and words in double notation with "und" or "oder". We filter these values in the frontend in [`react-ui/src/common/language-tool-api/user-settings-language-mapping.ts`](../react-ui/src/common/language-tool-api/user-settings-language-mapping.ts), and we replace the gender star with other symbols as specified by the user preferences.

### Compatibility with LanguageTool

We have previously used [LanguageTool](https://github.com/languagetool-org/languagetool), a powerful open source grammar checker, for our backend. Our frontend is compatible with the [LanguageTool API](https://languagetoolplus.com/http-api/#/default) and could be used to display suggestions from LanguageTool. The server API therefore mimicks the LanguageTool API, but only to the very small extent which our frontend actually uses.

### Internal working of the backend

The backend uses the NLP library [Stanza](https://stanfordnlp.github.io/stanza/) to perform grammatical analysis on the input text. Basically, all words are lemmatized, and then matched against an also lemmatized version of the rules. The suggestions are then adapted to the case (nominative, ...) and number (singular/plural) of the replaced word through the morphological dictionary [Morphy](https://morphy.wolfganglezius.de/). Subwordsplitting through [CharSplit](https://pypi.org/project/compound-split/) is used to also detect compound nouns.

The code is further explained in comments in the Python files within the [`backend/src/diversifix_server`](../backend/src/diversifix_server) directory, and suggestions for future improvements are given.

For information about the rule lists and how to edit them, see [here](./rule-lists.md).

## Development

Install dev dependencies:

```bash
cd backend
uv sync --group dev
```

Run linting:

```bash
uv run black src/
uv run pylint src/
uv run mypy src/
```
