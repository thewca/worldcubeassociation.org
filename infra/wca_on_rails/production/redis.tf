resource "aws_elasticache_cluster" "sidekiq" {
  cluster_id = "wca-redisprod"
  engine = "redis"
  engine_version = "7.0"
  maintenance_window = "fri:10:00-fri:11:00"
  node_type = "cache.t4g.small"
  num_cache_nodes = 1
  port = 6379
  parameter_group_name = "redis7allkeyslfu"
  subnet_group_name = aws_elasticache_subnet_group.this.name
  availability_zone = aws_subnet.private[0].availability_zone
  security_group_ids = [aws_security_group.cache-sg.id]
}

resource "aws_elasticache_cluster" "cache" {
  cluster_id = "wca-redisprod"
  engine = "redis"
  engine_version = "7.0"
  maintenance_window = "fri:10:00-fri:11:00"
  node_type = "cache.t4g.small"
  num_cache_nodes = 1
  port = 6379
  parameter_group_name = "redis7allkeyslfu"
  subnet_group_name = aws_elasticache_subnet_group.this.name
  availability_zone = aws_subnet.private[0].availability_zone
  security_group_ids = [aws_security_group.cache-sg.id]
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "Redi-Subnet-Group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_security_group" "cache-sg" {
  name        = "${var.name_prefix}-cache"
  description = "Production Cache"
  vpc_id      = aws_vpc.this.id

  tags = {
    Name = "${var.name_prefix}-cache"
  }
}
resource "aws_security_group_rule" "cache_cluster_ingress" {
  type                     = "ingress"
  security_group_id        = aws_security_group.cache-sg.id
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "TCP"
  source_security_group_id = aws_security_group.cluster.id
  description              = "Redis Cache ingress"
}

output "elasticache_subnet_group" {
  value = aws_elasticache_subnet_group.this
}

output "aws_elasticache_cluster" {
  value = aws_elasticache_cluster.this
}
