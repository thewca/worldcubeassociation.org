#!/usr/bin/python2

import json
import cgi, os

https = os.environ.get('HTTPS') == "on"
protocol = "https" if https else "http"
domain_name = os.environ['SERVER_NAME']
server_port = int(os.environ['SERVER_PORT'])
if https and server_port == 443 or not https and server_port == 80:
  server_port_str = ""
else:
  server_port_str = ":%s" % server_port
root_url = "%s://%s%s" % ( protocol, domain_name, server_port_str )
data = {
  "/api/": {"info": "This API is not stable. There is only one guaranteed endpoint at the moment: %s/api/v0/scramble-program" % root_url},
  "/api/v0/scramble-program": {
    "current": {
      "name": "TNoodle-WCA-0.9.0",
      "information": "%s/regulations/scrambles/" % root_url,
      "download": "%s/regulations/scrambles/tnoodle/TNoodle-WCA-0.9.0.jar" % root_url
    },
    "allowed": [
      "TNoodle-WCA-0.9.0"
    ],
    "history": [
      "TNoodle-0.7.4",       # 2013-01-01
      "TNoodle-0.7.5",       # 2013-02-26
      "TNoodle-0.7.8",       # 2013-04-26
      "TNoodle-0.7.12",      # 2013-10-01
      "TNoodle-WCA-0.8.0",   # 2014-01-13
      "TNoodle-WCA-0.8.1",   # 2014-01-14
      "TNoodle-WCA-0.8.2",   # 2014-01-28
      "TNoodle-WCA-0.8.4",   # 2014-02-10
      "TNoodle-WCA-0.9.0"    # 2015-03-30
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
