variable "name_prefix" {
  type        = string
  description = "Prefix for naming resources"
  default     = "wca-on-rails"
}

variable "region" {
  type        = string
  description = "The region to operate in"
  default     = "us-west-2"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones"
  default     = ["us-west-2a", "us-west-2b"]
}

# Environment Variables that are the same between prod/staging

variable "VAULT_ADDR" {
  type = string
  description = "The Address that vault is running at"
  default = "http://vault.private.worldcubeassociation.org:8200"
}

variable "DATABASE_WRT_USER" {
  type        = string
  description = "The name of the user to access phpmyadmin for wrt users"
  default     = "wrt"
}

variable "DATABASE_WRT_SENIOR_USER" {
  type        = string
  description = "The name of the user to access phpmyadmin for wrt senior users"
  default     = "wrt_senior"
}

variable "WRC_WEBHOOK_URL" {
  description = "The URL to send delegate report webhook notifications for WRC to"
  type = string
  default = "https://joba.me/wca/reports_webhook"
}

variable "pma_auth_secret" {
  type = string
  description = "The client secret for pma you can get it at https://www.worldcubeassociation.org/oauth/applications/1069"
}
