# frozen_string_literal: true

require 'active_support/concern'

module ApiRateLimiting
  extend ActiveSupport::Concern

  REQUESTS_PER_MINUTE = 60

  INTERNAL_IP_RANGES = [
    # Standard loopback range, AWS Internal Load Balancers appear as 127.0.0.1:
    # Right at the bottom of https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-connect-concepts-deploy.html#service-connect-considerations
    IPAddr.new('127.0.0.0/8'),
    IPAddr.new('10.0.0.0/8'), # Private Class A
    IPAddr.new('172.16.0.0/12'), # Private Class B
    IPAddr.new('192.168.0.0/16'), # Private Class C
  ].freeze

  included do
    rate_limit to: REQUESTS_PER_MINUTE, within: 1.minute, unless: -> { internal_ip?(request.remote_ip) } if Rails.env.production?
  end

  def internal_ip?(remote_ip)
    INTERNAL_IP_RANGES.any? { it.include?(remote_ip) }
  end
end
