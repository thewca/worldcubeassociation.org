terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
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

#module "production" {
#  source = "./production"
#  name_prefix = "${var.name_prefix}-prod"
#  region = var.region
#}

module "staging" {
  source = "./staging"
  name_prefix = "${var.name_prefix}-staging"
  region = var.region
  VAULT_ADDR = var.VAULT_ADDR
  DATABASE_WRT_USER = var.DATABASE_WRT_USER
  shared = module.shared
}

module "shared" {
  source = "./shared"
  name_prefix = var.name_prefix
  region = var.region
  availability_zones = var.availability_zones
}
