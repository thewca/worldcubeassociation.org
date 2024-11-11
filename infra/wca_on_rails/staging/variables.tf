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

variable "rails_startup_time" {
  type = number
  description = "The Startup time of the Ruby on Rails Application"
}

variable "rds_iam_identifier" {
  type = string
  description = "The identifier of the RDS Instance used for IAM Auth"
  default = "db-GEOER6N45337C3ZMAYEL2WBAOY"
}

variable "WCA_REGISTRATIONS_URL" {
  description = "The URL of the backend of the registrations service"
  type = string
  default = "https://staging.registration.worldcubeassociation.org"
}

variable "WCA_REGISTRATIONS_CDN_URL" {
  description = "The URL of the frontend of the registrations service"
  type = string
  default = "https://d1qizdh27al0a7.cloudfront.net/staging"
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
    rails_staging-api: object({
      arn: string
    })
    pma_staging: object({
      arn: string
    })
    mailcatcher: object({
      arn: string
    })
    api_gateway: object({
      id: string,
      root_resource_id: string
    })
    account_id: string
    private_subnets: any
  })
  description = "The shared resources between Environments"
}

variable "name_prefix" {
  type = string
  description = "Prefix for naming resources"
}

variable "WRC_WEBHOOK_URL" {
  description = "The URL to send delegate report webhook notifications for WRC to"
  type = string
}
