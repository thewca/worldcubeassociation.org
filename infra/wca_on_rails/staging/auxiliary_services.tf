resource "aws_cloudwatch_log_group" "auxiliary" {
  name = "${var.name_prefix}-auxiliary"
}

resource "aws_ecs_task_definition" "auxiliary" {
  family = "${var.name_prefix}-auxiliary-services"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "512"
  memory = "1536"

  container_definitions = jsonencode([

    {
      name              = "sidekiq-staging"
      image             = "${var.shared.ecr_repository.repository_url}:sidekiq-staging"
      cpu    = 256
      memory = 1024
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

data "aws_ecs_task_definition" "auxiliary" {
  task_definition = aws_ecs_task_definition.auxiliary.family
}

resource "aws_ecs_service" "auxiliary" {
  name                               = "${var.name_prefix}-auxiliary-services"
  cluster                            = var.shared.ecs_cluster.id
  # During deployment a new task revision is created with modified
  # container image, so we want use data.aws_ecs_task_definition to
  # always point to the active task definition
  task_definition                    = data.aws_ecs_task_definition.auxiliary.arn
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

  load_balancer {
    target_group_arn = var.shared.pma_staging.arn
    container_name   = "pma-staging"
    container_port   = 80
  }

  load_balancer {
    target_group_arn = var.shared.mailcatcher.arn
    # This is mailcatcher running on the sidekiq container
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
