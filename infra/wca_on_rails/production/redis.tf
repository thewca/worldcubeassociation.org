locals {
  legacy_ec2_security_group_id = "sg-0c1972e150a317beb"
}

resource "aws_security_group" "redis" {
  name        = "RedisSecurityGroupProd"
  description = "Allows Prod to talk to redis"
  vpc_id      = var.shared.vpc_id

  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"
    security_groups = [
      local.legacy_ec2_security_group_id,
      var.shared.cluster_security.id,
    ]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "cache" {
  replication_group_id       = "wca-main-cache"
  description                = " "
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.t4g.small"
  num_cache_clusters         = 1
  port                       = 6379
  parameter_group_name       = var.shared.redis_cache_parameter_group.name
  subnet_group_name          = var.shared.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  multi_az_enabled           = false
  snapshot_retention_limit   = 3
  snapshot_window            = "07:00-08:00"
  maintenance_window         = "sat:10:30-sat:11:30"
  at_rest_encryption_enabled = false
  transit_encryption_enabled = false

  log_delivery_configuration {
    destination      = "Redis-main-slowlog"
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }
}

resource "aws_elasticache_replication_group" "sidekiq" {
  replication_group_id       = "wca-main-sidekiq"
  description                = " "
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = "cache.t4g.small"
  num_cache_clusters         = 2
  port                       = 6379
  parameter_group_name       = var.shared.redis_sidekiq_parameter_group.name
  subnet_group_name          = var.shared.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = true
  multi_az_enabled           = false
  snapshot_retention_limit   = 1
  snapshot_window            = "10:00-11:00"
  maintenance_window         = "mon:12:30-mon:13:30"
  at_rest_encryption_enabled = false
  transit_encryption_enabled = false

  log_delivery_configuration {
    destination      = "sidekiq-redis-logs"
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }
}

resource "aws_elasticache_replication_group" "anycable" {
  replication_group_id       = "anycable-production-cache"
  description                = "anycable-production-cache"
  engine                     = "valkey"
  engine_version             = "8.2"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 1
  port                       = 6379
  parameter_group_name       = "default.valkey8"
  subnet_group_name          = var.shared.redis_subnet_group.name
  security_group_ids         = [var.shared.cluster_security.id]
  automatic_failover_enabled = false
  multi_az_enabled           = false
  snapshot_retention_limit   = 0
  snapshot_window            = "13:00-14:00"
  maintenance_window         = "mon:06:00-mon:07:00"
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  transit_encryption_mode    = "required"
}
