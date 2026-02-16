resource "aws_cloudwatch_log_group" "this" {
  name = var.name_prefix
}

locals {
  rails_environment = [
    {
      name  = "WCA_LIVE_SITE"
      value = var.WCA_LIVE_SITE
    },
    {
      name  = "ROOT_URL"
      value = var.ROOT_URL
    },
    {
      name  = "OIDC_ISSUER"
      value = var.ROOT_URL
    },
    {
      name  = "OIDC_ALGORITHM"
      value = "RS256"
    },
    {
      name = "DATABASE_HOST"
      value = "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
    },
    {
      name = "WCA_REGISTRATIONS_POLL_URL"
      value = "https://1rq8d7dif3.execute-api.us-west-2.amazonaws.com/v1/staging"
    },
    {
      name  = "ASSET_HOST"
      value = "https://assets-staging.worldcubeassociation.org"
    },
    {
      name  = "DUMP_HOST"
      value = "https://assets.worldcubeassociation.org"
    },
    {
      name  = "SHAKAPACKER_ASSET_HOST"
      value = "https://assets-staging.worldcubeassociation.org"
    },
    {
      name = "READ_REPLICA_HOST"
      value = "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
    },
    {
      name = "DEV_DUMP_HOST"
      value = "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
    },
    {
      name = "CACHE_REDIS_URL"
      value = "redis://redis-main-staging-001.iebvzt.0001.usw2.cache.amazonaws.com:6379"
    },
    {
      name = "SIDEKIQ_REDIS_URL"
      value = "redis://wca-staging-sidekiq-001.iebvzt.0001.usw2.cache.amazonaws.com:6379"
    },
    {
      name = "STAGING_OAUTH_URL"
      value = "https://www.worldcubeassociation.org"
    },
    {
      name = "STORAGE_AWS_BUCKET"
      value = aws_s3_bucket.storage-bucket.id
    },
    {
      name = "REGISTRATION_QUEUE"
      value = aws_sqs_queue.this.url
    },
    {
      name = "LIVE_QUEUE"
      value = aws_sqs_queue.results.url
    },
    {
      name = "AWS_REGION"
      value = var.region
    },
    {
      name = "DISCOURSE_URL"
      value = var.DISCOURSE_URL
    },
    {
      name = "S3_AVATARS_BUCKET"
      value = aws_s3_bucket.avatars.id
    },
    {
      name = "S3_AVATARS_PRIVATE_BUCKET"
      value = aws_s3_bucket.avatars_private.id
    },
    {
      name = "S3_AVATARS_ASSET_HOST"
      value = "https://avatars.worldcubeassociation.org"
    },
    {
      name = "AVATARS_PUBLIC_STORAGE"
      value = "s3_avatars_public"
    },
    {
      name = "AVATARS_PRIVATE_STORAGE"
      value = "s3_avatars_private"
    },
    {
      name = "CDN_AVATARS_DISTRIBUTION_ID"
      value = "ELNTWW0SE1ZJ"
    },
    {
      name = "CDN_ASSETS_DISTRIBUTION_ID"
      value = "E3AXWQVI864TGL"
    },
    {
      name = "DATABASE_WRT_USER"
      value = var.DATABASE_WRT_USER
    },
    {
      name = "DATABASE_WRT_SENIOR_USER"
      value = var.DATABASE_WRT_SENIOR_USER
    },
    {
      name = "WRC_WEBHOOK_URL",
      value = var.WRC_WEBHOOK_URL
    },
    {
      name = "WCA_REGISTRATIONS_URL"
      value = var.WCA_REGISTRATIONS_URL
    },
    {
      name = "WCA_REGISTRATIONS_CDN_URL"
      value = var.WCA_REGISTRATIONS_CDN_URL
    },
    {
      name = "VAULT_ADDR"
      value = var.VAULT_ADDR
    },
    {
      name = "VAULT_APPLICATION"
      value = var.VAULT_APPLICATION
    },
    {
      name = "TASK_ROLE",
      value = aws_iam_role.task_role.name
    },
    {
      name = "PAYPAL_BASE_URL",
      value = "https://api-m.sandbox.paypal.com"
    }
  ]
  pma_environment = [
    { # The PHPMyAdmin Docker file allows us to pass the user config as a base 64 encoded environment variable
      name = "PMA_USER_CONFIG_BASE64"
      value = base64encode(templatefile("../templates/config.user.inc.php.tftpl",
        { rds_host: "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com",
          # There is no read only or dump replica on staging
          rds_replica_host: "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com",
          dump_replica_host: "staging-v2-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"}))
    }
  ]
}

data "aws_iam_policy_document" "task_assume_role_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "task_execution_role" {
  name               = "${var.name_prefix}-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "task_execution_role_attachment" {
  role       = aws_iam_role.task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "task_role" {
  name               = "${var.name_prefix}-task-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume_role_policy.json
}

