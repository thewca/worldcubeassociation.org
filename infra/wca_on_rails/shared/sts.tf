data "aws_caller_identity" "current" {}

# Allows accessing the account id so we don't need to hardcode it for certain ARNs
output "account_id" {
  value = data.aws_caller_identity.current.account_id
}
