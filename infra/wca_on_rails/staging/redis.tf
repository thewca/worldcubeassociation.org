locals {
  legacy_ec2_security_group_id = "sg-07064b0540f1becdc"
}

resource "aws_security_group" "redis" {
  name        = "RedisSecurityGroupStaging"
  description = "Allows Staging to talk to Redis"
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
  replication_group_id       = "redis-main-staging"
  description                = " "
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 1
  port                       = 6379
  parameter_group_name       = var.shared.redis_cache_parameter_group.name
  subnet_group_name          = var.shared.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  multi_az_enabled           = false
  snapshot_retention_limit   = 1
  snapshot_window            = "11:00-12:00"
  maintenance_window         = "sun:09:30-sun:10:30"
  at_rest_encryption_enabled = false
  transit_encryption_enabled = false
}

resource "aws_elasticache_replication_group" "sidekiq" {
  replication_group_id       = "wca-staging-sidekiq"
  description                = "redis for wca staging"
  engine                     = "redis"
  engine_version             = "7.1"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 1
  port                       = 6379
  parameter_group_name       = var.shared.redis_sidekiq_parameter_group.name
  subnet_group_name          = var.shared.redis_subnet_group.name
  security_group_ids         = [aws_security_group.redis.id]
  automatic_failover_enabled = false
  multi_az_enabled           = false
  snapshot_retention_limit   = 0
  snapshot_window            = "11:00-12:00"
  maintenance_window         = "sat:10:00-sat:11:00"
  at_rest_encryption_enabled = false
  transit_encryption_enabled = false
}
