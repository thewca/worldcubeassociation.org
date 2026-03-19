locals {
  any_cable_environment = [
    {
      name  = "ANYCABLE_HOST"
      value = "0.0.0.0"
    },
    {
      name  = "ANYCABLE_PORT"
      value = "8085"
    },
    {
      name  = "ANYCABLE_NOAUTH"
      value = 1
    },
    {
      name  = "ANYCABLE_PUBSUB"
      value = "redis"
    },
    {
      name  = "ANYCABLE_PUBLIC"
      value = 1
    },
    {
      name = "ANYCABLE_REDIS_URL",
      value = "redis://wca-staging-sidekiq-001.iebvzt.0001.usw2.cache.amazonaws.com:6379"
    }
  ]
}

resource "aws_cloudwatch_log_group" "anycable" {
  name = "${var.name_prefix}-anycable"
}

resource "aws_ecs_task_definition" "anycable" {
  family = "${var.name_prefix}-anycable"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "512"
  memory = "1955"

  container_definitions = jsonencode([

    {
      name              = "anycable-staging"
      image             = "anycable/anycable-go:1.6"
      cpu    = 512
      memory = 1955
      portMappings = [
        {
          containerPort = 8085
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
      environment = local.any_cable_environment
      healthCheck       = {
        command            = ["CMD-SHELL", "pgrep go || exit 1"]
        interval           = 30
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

data "aws_ecs_task_definition" "worker" {
  task_definition = aws_ecs_task_definition.worker.family
}

resource "aws_ecs_service" "anycable" {
  name                               = "${var.name_prefix}-anycable"
  cluster                            = var.shared.ecs_cluster.id
  task_definition                    = data.aws_ecs_task_definition.worker.arn
  desired_count                      = 2
  scheduling_strategy                = "REPLICA"
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 50
  health_check_grace_period_seconds  = 0

  capacity_provider_strategy {
    capacity_provider = var.shared.t3_capacity_provider.name
    weight            = 1
  }

  enable_execute_command = true

  deployment_circuit_breaker {
    enable   = true
    rollback = false
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "attribute:ecs.availability-zone"
  }

  ordered_placement_strategy {
    type  = "spread"
    field = "instanceId"
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
