resource "aws_cloudwatch_log_group" "nextjs" {
  name = "${var.name_prefix}-next"
}

locals {
  # Most of these are placeholders, as secrets will be in stored in vault
  nextjs_environment = [
    {
      name  = "WCA_LIVE_SITE"
      value = var.WCA_LIVE_SITE
    },
    {
      name = "VAULT_ADDR",
      value = var.VAULT_ADDR
    },
    {
      name = "VAULT_APPLICATION"
      value = "wca-nextjs-production"
    },
    {
      name = "AWS_REGION"
      value = var.region
    },
    {
      name = "MEDIA_BUCKET"
      value = aws_s3_bucket.next-media.id
    },
    {
      name = "MEDIA_BUCKET_CDN"
      value = "https://assets-nextjs.worldcubeassociation.org"
    },
    {
      name  = "OIDC_ISSUER"
      value = "https://www.worldcubeassociation.org/"
    },
    {
      name  = "DATABASE_URI"
      value = "mongodb://payload-database-prod.cluster-comp2du1hpno.us-west-2.docdb.amazonaws.com:27017/payload?retryWrites=false"
    },
    {
      name  = "WCA_BACKEND_API_URL"
      value = "https://www.worldcubeassociation.org/api/"
    },
    {
      name  = "WCA_FRONTEND_API_URL"
      value = "https://www.worldcubeassociation.org/api/"
    },
    {
      name  = "PROPRIETARY_FONT"
      value = "TTNormsPro"
    },
    {
      name = "NEXTAUTH_URL"
      value = "https://${var.shared.next_url}"
    },
    {
      name = "TASK_ROLE",
      value = aws_iam_role.nextjs_role.name
    }
  ]
}

resource "aws_iam_role" "nextjs_role" {
  name               = "${var.name_prefix}-nextjs-task-role"
  assume_role_policy = data.aws_iam_policy_document.task_assume_role_policy.json
}

data "aws_iam_policy_document" "nextjs_task_policy" {
  statement {
    actions = [
      "ssmmessages:CreateControlChannel",
      "ssmmessages:CreateDataChannel",
      "ssmmessages:OpenControlChannel",
      "ssmmessages:OpenDataChannel",
      "rds-db:connect",
      "sts:GetCallerIdentity"
    ]

    resources = ["*"]
  }

  statement {
    actions = [
      "s3:*",
    ]

    resources = [aws_s3_bucket.next-media.arn,
      "${aws_s3_bucket.next-media.arn}/*",
      aws_s3_bucket.assets.arn,
      "${aws_s3_bucket.assets.arn}/*",]
  }
}

resource "aws_iam_role_policy" "nextjs_task_policy" {
  role   = aws_iam_role.nextjs_role.name
  policy = data.aws_iam_policy_document.nextjs_task_policy.json
}

resource "aws_ecs_task_definition" "nextjs" {
  family = "nextjs-production"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.nextjs_role.arn

  cpu = "1024"
  memory = "3910"

  container_definitions = jsonencode([
    {
      name              = "nextjs-production"
      image             = "${var.shared.next_repository_url}:nextjs-production"
      cpu    = 1024
      memory = 3910
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
      environment = local.nextjs_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "wget --spider -q http://localhost:3000/ || exit 1"]
        interval           = 30
        retries            = 3
        startPeriod        = 5
        timeout            = 5
      }
    }
    ])

  tags = {
    Name = "${var.name_prefix}-nextjs"
  }
}



data "aws_ecs_task_definition" "nextjs" {
  task_definition = aws_ecs_task_definition.nextjs.family
}

resource "aws_ecs_service" "nextjs" {
  name                               = "${var.name_prefix}-nextjs-production"
  cluster                            = var.shared.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.nextjs.arn
  desired_count                      = 1
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = 30

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
    type  = "binpack"
    field = "memory"
  }

  load_balancer {
    target_group_arn = var.shared.nextjs-production.arn
    container_name   = "nextjs-production"
    container_port   = 3000
  }

  network_configuration {
    security_groups = [var.shared.cluster_security.id]
    subnets         = var.shared.private_subnets[*].id
  }
  tags = {
    Name = var.name_prefix
  }
}
