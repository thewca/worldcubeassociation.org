resource "aws_s3_bucket" "storage-bucket" {
  bucket = "staging.worldcubeassociation.org"
  tags = {
    "Name" = "staging.worldcubeassociation.org"
  }
}
resource "aws_s3_bucket" "avatars" {
  bucket = "wca-avatar"
  tags = {
    "Name" = "wca-avatar"
  }
}

resource "aws_s3_bucket" "avatars_private" {
  bucket = "wca-avatar-private-staging"
  tags = {
    "Name" = "wca-avatar-private-staging"
  }
}

resource "aws_s3_bucket" "next-media" {
  bucket = "wca-nextjs-media-prod"
  tags = {
    "Name" = "wca-nextjs-media-prod"
  }
}

resource "aws_s3_bucket" "assets" {
  bucket = "assets-staging.worldcubeassociation.org"
  tags = {
    "Name" = "assets-staging.worldcubeassociation.org"
  }
}
