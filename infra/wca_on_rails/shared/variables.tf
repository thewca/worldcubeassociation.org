variable "name_prefix" {
  type        = string
  description = "Prefix for naming resources"
}

variable "region" {
  type        = string
  description = "The region to operate in"
}

variable "availability_zones" {
  type        = list(string)
  description = "Availability zones"
}

variable "rails_startup_time" {
  type = number
  description = "The Startup time of the Ruby on Rails Application"
}

variable "pma_auth_secret" {
  type = string
  description = "The client secret of the pma auth found at https://www.worldcubeassociation.org/oauth/applications/1069"
}
