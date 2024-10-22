# Define the SQS FIFO queue
resource "aws_sqs_queue" "this" {
  name                      = "registrations-monolith-staging.fifo"
  fifo_queue                = true
  content_based_deduplication = true
  deduplication_scope        = "queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 345600
  receive_wait_time_seconds  = 0
  visibility_timeout_seconds = 60
  tags = {
    Env = "staging"
  }
}
