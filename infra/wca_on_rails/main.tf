module "production" {
  source = "./production"
  name_prefix = "${var.name_prefix}-prod"
  region = var.region
}

module "staging" {
  source = "./staging"
  name_prefix = "${var.name_prefix}-staging"
  region = var.region
}

module "shared" {
  source = "./shared"
  name_prefix = var.name_prefix
  region = var.region
  availability_zones = var.availability_zones
}
