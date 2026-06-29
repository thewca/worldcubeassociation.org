locals {
  rails_startup_time = 300
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.28.0"
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

# Amazon Linux 2023 ECS-optimized AMI. To migrate a pool to AL2023, set the
# matching *_ami_id below to data.aws_ami.ecs_al2023.id (one pool at a time).
data "aws_ami" "ecs_al2023" {
  most_recent = true

  owners = ["amazon"]

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name   = "name"
    values = ["al2023-ami-ecs-hvm-*-x86_64"]
  }
}

module "production" {
  source                   = "./production"
  name_prefix              = "${var.name_prefix}-prod"
  region                   = var.region
  shared                   = module.shared
  VAULT_ADDR               = var.VAULT_ADDR
  DATABASE_WRT_USER        = var.DATABASE_WRT_USER
  DATABASE_WRT_SENIOR_USER = var.DATABASE_WRT_SENIOR_USER
  rails_startup_time       = local.rails_startup_time
  WRC_WEBHOOK_URL          = var.WRC_WEBHOOK_URL
  anycable_path            = var.anycable_path
}

module "staging" {
  source                   = "./staging"
  name_prefix              = "${var.name_prefix}-staging"
  region                   = var.region
  VAULT_ADDR               = var.VAULT_ADDR
  DATABASE_WRT_USER        = var.DATABASE_WRT_USER
  DATABASE_WRT_SENIOR_USER = var.DATABASE_WRT_SENIOR_USER
  shared                   = module.shared
  rails_startup_time       = local.rails_startup_time
  WRC_WEBHOOK_URL          = var.WRC_WEBHOOK_URL
  anycable_path            = var.anycable_path
}

module "shared" {
  source             = "./shared"
  name_prefix        = var.name_prefix
  region             = var.region
  availability_zones = var.availability_zones
  rails_startup_time = local.rails_startup_time
  pma_auth_secret    = var.pma_auth_secret
  anycable_path      = var.anycable_path
  t3_ami_id          = var.t3_ami_id
  m6i_ami_id         = var.m6i_ami_id
}
