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
  default = "http://vault.worldcubeassociation.org:8200"
}

variable "DATABASE_WRT_USER" {
  type        = string
  description = "The name of the user to access phpmyadmin"
  default     = "phpmyadmin"
}
