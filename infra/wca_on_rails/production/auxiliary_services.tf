resource "aws_cloudwatch_log_group" "this" {
  name = var.name_prefix
}

resource "aws_lb_target_group" "auxiliary" {
  name        = "wca-main-staging"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.shared.vpc_id
  target_type = "ip"

  deregistration_delay = 10
  health_check {
    interval            = 60
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 5
    matcher             = 200
  }
  tags = {
    Name = var.name_prefix
    Env = "staging"
  }
}

resource "aws_ecs_task_definition" "auxiliary" {
  family = "${var.name_prefix}-auxiliary-services"

  network_mode             = "awsvpc"
  requires_compatibilities = ["EC2"]

  # We configure the roles to allow `aws ecs execute-command` into a task,
  # as in https://aws.amazon.com/blogs/containers/new-using-amazon-ecs-exec-access-your-containers-fargate-ec2
  execution_role_arn = aws_iam_role.task_execution_role.arn
  task_role_arn      = aws_iam_role.task_role.arn

  cpu = "1024"
  memory = "1548"

  container_definitions = jsonencode([
    {
      name              = "sidekiq-main"
      image             = "${var.shared.repository_url}:sidekiq-production"
      cpu    = 512
      memory = 1024
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
        command            = ["CMD-SHELL", "pgrep ruby || exit 1"]
        interval           = 30
        retries            = 3
        startPeriod        = 60
        timeout            = 5
      }
    },
    {
      name              = "pma-production"
      image             = "botsudo/phpmyadmin-snapshots:5.2-snapshot"
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
    capacity_provider = var.shared.capacity_provider.name
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
    target_group_arn = aws_lb_target_group.auxiliary.arn
    container_name   = "pma-production"
    container_port   = 80
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
