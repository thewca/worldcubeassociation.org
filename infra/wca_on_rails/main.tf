locals {
  rails_startup_time = 300
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.14.1"
    }
  }

  # Supports multiple workspaces
  backend "s3" {
    bucket = "wca-main-terraform-state"
    key    = "wca-main"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project = var.name_prefix
    }
  }
}

module "production" {
  source = "./production"
  name_prefix = "${var.name_prefix}-prod"
  region = var.region
  shared = module.shared
  VAULT_ADDR = var.VAULT_ADDR
  DATABASE_WRT_USER = var.DATABASE_WRT_USER
  DATABASE_WRT_SENIOR_USER = var.DATABASE_WRT_SENIOR_USER
  rails_startup_time = local.rails_startup_time
  WRC_WEBHOOK_URL = var.WRC_WEBHOOK_URL
}

module "staging" {
  source = "./staging"
  name_prefix = "${var.name_prefix}-staging"
  region = var.region
  VAULT_ADDR = var.VAULT_ADDR
  DATABASE_WRT_USER = var.DATABASE_WRT_USER
  DATABASE_WRT_SENIOR_USER = var.DATABASE_WRT_SENIOR_USER
  shared = module.shared
  rails_startup_time = local.rails_startup_time
  WRC_WEBHOOK_URL = var.WRC_WEBHOOK_URL
}

module "shared" {
  source = "./shared"
  name_prefix = var.name_prefix
  region = var.region
  availability_zones = var.availability_zones
  rails_startup_time = local.rails_startup_time
  pma_auth_secret = var.pma_auth_secret
}
