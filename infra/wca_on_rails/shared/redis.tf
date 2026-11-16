resource "aws_elasticache_subnet_group" "redis" {
  name        = "redissubnetgroup"
  description = " "
  subnet_ids = [
    aws_default_subnet.default_az1.id,
    aws_default_subnet.default_az2.id,
    aws_default_subnet.default_az3.id,
    aws_default_subnet.default_az4.id,
  ]
}

resource "aws_elasticache_parameter_group" "redis7_allkeys_lfu" {
  name        = "redis7allkeyslfu"
  family      = "redis7"
  description = "The Redis 7 default config but with LFU"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lfu"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Exe"
  }
}

resource "aws_elasticache_parameter_group" "sidekiq" {
  name        = "sidekiqredis"
  family      = "redis7"
  description = "the parameter group for sidekiq"

  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
}

output "redis_subnet_group" {
  value = aws_elasticache_subnet_group.redis
}

output "redis_cache_parameter_group" {
  value = aws_elasticache_parameter_group.redis7_allkeys_lfu
}

output "redis_sidekiq_parameter_group" {
  value = aws_elasticache_parameter_group.sidekiq
}
