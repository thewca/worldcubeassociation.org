# Staging counterpart of production/uploads.tf. See that file for rationale.

locals {
  uploads_domain = "uploads-staging.worldcubeassociation.org"

  # CloudFront only accepts certificates from us-east-1. This is the existing
  # *.worldcubeassociation.org wildcard, which already covers this subdomain.
  uploads_certificate_arn = "arn:aws:acm:us-east-1:285938427530:certificate/6321eba4-2c0b-4b4e-bf4e-b09d48780560"

  # AWS-managed policy IDs (stable across accounts).
  cloudfront_caching_optimized_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
  cloudfront_security_headers_policy_id  = "67f7725c-6f97-4210-82d7-5512b31e9d03"
}

resource "aws_s3_bucket" "uploads" {
  bucket = "wca-uploads-staging"
  tags = {
    "Name" = "wca-uploads-staging"
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = false
}

resource "aws_cloudfront_origin_access_control" "uploads" {
  name                              = "wca-uploads-staging"
  description                       = "OAC for public attachment uploads (staging)"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "uploads" {
  enabled     = true
  comment     = "Public attachments (UploadController) - staging"
  aliases     = [local.uploads_domain]
  price_class = "PriceClass_100"

  origin {
    origin_id                = "uploads-s3"
    domain_name              = aws_s3_bucket.uploads.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.uploads.id
  }

  default_cache_behavior {
    target_origin_id       = "uploads-s3"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    cache_policy_id            = local.cloudfront_caching_optimized_policy_id
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
    "Name" = local.uploads_domain
  }
}

resource "aws_s3_bucket_policy" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontRead"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.uploads.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.uploads.arn
          }
        }
      },
    ]
  })
}

# DNS is managed outside Terraform, so uploads-staging.worldcubeassociation.org
# has to be created by hand as an A/ALIAS record in the worldcubeassociation.org
# zone, pointing at this value.
output "uploads_cloudfront_domain" {
  value = aws_cloudfront_distribution.uploads.domain_name
}
