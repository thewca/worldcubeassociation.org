#!/usr/bin/python

import json
import cgi, os

data = {
  "/api/": {"info": "This API is not stable. There is only one guaranteed endpoint at the moment: https://www.worldcubeassociation.org/api/v0/scramble-program"},
  "/api/v0/scramble-program": {
    "current": {
      "name": "TNoodle-WCA-0.8.1",
      "information": "https://www.worldcubeassociation.org/regulations/scrambles/",
      "download": "https://www.worldcubeassociation.org/regulations/scrambles/tnoodle/TNoodle-WCA-0.8.1.jar"
    },
    "allowed": [
      "TNoodle-WCA-0.8.1"
    ],
    "history": [
      "TNoodle-0.7.4",       # 2013-01-01
      "TNoodle-0.7.5",       # 2013-02-26
      "TNoodle-0.7.8",       # 2013-04-26
      "TNoodle-0.7.12",      # 2013-10-01
      "TNoodle-WCA-0.8.0",   # 2014-01-13
      "TNoodle-WCA-0.8.1"    # 2014-01-14
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
