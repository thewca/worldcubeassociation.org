# frozen_string_literal: true

# Runs as its own CI job, so the contract can be strict without blocking the regular suites
return if ENV['OPENAPI_CONTRACT'].blank?

# TODO: extend to v0 once the v1 contract is green and covered
OPENAPI_CONTRACT_PREFIX = '/api/v1/'

OpenapiFirst::Test.setup do |test|
  test.register(
    OpenapiFirst.load(
      Rails.root.join('next-frontend/openapi/wcaAPI.yaml').to_s,
      only: ->(path) { path.start_with?('/v1/') },
      # The spec documents paths relative to the `/api/` server URL
      path_prefix: '/api',
    ),
  )

  test.ignore_request_error { |validated_request| !validated_request.path.start_with?(OPENAPI_CONTRACT_PREFIX) }
  test.coverage_reporter = OpenapiFirst::Test::Coverage::TerminalReporter
end

OpenapiFirst::Test.observe(Rails.application)
