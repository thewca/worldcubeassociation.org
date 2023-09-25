variable "env" {
  type        = string
  description = "Environment name"
  default     = "prod"
}

variable "WCA_LIVE_SITE" {
  type        = string
  description = "If the Website is Staging or Prod"
  default     = "1"
}

variable "ROOT_URL" {
  type        = string
  description = "The URL the website runs on"
  default     = "https://www.worldcubeassociation.org"
}

variable "DISCOURSE_URL" {
  type        = string
  description = "The URL of the WCA forum"
  default     = "https://forum.worldcubeassociation.org"
}

variable "VAULT_APPLICATION" {
  type        = string
  description = "The namespace for Vault Secrets"
  default     = "wca-main-production"
}

variable "name_prefix" {
  type        = string
  description = "Prefix for naming resources"
}

variable "region" {
  type = string
  description = "The AWS Region"
}

variable "shared" {
  type = object({
    vpc_id: string,
    repository_url: string,
    ecs_cluster: object({
      id: string
    }),
    capacity_provider: object({
      name: string
    }),
    cluster_security: object({
      id: string
    }),
    private_subnets: any
  })
  description = "The shared resources between Environments"
}
