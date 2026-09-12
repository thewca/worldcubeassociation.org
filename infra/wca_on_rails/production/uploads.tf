# Public attachments uploaded via UploadController (post/competition-tab images).
#
# These used to live in the default ActiveStorage bucket
# (www.worldcubeassociation.org), which sits behind no CDN. They were served via
# presigned-URL redirects straight off S3, which cost ~$100/mo in egress. Serving
# them through CloudFront makes the S3->CloudFront transfer free.
#
# Deliberately NOT reusing assets.worldcubeassociation.org: that bucket has
# lifecycle rules expiring assets/ after 90 days and export/ after 7, and these
# uploads are permanent.

locals {
  uploads_public_domain = "uploads.worldcubeassociation.org"

  # CloudFront only accepts certificates from us-east-1. This is the existing
  # *.worldcubeassociation.org wildcard, which already covers this subdomain.
  uploads_certificate_arn = "arn:aws:acm:us-east-1:285938427530:certificate/6321eba4-2c0b-4b4e-bf4e-b09d48780560"

  # AWS-managed policy IDs (stable across accounts).
  cloudfront_caching_optimized_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  cloudfront_security_headers_policy_id  = "67f7725c-6f97-4210-82d7-5512b31e9d03"
}

resource "aws_s3_bucket" "uploads_public" {
  bucket = "wca-uploads-public"
  tags = {
    "Name" = "wca-uploads-public"
  }
}

# The bucket stays private; CloudFront reaches it via OAC.
resource "aws_s3_bucket_public_access_block" "uploads_public" {
  bucket = aws_s3_bucket.uploads_public.id

  block_public_acls       = true
  block_public_policy     = false # the CloudFront OAC policy below is not "public", but keep this explicit
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_cloudfront_origin_access_control" "uploads_public" {
  name                              = "wca-uploads-public"
  description                       = "OAC for public attachment uploads"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "uploads_public" {
  enabled     = true
  comment     = "Public attachments (UploadController)"
  aliases     = [local.uploads_public_domain]
  price_class = "PriceClass_All"

  origin {
    origin_id                = "uploads-s3"
    domain_name              = aws_s3_bucket.uploads_public.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads_public.id
  }

  default_cache_behavior {
    target_origin_id       = "uploads-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    # ActiveStorage keys are content-addressed, so objects are effectively
    # immutable and safe to cache aggressively.
    cache_policy_id = local.cloudfront_caching_optimized_policy_id

    # Sends nosniff/frame-options/etc. Worth having given uploads are untrusted.
    response_headers_policy_id = local.cloudfront_security_headers_policy_id
  }

  viewer_certificate {
    acm_certificate_arn      = local.uploads_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    "Name" = local.uploads_public_domain
  }
}

resource "aws_s3_bucket_policy" "uploads_public" {
  bucket = aws_s3_bucket.uploads_public.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontRead"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.uploads_public.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.uploads_public.arn
          }
        }
      },
    ]
  })
}

output "uploads_public_cloudfront_domain" {
  value = aws_cloudfront_distribution.uploads_public.domain_name
}

# No CloudFront and no bucket policy, deliberately: these are never served
# straight from storage. The Controller authorises the viewer and then
# redirects to a short-lived presigned URL, so a CDN in front of this bucket
# would only cache content past the point where the viewer is allowed to see it.
resource "aws_s3_bucket" "uploads_private" {
  bucket = "wca-uploads-private"
  tags = {
    "Name" = "wca-uploads-private"
  }
}

# Unlike the public bucket, nothing outside the Rails app should ever reach this
# one, so every escape hatch is shut.
resource "aws_s3_bucket_public_access_block" "uploads_private" {
  bucket = aws_s3_bucket.uploads_private.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
