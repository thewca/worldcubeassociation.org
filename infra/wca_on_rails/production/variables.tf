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

variable "WCA_REGISTRATIONS_URL" {
  description = "The URL of the registrations service"
  type = string
  default = "https://registration.worldcubeassociation.org"
}

variable "WCA_REGISTRATIONS_CDN_URL" {
  description = "The URL of the frontend of the registrations service"
  type = string
  default = "https://d1qizdh27al0a7.cloudfront.net"
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

variable "rails_startup_time" {
  type = number
  description = "The Startup time of the Ruby on Rails Application"
}

variable "rds_iam_identifier" {
  type = string
  description = "The identifier of the RDS Instance used for IAM Auth"
  default = "db-VFBCC2563NK74KYKEYEC32YXHA"
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
    t3_capacity_provider: object({
      name: string
    }),
    m6i_capacity_provider: object({
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
    api_gateway: object({
      id: string,
      root_resource_id: string
    })
    account_id: string
    # These are booth arrays
    private_subnets: any
    rails-production: any
  })
  description = "The shared resources between Environments"
}

variable "WRC_WEBHOOK_URL" {
  description = "The URL to send delegate report webhook notifications for WRC to"
  type = string
}
