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
    from_port   = 444
    to_port     = 444
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow Mailcatcher"
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
  subnets            = [aws_default_subnet.default_az1.id,"subnet-0349cc3938fa60ef5", aws_default_subnet.default_az3.id, aws_default_subnet.default_az4.id]
  ip_address_type    = "ipv4"
  enable_deletion_protection = true

  access_logs {
    prefix = "elb-access-logs/log"
    enabled = true
    bucket = "wca-on-rails-prod"
  }

  idle_timeout = 60
}

data "aws_acm_certificate" "this" {
  domain   = "*.worldcubeassociation.org"
  statuses = ["ISSUED"]
}

resource "aws_lb_target_group" "rails-production" {
  name        = "wca-main-production-${count.index}"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"
  count = 2

  deregistration_delay = 10
  health_check {
    interval            = 10
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
    Env = "production"
  }
}

resource "aws_lb_target_group" "nextjs-production" {
  name        = "nextjs-production"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"

  deregistration_delay = 10
  health_check {
    interval            = 10
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 5
    matcher             = 200
  }
  tags = {
    Name = "${var.name_prefix}-nextjs"
    Env = "production"
  }
}

resource "aws_lb_target_group" "auxiliary" {
  name        = "wca-auxiliary"
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
    Env = "production"
  }
}

resource "aws_lb_target_group" "rails-staging" {
  name        = "wca-rails-staging"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"

  deregistration_delay = 10
  health_check {
    interval            = 5
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 2
    healthy_threshold   = 2
    unhealthy_threshold = 5
    matcher             = 200
  }
  tags = {
    Name = var.name_prefix
    Env = "staging"
  }
}

resource "aws_lb_target_group" "rails-staging-api" {
  name        = "wca-rails-staging-api"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_default_vpc.default.id
  target_type = "ip"

  deregistration_delay = 10
  health_check {
    interval            = 5
    path                = "/api/v0/healthcheck"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 2
    healthy_threshold   = 2
    unhealthy_threshold = 5
    matcher             = 200
  }
  tags = {
    Name = var.name_prefix
    Env = "staging"
  }
}

resource "aws_lb_target_group" "mailcatcher-staging" {
  name        = "wca-staging-mailcatcher"
  port        = 1080
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
    Name = "${var.name_prefix}-mailcatcher"
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
  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn = data.aws_acm_certificate.this.arn

  default_action {
    target_group_arn = aws_lb_target_group.rails-production[0].arn
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

resource "aws_lb_listener" "mailcatcher" {
  load_balancer_arn = aws_lb.this.arn

  port            = 444
  protocol        = "HTTPS"
  ssl_policy      = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn = data.aws_acm_certificate.this.arn

  default_action {
    target_group_arn = aws_lb_target_group.mailcatcher-staging.arn
    type             = "forward"
  }

  tags = {
    Name = "${var.name_prefix}-mailcatcher"
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

resource "aws_lb_listener_rule" "pma_forward_prod" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 4

  action {
    authenticate_oidc {
      authorization_endpoint = "https://www.worldcubeassociation.org/oauth/authorize"
      client_id              = "B9ntPrf7icOTdAXUYAePf1Y_T2AMnhwQJsYdme95FC4"
      client_secret          = var.pma_auth_secret
      issuer                 = "https://www.worldcubeassociation.org"
      token_endpoint         = "https://www.worldcubeassociation.org/oauth/token"
      user_info_endpoint     = "https://www.worldcubeassociation.org/oauth/userinfo"
      scope                  = "openid"
      session_cookie_name    = "AWSELBAuthSessionCookie"
      on_unauthenticated_request = "authenticate"
    }
    type = "authenticate-oidc"
  }
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.auxiliary.arn
  }

  condition {
    host_header {
      values = ["www.worldcubeassociation.org","worldcubeassociation.org"]
    }
  }

  condition {
    path_pattern {
      values = ["/results/database*"]
    }
  }
}

locals {
  next_url = "next70912409871254.worldcubeassociation.org"
}

resource "aws_lb_listener_rule" "next_forward_prod" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nextjs-production.arn
  }

  condition {
    host_header {
      values = [local.next_url]
    }
  }
}

resource "aws_lb_listener_rule" "rails_forward_staging" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 5

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

resource "aws_lb_listener_rule" "rails_forward_staging_api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 3

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.rails-staging-api.arn
  }

  condition {
    host_header {
      values = ["staging.worldcubeassociation.org"]
    }
  }

  condition {
    path_pattern {
      values = ["/api*"]
    }
  }
}

resource "aws_lb_listener_rule" "pma_forward_staging" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1

  action {
    authenticate_oidc {
      authorization_endpoint = "https://staging.worldcubeassociation.org/oauth/authorize"
      client_id              = "example-application-id"
      client_secret          = "example-secret"
      issuer                 = "https://staging.worldcubeassociation.org"
      token_endpoint         = "https://staging.worldcubeassociation.org/oauth/token"
      user_info_endpoint     = "https://staging.worldcubeassociation.org/oauth/userinfo"
      scope                  = "openid"
      session_cookie_name    = "AWSELBAuthSessionCookieStaging"
      on_unauthenticated_request = "authenticate"
    }
    type = "authenticate-oidc"
  }

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.pma-staging.arn
  }

  condition {
    host_header {
      values = ["staging.worldcubeassociation.org"]
    }
  }

  condition {
    path_pattern {
      values = ["/results/database*"]
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
output "rails-production" {
  value = aws_lb_target_group.rails-production
}

output "nextjs-production" {
  value = aws_lb_target_group.nextjs-production
}

output "rails_staging"{
  value = aws_lb_target_group.rails-staging
}

output "rails_staging-api"{
  value = aws_lb_target_group.rails-staging-api
}

output "pma_production"{
  value = aws_lb_target_group.auxiliary
}

output "pma_staging"{
  value = aws_lb_target_group.pma-staging
}

output "mailcatcher"{
  value = aws_lb_target_group.mailcatcher-staging
}

output "next_url" {
  value = local.next_url
}
