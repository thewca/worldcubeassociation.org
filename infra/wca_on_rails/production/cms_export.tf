# Daily sanitized export of the Payload CMS database (DocumentDB) to S3.
#
# Runs next-frontend/export-dump.sh inside the production Next.js image: it
# mongodumps the `payload` database, sanitizes PII via sanitize-dump.mjs, and
# uploads the zip to s3://assets.worldcubeassociation.org/export/payload/dump.zip.
# The result is consumed by next-frontend/import-dump.sh for local development.

resource "aws_ecs_task_definition" "cms_export" {
  family = "nextjs-cms-export-production"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  execution_role_arn = aws_iam_role.task_execution_role.arn
  # Reuse the Next.js task role: it already has DocumentDB (MONGODB-AWS) access
  # and S3 write access to the assets bucket.
  task_role_arn = aws_iam_role.nextjs_role.arn

  cpu    = "1024"
  memory = "3910"

  container_definitions = jsonencode([
    {
      name   = "nextjs-cms-export"
      image  = "${var.shared.next_repository_url}:nextjs-production"
      cpu    = 1024
      memory = 3910
      # export-dump.sh installs mongodb-tools/aws-cli/zip via apk, which needs root.
      user = "root"
      # Bypass the default entrypoint (which boots the Next.js server) and run
      # the export script from /app (where global-bundle.pem lives).
      entryPoint       = ["/bin/sh", "/app/export-dump.sh"]
      workingDirectory = "/app"
      essential        = true
      environment      = local.nextjs_environment
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.nextjs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "${var.name_prefix}-cms-export"
        }
      }
    }
  ])

  tags = {
    Name = "${var.name_prefix}-cms-export"
  }
}

# --- EventBridge Scheduler role: allowed to run the export task ---

data "aws_iam_policy_document" "cms_export_scheduler_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cms_export_scheduler" {
  name               = "${var.name_prefix}-cms-export-scheduler"
  assume_role_policy = data.aws_iam_policy_document.cms_export_scheduler_assume.json
}

data "aws_iam_policy_document" "cms_export_scheduler" {
  statement {
    actions   = ["ecs:RunTask"]
    resources = ["${aws_ecs_task_definition.cms_export.arn_without_revision}:*"]

    condition {
      test     = "ArnLike"
      variable = "ecs:cluster"
      values   = [var.shared.ecs_cluster.id]
    }
  }

  statement {
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.nextjs_role.arn, aws_iam_role.task_execution_role.arn]
  }
}

resource "aws_iam_role_policy" "cms_export_scheduler" {
  role   = aws_iam_role.cms_export_scheduler.name
  policy = data.aws_iam_policy_document.cms_export_scheduler.json
}

# --- The daily schedule ---

resource "aws_scheduler_schedule" "cms_export" {
  name = "${var.name_prefix}-cms-export"

  flexible_time_window {
    mode = "OFF"
  }

  schedule_expression          = "cron(0 4 * * ? *)" # 04:00 UTC daily
  schedule_expression_timezone = "UTC"

  target {
    arn      = var.shared.ecs_cluster.id
    role_arn = aws_iam_role.cms_export_scheduler.arn

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.cms_export.arn
      task_count          = 1

      capacity_provider_strategy {
        capacity_provider = var.shared.t3_capacity_provider.name
        weight            = 1
      }

      network_configuration {
        security_groups = [var.shared.cluster_security.id]
        subnets         = var.shared.private_subnets[*].id
      }
    }
  }
}