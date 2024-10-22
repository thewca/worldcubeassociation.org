resource "aws_api_gateway_rest_api" "this" {
  name        = "wca-monolith-pollingco-api"
  description = "The API to Poll for updates"
  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

output "api_gateway" {
  value = aws_api_gateway_rest_api.this
}
