from flask import Flask, request, send_from_directory
from flask_cors import cross_origin
import time
import json
import joblib

from diversifix_server.matches import matches
from diversifix_server.gpt import matches as gpt_matches

app = Flask(__name__, static_folder=None)


@app.route("/", defaults=dict(filename=None))
@app.route("/<path:filename>", methods=["GET"])
def index(filename):
    filename = filename or "index.html"
    return send_from_directory("static", filename)


@app.route("/v2/check", methods=["POST"])
@cross_origin()
def serve_api():
    if "text" in request.form.keys():
        text = request.form["text"]

        if "aiModel" in request.form and request.form["aiModel"] in [
            "gpt-4-1106-preview",
            "gpt-3.5-turbo",
        ]:
            match_results = gpt_matches(text, model=request.form["aiModel"])
        else:
            match_results = matches(text)

        log_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "user_ip_hash": joblib.hash(request.remote_addr),
            "text_length": {
                "characters": len(text),
                "words": len(text.split()),
                "paragraphs": len(text.split("\n\n")),
            },
            "num_matches": len(match_results),
        }

        with open("requests.log", "a") as file:
            file.write(json.dumps(log_data) + "\n")

        return {"matches": match_results}, 200
    else:
        return "No input text.", 500


if __name__ == "__main__":
    app.run(host="localhost", port=8081)
