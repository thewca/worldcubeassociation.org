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

variable "DATABASE_WRT_USER" {
  type        = string
  description = "The name of the database user that WRT signs in with"
}

variable "VAULT_ADDR" {
  type        = string
  description = "The address of the vault cluster that is running in our private subnet"
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
    ecr_repository: object({
      repository_url: string
      name: string
      arn: string
    }),
    ecs_cluster: object({
      id: string
      name: string
    }),
    capacity_provider: object({
      name: string
    }),
    cluster_security: object({
      id: string
    }),
    lb: object({
      id: string
    })
    https_listener: object({
      arn: string
    })
    pma_production: object({
      arn: string
    })
    # These are booth arrays
    private_subnets: any
    rails-blue-green: any
  })
  description = "The shared resources between Environments"
}
