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

resource "aws_elasticache_parameter_group" "valkey8_allkeys_lfu" {
  name        = "valkey8allkeyslfu"
  family      = "valkey8"
  description = "The Valkey 8 default config but with LFU"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lfu"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Exe"
  }
}

resource "aws_elasticache_parameter_group" "sidekiq_valkey8" {
  name        = "sidekiqvalkey8"
  family      = "valkey8"
  description = "the valkey parameter group for sidekiq"

  parameter {
    name  = "maxmemory-policy"
    value = "noeviction"
  }
}

output "redis_subnet_group" {
  value = aws_elasticache_subnet_group.redis
}

output "valkey_cache_parameter_group" {
  value = aws_elasticache_parameter_group.valkey8_allkeys_lfu
}

output "valkey_sidekiq_parameter_group" {
  value = aws_elasticache_parameter_group.sidekiq_valkey8
}
