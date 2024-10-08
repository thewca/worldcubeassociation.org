resource "aws_ecs_cluster" "this" {
  name = var.name_prefix
}

resource "aws_security_group" "cluster" {
  name        = "${var.name_prefix}-cluster"
  description = "Main ECS cluster"
  vpc_id      = aws_default_vpc.default.id

  tags = {
    Name = "${var.name_prefix}-cluster"
  }
}

# Note: we use the standalone SG rules (rather than inline), because
# cluster_cluster_ingress references the SG itself

resource "aws_security_group_rule" "cluster_lb_ingress" {
  type                     = "ingress"
  security_group_id        = aws_security_group.cluster.id
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  source_security_group_id = aws_security_group.lb.id
  description              = "Load balancer ingress"
}

resource "aws_security_group_rule" "cluster_cluster_ingress" {
  type                     = "ingress"
  security_group_id        = aws_security_group.cluster.id
  from_port                = 0
  to_port                  = 0
  protocol                 = "-1"
  source_security_group_id = aws_security_group.cluster.id
  description              = "Allow ingress from other members of the cluster"
}

resource "aws_security_group_rule" "cluster_all_egress" {
  type              = "egress"
  security_group_id = aws_security_group.cluster.id
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all egress"
}

data "aws_ami" "ecs" {
  most_recent = true

  owners = ["amazon"]

  filter {
    name   = "owner-alias"
    values = ["amazon"]
  }

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-*"]
  }
}

data "aws_iam_policy_document" "ecs_instance_assume_role_policy" {
  statement {
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_instance_role" {
  name               = "${var.name_prefix}-ecs-instance-role"
  description        = "Allows ECS instances to call AWS services"
  assume_role_policy = data.aws_iam_policy_document.ecs_instance_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role_attachment" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.name_prefix}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

resource "aws_launch_configuration" "t3_launch_config" {
  name_prefix          = "${var.name_prefix}-t3-"
  image_id             = data.aws_ami.ecs.id
  iam_instance_profile = aws_iam_instance_profile.ecs_instance_profile.name
  instance_type        = "t3.large"
  security_groups      = [aws_security_group.cluster.id]
  user_data            = templatefile("../templates/user_data.sh.tftpl", { ecs_cluster_name = aws_ecs_cluster.this.name })


  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_launch_configuration" "m6i_launch_config" {
  name_prefix          = "${var.name_prefix}-m6i-"
  image_id             = data.aws_ami.ecs.id
  iam_instance_profile = aws_iam_instance_profile.ecs_instance_profile.name
  instance_type        = "m6i.large"
  security_groups      = [aws_security_group.cluster.id]
  user_data            = templatefile("../templates/user_data.sh.tftpl", { ecs_cluster_name = aws_ecs_cluster.this.name })


  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "t3_group" {
  name_prefix               = "${var.name_prefix}-t3-"
  min_size                  = 1
  max_size                  = 6
  desired_capacity          = 1
  vpc_zone_identifier       = [aws_default_subnet.default_az2.id]
  launch_configuration      = aws_launch_configuration.t3_launch_config.name
  health_check_grace_period = var.rails_startup_time
  health_check_type         = "EC2"
  default_cooldown          = 300

  # Necessary when using managed termination provider on capacity provider
  protect_from_scale_in = true

  # Note: this tag is automatically added when adding ECS Capacity Provider
  # to the ASG and we need to reflect it in the config
  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = var.name_prefix
    propagate_at_launch = true
  }

  tag {
    key                 = "Description"
    value               = "Assigned to ${aws_ecs_cluster.this.name} ECS cluster, managed by ASG"
    propagate_at_launch = true
  }


  lifecycle {
    create_before_destroy = true

    # The desired count is modified by Application Auto Scaling
    ignore_changes = [desired_capacity]
  }
}

resource "aws_autoscaling_group" "m6i_group" {
  name_prefix               = "${var.name_prefix}-m6i-"
  min_size                  = 2
  max_size                  = 10
  desired_capacity          = 0
  vpc_zone_identifier       = [aws_default_subnet.default_az2.id]
  launch_configuration      = aws_launch_configuration.m6i_launch_config.name
  health_check_grace_period = var.rails_startup_time
  health_check_type         = "EC2"
  default_cooldown          = 300

  # Necessary when using managed termination provider on capacity provider
  protect_from_scale_in = true

  # Note: this tag is automatically added when adding ECS Capacity Provider
  # to the ASG and we need to reflect it in the config
  tag {
    key                 = "AmazonECSManaged"
    value               = true
    propagate_at_launch = true
  }

  tag {
    key                 = "Name"
    value               = var.name_prefix
    propagate_at_launch = true
  }

  tag {
    key                 = "Description"
    value               = "Assigned to ${aws_ecs_cluster.this.name} ECS cluster, managed by ASG"
    propagate_at_launch = true
  }


  lifecycle {
    create_before_destroy = true

    # The desired count is modified by Application Auto Scaling
    ignore_changes = [desired_capacity]
  }
}

resource "aws_ecs_capacity_provider" "t3_provider" {
  name = "${var.name_prefix}-t3"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.t3_group.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = 4
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }
}

resource "aws_ecs_capacity_provider" "m6i_provider" {
  name = "${var.name_prefix}-m6i"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.m6i_group.arn
    managed_termination_protection = "ENABLED"

    managed_scaling {
      maximum_scaling_step_size = 4
      minimum_scaling_step_size = 1
      status                    = "ENABLED"
      target_capacity           = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = [aws_ecs_capacity_provider.t3_provider.name, aws_ecs_capacity_provider.m6i_provider.name]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.t3_provider.name
    weight            = 1
  }
}

resource "aws_ecr_repository" "this" {
  name         = var.name_prefix
  force_delete = true
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire images older than 14 days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 14
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "ecr_repository" {
  value = aws_ecr_repository.this
}

output "ecs_cluster" {
  value = aws_ecs_cluster.this
}

output "t3_capacity_provider" {
  value = aws_ecs_capacity_provider.t3_provider
}

output "m6i_capacity_provider" {
  value = aws_ecs_capacity_provider.m6i_provider
}

output "cluster_security" {
  value = aws_security_group.cluster
}
