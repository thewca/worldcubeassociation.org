variable "env" {
  type        = string
  description = "Environment name"
  default     = "staging"
}

variable "WCA_LIVE_SITE" {
  type        = string
  description = "If the Website is Staging or Prod"
  default     = "0"
}

variable "ROOT_URL" {
  type        = string
  description = "The URL the website runs on"
  default     = "https://staging.worldcubeassociation.org"
}

variable "DISCOURSE_URL" {
  type        = string
  description = "The URL of the WCA forum"
  default     = ""
}

variable "VAULT_APPLICATION" {
  type        = string
  description = "The namespace for Vault Secrets"
  default     = "wca-main-staging"
}
