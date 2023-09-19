resource "aws_cloudwatch_log_group" "this" {
  name = var.name_prefix
}

locals {
  pma_environment = [
    {
      name  = "PMA_CONFIG_BASE65"
      value = filebase64("../../templates/config.user.inc.php")
    },
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

  cpu = "1024"
  memory = "1024"

  container_definitions = jsonencode([
    {
      name              = "sidekiq"
      image             = "${aws_ecr_repository.this.repository_url}:sidekiq"
      cpu    = 512
      memory = 512
      portMappings = []
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.this.name
          awslogs-region        = var.region
          awslogs-stream-prefix = var.name_prefix
        }
      }
      environment = local.app_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "pgrep ruby || exit 1"]
        interval           = 30
        retries            = 3
        startPeriod        = 60
        timeout            = 5
      }
    },
    {
      name              = "phpmyadmin"
      image             = "${aws_ecr_repository.this.repository_url}:pma"
      cpu    = 512
      memory = 512
      portMappings = [{
        # The hostPort is automatically set for awsvpc network mode,
        # see https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_PortMapping.html#ECS-Type-PortMapping-hostPort
        containerPort = 8000
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
        command            = ["CMD-SHELL", "curl http://localhost:8000 || exit 1"]
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

resource "aws_ecs_service" "this" {
  name    = var.name_prefix
  cluster = var.shared_resources.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.this.arn
  desired_count                      = 1
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = 0

  capacity_provider_strategy {
    capacity_provider = var.shared_resources.capacity_provider.name
    weight            = 1
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
    target_group_arn = var.shared_resources.phpmyadmin_target_group.arn
    container_name   = "phpmyadmin"
    container_port   = 8000
  }

  network_configuration {
    security_groups = [var.shared_resources.cluster_security.id]
    subnets         = var.shared_resources.private_subnets
  }

  deployment_controller {
    type = "ECS"
  }

  tags = {
    Name = var.name_prefix
  }

  lifecycle {
    ignore_changes = [
      # The desired count is modified by Application Auto Scaling
      desired_count,
      # The Task definition will be set by Code Deploy
      task_definition
    ]
  }
}
