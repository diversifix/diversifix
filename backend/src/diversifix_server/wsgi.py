# FastAPI app - use with uvicorn
from diversifix_server.app import app

# For uvicorn: uvicorn diversifix_server.wsgi:app
application = app
