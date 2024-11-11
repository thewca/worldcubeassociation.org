resource "aws_cloudwatch_log_group" "worker" {
  name = "${var.name_prefix}-sqs-worker"
}

resource "aws_ecs_task_definition" "worker" {
  family = "${var.name_prefix}-sqs-worker"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "1024"
  memory = "3911"

  container_definitions = jsonencode([

    {
      name              = "sqs-worker-staging"
      image             = "${var.shared.ecr_repository.repository_url}:staging-sqs-worker"
      cpu    = 1024
      memory = 3911
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
      healthCheck       = {
        command            = ["CMD-SHELL", "pgrep bundle || exit 1"]
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

resource "aws_ecs_service" "worker" {
  name                               = "${var.name_prefix}-sqs-worker"
  cluster                            = var.shared.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.worker.arn
  desired_count                      = 1
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
