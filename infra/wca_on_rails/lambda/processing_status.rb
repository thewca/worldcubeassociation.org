# frozen_string_literal: true

require 'json'
require 'redis'
require 'aws-sdk-sqs'
require 'superconfig'

EnvConfig = SuperConfig.new do
  mandatory :REDIS_URL, :string
  mandatory :QUEUE_URL, :string
  mandatory :AWS_REGION, :string
end

RedisConn = Redis.new(url: EnvConfig.REDIS_URL)

def lambda_handler(event:, context:)
  # Parse the input event
  query = event['queryStringParameters']
  if query.nil? || query['competition_id'].nil? || query['user_id'].nil?
    response = {
      statusCode: 400,
      body: JSON.generate({ status: 'Missing fields in request' }),
      headers: {
        "Access-Control-Allow-Headers" => "*",
        "Access-Control-Allow-Origin" => "*",
        "Access-Control-Allow-Methods" => "OPTIONS,POST,GET",
      },
    }
  else
    sqs_client = Aws::SQS::Client.new(region: EnvConfig.AWS_REGION)

    queue_attributes = sqs_client.get_queue_attributes({
                                                         queue_url: EnvConfig.QUEUE_URL,
                                                         attribute_names: ['ApproximateNumberOfMessages'],
                                                       })
    message_count = queue_attributes.attributes['ApproximateNumberOfMessages'].to_i

    processing = RedisConn.get("#{query['competition_id']}-#{query['user_id']}-processing")

    response = {
      statusCode: 200,
      body: JSON.generate({ processing: !processing.nil?, queue_count: message_count }),
      headers: {
        "Access-Control-Allow-Headers" => "*",
        "Access-Control-Allow-Origin" => "*",
        "Access-Control-Allow-Methods" => "OPTIONS,POST,GET",
      },
    }
  end

  # Return the response
  {
    statusCode: response[:statusCode],
    body: response[:body],
    headers: {
      "Access-Control-Allow-Headers" => "*",
      "Access-Control-Allow-Origin" => "*",
      "Access-Control-Allow-Methods" => "OPTIONS,POST,GET",
    },
  }
rescue StandardError => e
  # Handle any errors
  {
    statusCode: 500,
    body: JSON.generate({ error: e.message }),
    headers: {
      "Access-Control-Allow-Headers" => "*",
      "Access-Control-Allow-Origin" => "*",
      "Access-Control-Allow-Methods" => "OPTIONS,POST,GET",
    },
  }
end
