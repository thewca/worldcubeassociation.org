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
  type        = number
  description = "The Startup time of the Ruby on Rails Application"
}

variable "pma_auth_secret" {
  type        = string
  description = "The client secret of the pma auth found at https://www.worldcubeassociation.org/oauth/applications/1069"
}

variable "anycable_path" {
  type        = string
  description = "The Path where anycable is mounted"
}

# Override the ECS AMI per ASG for the AL2 -> AL2023 migration.
# Null falls back to the current Amazon Linux 2 ECS-optimized AMI,
# so flipping one of these moves only that ASG's instances.
variable "t3_ami_id" {
  type        = string
  description = "AMI for the t3 ASG (staging rails + all workers). Null = current AL2 AMI."
  default     = null
}

variable "m6i_ami_id" {
  type        = string
  description = "AMI for the m6i ASG (production rails). Null = current AL2 AMI."
  default     = null
}
