resource "aws_s3_bucket" "storage-bucket" {
  bucket = "staging.worldcubeassociation.org"
  tags = {
    "Name" = "www.worldcubeassociation.org"
  }
}
resource "aws_s3_bucket" "avatars" {
  bucket = "wca-avatar"
  tags = {
    "Name" = "wca-avatar"
  }
}
