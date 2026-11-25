locals {
  primary_db_identifier = "worldcubeassociation-dot-org-m8"
  bytes_per_gib         = 1024 * 1024 * 1024
}

data "aws_sns_topic" "alarms" {
  name = "Default_CloudWatch_Alarms_Topic"
}

resource "aws_cloudwatch_metric_alarm" "elb_5xx" {
  alarm_name          = "5XX Errors in Production"
  alarm_description   = "Spike in 5XX errors detected - check if the website is still accessible"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "HTTPCode_ELB_5XX_Count"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 50
  comparison_operator = "GreaterThanThreshold"
  # The load balancer only reports this metric when there are errors
  treat_missing_data = "notBreaching"
  alarm_actions      = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = var.shared.lb.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "request_count" {
  alarm_name          = "Prod requests warning"
  alarm_description   = "> 35 000 requests in 5 minutes"
  namespace           = "AWS/ApplicationELB"
  metric_name         = "RequestCount"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 35000
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = var.shared.lb.arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "db_free_storage" {
  alarm_name          = "Prob DB disk <50gb"
  namespace           = "AWS/RDS"
  metric_name         = "FreeStorageSpace"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 50 * local.bytes_per_gib
  comparison_operator = "LessThanThreshold"
  alarm_actions       = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = local.primary_db_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_load" {
  alarm_name          = "Prod DB Load"
  namespace           = "AWS/RDS"
  metric_name         = "DBLoad"
  statistic           = "Average"
  period              = 900
  evaluation_periods  = 1
  threshold           = 13
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = local.primary_db_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "db_disk_queue_depth" {
  alarm_name          = "Prod DiskQueueDepth"
  namespace           = "AWS/RDS"
  metric_name         = "DiskQueueDepth"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 400
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = local.primary_db_identifier
  }
}

resource "aws_cloudwatch_metric_alarm" "rails_cpu" {
  alarm_name          = "prod_cpu_maxout"
  alarm_description   = "Average CPU of the Rails service > 80%"
  namespace           = "AWS/ECS"
  metric_name         = "CPUUtilization"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 1
  threshold           = 80
  comparison_operator = "GreaterThanThreshold"
  alarm_actions       = [data.aws_sns_topic.alarms.arn]

  dimensions = {
    ClusterName = var.shared.ecs_cluster.name
    ServiceName = aws_ecs_service.this.name
  }
}
