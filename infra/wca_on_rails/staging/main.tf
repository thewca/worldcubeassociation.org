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
      name = "DATABASE_HOST"
      value = "staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
    },
    {
      name = "WCA_REGISTRATIONS_POLL_URL"
      value = "https://1rq8d7dif3.execute-api.us-west-2.amazonaws.com/v1/staging"
    },
    {
      name = "READ_REPLICA_HOST"
      value = "readonly-staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com"
    },
    {
      name = "CACHE_REDIS_URL"
      value = "redis://redis-main-staging-001.iebvzt.0001.usw2.cache.amazonaws.com:6379"
    },
    {
      name = "SIDEKIQ_REDIS_URL"
      value = "redis://redis-main-staging-001.iebvzt.0001.usw2.cache.amazonaws.com:6379"
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
      name = "STORAGE_AWS_REGION"
      value = var.region
    },
    {
      name = "VAULT_AWS_REGION"
      value = var.region
    },
    {
      name = "S3_AVATARS_REGION"
      value = var.region
    },
    {
      name = "DATABASE_AWS_REGION"
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
      name = "S3_AVATARS_ASSET_HOST"
      value = "https://avatars.worldcubeassociation.org"
    },
    {
      name = "CDN_AVATARS_DISTRIBUTION_ID"
      value = "ELNTWW0SE1ZJ"
    },
    {
      name = "DATABASE_WRT_USER"
      value = var.DATABASE_WRT_USER
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
        { rds_host: "staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com",
          rds_replica_host: "readonly-staging-worldcubeassociation-dot-org.comp2du1hpno.us-west-2.rds.amazonaws.com" }))
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

      resources = [aws_s3_bucket.avatars.arn,
                "${aws_s3_bucket.avatars.arn}/*",
                   aws_s3_bucket.storage-bucket.arn,
                "${aws_s3_bucket.storage-bucket.arn}/*"]
    }
  statement {
    actions = [
      "rds-db:connect",
    ]
    resources = ["arn:aws:rds-db:${var.region}:${var.shared.account_id}:dbuser:${var.rds_iam_identifier}/${var.DATABASE_WRT_USER}"]
  }
}

resource "aws_iam_role_policy" "task_policy" {
  role   = aws_iam_role.task_role.name
  policy = data.aws_iam_policy_document.task_policy.json
}

resource "aws_ecs_task_definition" "this" {
  family = var.name_prefix

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  # This is what our current staging instance is using
  cpu = "2048"
  memory = "7861"

  container_definitions = jsonencode([
    {
      name              = "rails-staging"
      image             = "${var.shared.ecr_repository.repository_url}:staging"
      cpu    = 1536
      memory = 5500
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
        interval           = 30
        retries            = 3
        startPeriod        = 300
        timeout            = 5
      }
    },
    {
      name              = "sidekiq-staging"
      image             = "${var.shared.ecr_repository.repository_url}:sidekiq-staging"
      cpu    = 256
      memory = 1849
      portMappings = [{
        # Mailcatcher
        containerPort = 1080
        protocol      = "tcp"
      }]
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
        command            = ["CMD-SHELL", "pgrep ruby || exit 1"]
        interval           = 30
        retries            = 3
        startPeriod        = 60
        timeout            = 5
      }
    },
    {
      name              = "pma-staging"
      image             = "${var.shared.ecr_repository.repository_url}:pma"
      cpu    = 256
      memory = 512
      portMappings = [{
        # The hostPort is automatically set for awsvpc network mode,
        # see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_PortMapping.html#ECS-Type-PortMapping-hostPort
        containerPort = 80
        protocol      = "tcp"
      }]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name_prefix
        }
      }
      environment = local.pma_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "curl -f http://localhost/LICENSE || exit 1"]
        interval           = 30
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



data "aws_ecs_task_definition" "this" {
  task_definition = aws_ecs_task_definition.this.family
}

resource "aws_ecs_task_definition" "db-reset" {
  family = "${var.name_prefix}-db-reset"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  # This is what our current staging instance is using
  cpu = "2048"
  memory = "7861"

  container_definitions = jsonencode([
    {
      name              = "rails-staging-db-reset"
      image             = "${var.shared.ecr_repository.repository_url}:staging"
      cpu    = 2048
      memory = 7861
      command = ["./bin/rake","db:load:development"]
      portMappings = []
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name_prefix
        }
      }
      environment = local.rails_environment
    }
  ])

  tags = {
    Name = "${var.name_prefix}-db-reset"
  }
}



data "aws_ecs_task_definition" "db-reset" {
  task_definition = aws_ecs_task_definition.this.family
}

resource "aws_ecs_service" "this" {
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

  load_balancer {
    target_group_arn = var.shared.pma_staging.arn
    container_name   = "pma-staging"
    container_port   = 80
  }

  load_balancer {
    target_group_arn = var.shared.mailcatcher.arn
    container_name   = "sidekiq-staging"
    container_port   = 1080
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
