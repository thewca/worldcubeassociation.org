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
