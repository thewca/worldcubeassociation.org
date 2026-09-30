# Builds every image of one environment in a single BuildKit invocation, so the
# expensive base/build/runtime stages are materialised exactly once and all images
# ship identical assets. See .github/actions/build-environment.

variable "REGISTRY" {}
variable "BUILD_TAG" { default = "local" }
variable "ENVIRONMENT" { default = "staging" }
variable "MONOLITH_TAG" { default = "staging" }
variable "WCA_LIVE_SITE" { default = "false" }
variable "SHAKAPACKER_ASSET_HOST" { default = "" }

target "_common" {
  context    = "."
  dockerfile = "Dockerfile"
  args = {
    BUILD_TAG              = BUILD_TAG
    WCA_LIVE_SITE          = WCA_LIVE_SITE
    SHAKAPACKER_ASSET_HOST = SHAKAPACKER_ASSET_HOST
  }
  cache-from = ["type=registry,ref=${REGISTRY}:buildcache-${ENVIRONMENT}"]
}

# Only the monolith writes the cache: bake builds targets in parallel, and every
# target shares the same expensive stages, so a single writer captures all of them
# without four concurrent exporters racing on one registry ref.
target "monolith" {
  inherits = ["_common"]
  target   = "monolith"
  tags     = ["${REGISTRY}:${MONOLITH_TAG}"]
  output   = ["type=registry"]
  cache-to = ["type=registry,ref=${REGISTRY}:buildcache-${ENVIRONMENT},mode=max,image-manifest=true,oci-mediatypes=true"]
}

target "sidekiq" {
  inherits = ["_common"]
  target   = "sidekiq"
  tags     = ["${REGISTRY}:sidekiq-${ENVIRONMENT}"]
  output   = ["type=registry"]
}

target "monolith-api" {
  inherits = ["_common"]
  target   = "monolith-api"
  tags     = ["${REGISTRY}:${ENVIRONMENT}-api"]
  output   = ["type=registry"]
}

target "shoryuken" {
  inherits = ["_common"]
  target   = "shoryuken"
  tags     = ["${REGISTRY}:${ENVIRONMENT}-sqs-worker"]
  output   = ["type=registry"]
}

# Not an image: extracts public/ to ./assets for the S3 sync.
target "assets" {
  inherits = ["_common"]
  target   = "assets"
  output   = ["type=local,dest=./assets"]
}

group "default" {
  targets = ["monolith", "sidekiq", "monolith-api", "shoryuken", "assets"]
}
