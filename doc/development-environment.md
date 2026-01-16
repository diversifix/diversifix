# Development Environment

## Prerequisites for development

- [Node.js](https://nodejs.org/en/) v14 to v18
- [(Classic) Yarn](https://classic.yarnpkg.com/lang/en/) v1.22 or newer (though not Yarn 2)
- [Python 3](https://www.python.org/) v3.12+
- [uv](https://docs.astral.sh/uv/) - Fast Python package manager
- (optional) if you want to build the Docker image or run the app in a Docker container: [Docker](https://www.docker.com/)

### Installing uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or with Homebrew
brew install uv

# Or with pip
pip install uv
```

## First-time setup

After cloning this repo, do the following steps to prepare your development environment:

1. Install the dependencies for the dev scripts:
   ```bash
   cd dev_cmds && yarn install && yarn devcmd setup
   ```

2. If you want to use the [DevCmd](https://github.com/XITASO/devcmd) global launcher, also run:
   ```bash
   yarn global add devcmd-cli
   ```

3. Set up the Python backend:
   ```bash
   cd backend
   uv sync
   ```

## DevCmd for dev scripts

We automated many common build and development tasks, mostly using [DevCmd](https://github.com/XITASO/devcmd). These scripts are located in the `dev_cmds` directory in the repo root.

We recommend installing and using DevCmd's global launcher tool (see above).

If you can't or don't want to use this global launcher, you can replace any command that looks like `devcmd <SCRIPTNAME>` equivalently with `cd dev_cmds && yarn devcmd <SCRIPTNAME>`.

## Parts of this repository

What is where (relative to the repo root):

- `data/` - word lists, text corpora, and other input data, as well as pre-processing scripts to turn this data into usable inputs for the NLP backend
- `dev_cmds/` - build scripts and development task automation using [DevCmd](https://github.com/XITASO/devcmd)
- `doc/` - this documentation
- `backend/` - the Python backend (FastAPI + uvicorn) that analyzes users' inputs and provides improvement suggestions using NLP methods
  - `backend/src/diversifix_server/` - the main Python package
  - `backend/pyproject.toml` - dependencies and project configuration
  - `backend/uv.lock` - locked dependency versions
- `react-ui/` - the graphical end-user app (frontend) for use as a standalone webpage in a browser and in Word/Outlook add-ins

## Starting the app for development

- Start the API backend:
  ```bash
  cd backend
  uv run uvicorn diversifix_server.app:app --host localhost --port 8081 --reload
  ```
  Or use DevCmd: `devcmd start-api`

- Start the UI part: `devcmd start-ui`

The API will be available at http://localhost:8081 with:
- Interactive docs at http://localhost:8081/docs (Swagger UI)
- Alternative docs at http://localhost:8081/redoc (ReDoc)

## Building for production / deployment

- `devcmd build-docker-image`: Creates a Docker image that contains the API backend and the static assets for the frontend, served on port 80 (i.e. non-HTTPS) inside the container. The script prints the name of the created image when it's done, so you can push or export the image easily.
  - `devcmd start-docker`: If you've previously built the Docker image with the command above, this command starts a new Docker container from this image locally.
- `devcmd build-zip-file`: Creates a ZIP file in the repository root containing the API backend and the static assets for the frontend. This is intended for directly running the Python backend instead of deploying a Docker container.
- `devcmd create-addin-manifest`: Installing the Word add-in requires a `manifest.xml` that points to the correct host where the DIVERSIFIX app is deployed. This command creates a suitable manifest file for the host URL you provide as an argument.

## Docker

The Docker image uses:
- **Python 3.12** with the official [uv Docker image](https://docs.astral.sh/uv/guides/integration/docker/)
- **FastAPI** as the web framework
- **uvicorn** as the ASGI server
- **Stanza** for NLP processing (German language models)

Build and run locally:
```bash
docker build -t diversifix-app .
docker run --rm -p 8080:80 diversifix-app
```

Then open http://localhost:8080 in your browser.
