resource "aws_s3_bucket" "avatars_private" {
  bucket = "wca-avatar-private"
  tags = {
    "Name" = "wca-avatar-private"
  }
}

output "avatars_private" {
  value = aws_s3_bucket.avatars_private
}
