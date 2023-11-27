import os
from flask import Flask, request, send_from_directory
from flask_cors import cross_origin
from diversifix_server.matches import matches, rules
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
        if "aiModel" in request.form and request.form["aiModel"] in [
            "gpt-4-1106-preview",
            "gpt-3.5-turbo",
        ]:
            response = {
                "matches": gpt_matches(
                    request.form["text"], model=request.form["aiModel"]
                )
            }
        else:
            response = {"matches": matches(request.form["text"])}
        return response, 200
    else:
        return "No input text.", 500


if __name__ == "__main__":
    app.run(host="localhost", port=8081)
