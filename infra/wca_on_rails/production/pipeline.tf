resource "aws_s3_bucket" "this" {
  bucket        = var.name_prefix
  force_destroy = true
}

resource "aws_s3_bucket_lifecycle_configuration" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    id = "rule-1"

    filter {}

    expiration {
      days = 30
    }

    status = "Enabled"
  }
}

# Notification on deploy events

resource "aws_sns_topic" "deploy_notifications" {
  name = "deploy-notifications"
}

resource "aws_sns_topic_subscription" "deploy_notifications_email_target" {
  topic_arn = aws_sns_topic.deploy_notifications.arn
  protocol  = "email"
  endpoint  = "admin@worldcubeassociation.org"
}


data "aws_iam_policy_document" "notification_access" {
  statement {
    actions = ["sns:Publish"]

    principals {
      type        = "Service"
      identifiers = ["codestar-notifications.amazonaws.com"]
    }

    resources = [aws_sns_topic.deploy_notifications.arn]
  }
}

resource "aws_sns_topic_policy" "default" {
  arn    = aws_sns_topic.deploy_notifications.arn
  policy = data.aws_iam_policy_document.notification_access.json
}
