variable "env" {
  type        = string
  description = "Environment name"
  default     = "staging"
}

variable "region" {
  type        = string
  description = "Name of the AWS Region we are running in"
}

variable "DATABASE_WRT_USER" {
  type        = string
  description = "The name of the database user that WRT signs in with"
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

variable "VAULT_ADDR" {
  type        = string
  description = "The address of the vault cluster that is running in our private subnet"
}

variable "VAULT_APPLICATION" {
  type        = string
  description = "The namespace for Vault Secrets"
  default     = "wca-main-staging"
}

variable "shared" {
  type = object({
    vpc_id: string,
    ecr_repository: object({
      repository_url: string
      name: string
    }),
    ecs_cluster: object({
      id: string
    }),
    t3_capacity_provider: object({
      name: string
    }),
    cluster_security: object({
      id: string
    }),
    rails_staging: object({
      arn: string
    })
    pma_staging: object({
      arn: string
    })
    private_subnets: any
  })
  description = "The shared resources between Environments"
}

variable "name_prefix" {
  type = string
  description = "Prefix for naming resources"
}
