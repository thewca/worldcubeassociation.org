resource "aws_s3_bucket" "storage-bucket" {
  bucket = "www.worldcubeassociation.org"
  tags = {
    "Name" = "www.worldcubeassociation.org"
  }
}
resource "aws_s3_bucket" "backup-bucket" {
  bucket = "wca-backups"
  tags = {
    "Name" = "wca-backups"
  }
}

resource "aws_s3_bucket" "next-media" {
  bucket = "wca-nextjs-media-prod"
  tags = {
    "Name" = "wca-nextjs-media-prod"
  }
}

resource "aws_s3_bucket" "avatars" {
  bucket = "wca-avatar"
  tags = {
    "Name" = "wca-avatar"
  }
}
resource "aws_s3_bucket" "documents" {
  bucket = "wca-documents"
  tags = {
    "Name" = "wca-documents"
  }
}
resource "aws_s3_bucket" "regulations" {
  bucket = "wca-regulations"
  tags = {
    "Name" = "wca-regulations"
  }
}
resource "aws_s3_bucket" "assets" {
  bucket = "assets.worldcubeassociation.org"
  tags = {
    "Name" = "assets.worldcubeassociation.org"
  }
}

resource "aws_s3_bucket" "avatars_private" {
  bucket = "wca-avatar-private"
  tags = {
    "Name" = "wca-avatar-private"
  }
}
