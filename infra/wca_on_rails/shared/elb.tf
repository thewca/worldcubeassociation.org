resource "aws_security_group" "lb" {
  name        = "${var.name_prefix}-load-balancer"
  description = "Production load balancer"
  vpc_id      = aws_default_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  ingress {
    from_port        = 80
    to_port          = 80
    protocol         = "tcp"
    ipv6_cidr_blocks = ["::/0"]
    description      = "Allow HTTP IPV6"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS"
  }

  ingress {
    from_port        = 443
    to_port          = 443
    protocol         = "tcp"
    ipv6_cidr_blocks = ["::/0"]
    description      = "Allow HTTPS IPV6"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all egress"
  }

  tags = {
    Name = "${var.name_prefix}-load-balancer"
  }
}

resource "aws_lb" "this" {
  name               = var.name_prefix
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb.id]
  subnets            = [aws_default_subnet.default_az1.id, aws_default_subnet.default_az2.id, aws_default_subnet.default_az3.id, aws_default_subnet.default_az4.id]
  ip_address_type    = "ipv4"

  idle_timeout = 60
}

data "aws_acm_certificate" "this" {
  domain   = "*.worldcubeassociation.org"
  statuses = ["ISSUED"]
}

resource "aws_lb_target_group" "rails-blue-green" {
  name        = "wca-main-production-${count.index}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"
  count = 2

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

resource "aws_lb_target_group" "auxiliary" {
  name        = "wca-main-staging"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
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

resource "aws_lb_target_group" "rails-staging" {
  name        = "wca-main-staging"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
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

resource "aws_lb_target_group" "pma-staging" {
  name        = "wca-main-pma"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
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

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn

  port            = 443
  protocol        = "HTTPS"
  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = data.aws_acm_certificate.this.arn

  default_action {
    target_group_arn = aws_lb_target_group.rails-blue-green[0].arn
    type             = "forward"
  }

  lifecycle {
    # The target group changes during Blue/Green deployment
    ignore_changes = [default_action]
  }

  tags = {
    Name = "${var.name_prefix}-https"
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn

  port     = 80
  protocol = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.name_prefix}-http"
  }
}

resource "aws_lb_listener_rule" "www_forward_prod" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auxiliary.arn
  }

  condition {
    host_header {
      values = ["www.worldcubeassociation.org"]
    }
  }
}

resource "aws_lb_listener_rule" "pma_forward_prod" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 2

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auxiliary.arn
  }

  condition {
    host_header {
      values = ["www.worldcubeassociation.org/results/database"]
    }
  }
}

resource "aws_lb_listener_rule" "rails_forward_staging" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.rails-staging.arn
  }

  condition {
    host_header {
      values = ["staging.worldcubeassociation.org"]
    }
  }
}

resource "aws_lb_listener_rule" "pma_forward_staging" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.pma-staging.arn
  }

  condition {
    host_header {
      values = ["staging.worldcubeassociation.org/results/database"]
    }
  }
}

output "lb_security" {
  value = aws_security_group.lb.id
}

output "https_listener" {
  value = aws_lb_listener.https
}

output "http_listener" {
  value = aws_lb_listener.http
}

output "lb" {
  value = aws_lb.this
}
output "rails-blue-green" {
  value = aws_lb_target_group.rails-blue-green
}

output "rails_staging"{
  value = aws_lb_target_group.rails-staging
}

output "pma_production"{
  value = aws_lb_target_group.auxiliary
}

output "pma_staging"{
  value = aws_lb_target_group.pma-staging
}
