#!/usr/bin/python

import json
import cgi, os

data = {
  "/api/": {"info": "This API is not stable. There is only one guaranteed endpoint at the moment: https://www.worldcubeassociation.org/api/v0/scramble-program"},
  "/api/v0/scramble-program": {
    "current": {
      "name": "TNoodle-WCA-0.8.0",
      "information": "https://www.worldcubeassociation.org/regulations/scrambles/",
      "download": "https://www.worldcubeassociation.org/regulations/scrambles/tnoodle/TNoodle-WCA-0.8.0.jar"
    },
    "allowed": [
      "TNoodle-WCA-0.8.0"
    ],
    "history": [
      "TNoodle-0.7.4",
      "TNoodle-0.7.5",
      "TNoodle-0.7.8",
      "TNoodle-0.7.12",
      "TNoodle-WCA-0.8.0"
    ]
  }
}

INVALID_REQUEST_ERROR = {"error": "Invalid request."}

def route(path):
  return data.get(path, INVALID_REQUEST_ERROR)

if __name__ == "__main__":
  path = os.environ["REQUEST_URI"]
  json_data = route(path)
  print "Content-type: application/json"
  print ""
  print json.dumps(json_data, indent=2)