data "aws_iam_policy_document" "task_policy" {
  statement {
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
    ]

    resources = ["*"]
  }

  statement {
      actions = [
        "s3:*",
      ]

      resources = [aws_s3_bucket.storage-bucket.arn,
                "${aws_s3_bucket.storage-bucket.arn}/*",
                    aws_s3_bucket.avatars_private.arn,
                  "${aws_s3_bucket.avatars_private.arn}/*"]
    }

  statement {
    actions = [
      "s3:Get*",
      "s3:List*",
      "s3:Describe*"
    ]

    resources = [aws_s3_bucket.avatars.arn,
      "${aws_s3_bucket.avatars.arn}/*"]
  }

  statement {
    actions = [
      "rds-db:connect",
    ]
    resources = ["arn:aws:rds-db:${var.region}:${var.shared.account_id}:dbuser:${var.rds_iam_identifier}/${var.DATABASE_WRT_USER}", "arn:aws:rds-db:${var.region}:${var.shared.account_id}:dbuser:${var.rds_iam_identifier}/${var.DATABASE_WRT_SENIOR_USER}"]
  }
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:GetQueueUrl"
    ]
    resources = [aws_sqs_queue.this.arn, aws_sqs_queue.results.arn]
  }
}

resource "aws_iam_role_policy" "task_policy" {
  role   = aws_iam_role.task_role.name
  policy = data.aws_iam_policy_document.task_policy.json
}

resource "aws_ecs_task_definition" "api" {
  family = "${var.name_prefix}-api"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "1024"
  memory = "2048"

  container_definitions = jsonencode([
    {
      name              = "rails-staging-api"
      image             = "${var.shared.ecr_repository.repository_url}:staging-api"
      cpu    = 1024
      memory = 2048
      portMappings = [
        {
          # The hostPort is automatically set for awsvpc network mode,
          # see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_PortMapping.html#ECS-Type-PortMapping-hostPort
          containerPort = 3000
          protocol      = "tcp"
        },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name_prefix
        }
      }
      environment = local.rails_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "curl -f http://localhost:3000/api/v0/healthcheck || exit 1"]
        interval           = 10
        retries            = 3
        startPeriod        = 60
        timeout            = 5
      }
    }
  ])

  tags = {
    Name = var.name_prefix
  }
}

resource "aws_ecs_task_definition" "this" {
  family = var.name_prefix

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "1024"
  memory = "3900"

  container_definitions = jsonencode([
    {
      name              = "rails-staging"
      image             = "${var.shared.ecr_repository.repository_url}:staging"
      cpu    = 1024
      memory = 3900

      portMappings = [
        {
          # The hostPort is automatically set for awsvpc network mode,
          # see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_PortMapping.html#ECS-Type-PortMapping-hostPort
          containerPort = 3000
          protocol      = "tcp"
        },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name_prefix
        }
      }
      environment = local.rails_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"]
        interval           = 10
        retries            = 3
        startPeriod        = 60
        timeout            = 5
      }
    },
    ])

  tags = {
    Name = var.name_prefix
  }
}



data "aws_ecs_task_definition" "this" {
  task_definition = aws_ecs_task_definition.this.family
}

data "aws_ecs_task_definition" "api" {
  task_definition = aws_ecs_task_definition.api.family
}

resource "aws_ecs_service" "rails" {
  name                               = var.name_prefix
  cluster                            = var.shared.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.this.arn
  desired_count                      = 1
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = var.rails_startup_time

  capacity_provider_strategy {
    capacity_provider = var.shared.t3_capacity_provider.name
    weight            = 1
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "instanceId"
  }

  load_balancer {
    target_group_arn = var.shared.rails_staging.arn
    container_name   = "rails-staging"
    container_port   = 3000
  }

  network_configuration {
    security_groups = [var.shared.cluster_security.id]
    subnets         = var.shared.private_subnets[*].id
  }

  deployment_controller {
    type = "ECS"
  }

  tags = {
    Name = var.name_prefix
  }

}

resource "aws_ecs_service" "api" {
  name                               = "${var.name_prefix}-API"
  cluster                            = var.shared.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.api.arn
  desired_count                      = 1
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = var.rails_startup_time

  capacity_provider_strategy {
    capacity_provider = var.shared.t3_capacity_provider.name
    weight            = 1
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  enable_execute_command = true

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "instanceId"
  }

  load_balancer {
    target_group_arn = var.shared.rails_staging-api.arn
    container_name   = "rails-staging-api"
    container_port   = 3000
  }

  network_configuration {
    security_groups = [var.shared.cluster_security.id]
    subnets         = var.shared.private_subnets[*].id
  }

  deployment_controller {
    type = "ECS"
  }

  tags = {
    Name = var.name_prefix
  }

}
