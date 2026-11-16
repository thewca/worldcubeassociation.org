# frozen_string_literal: true

# Runs as its own CI job, so the contract can be strict without blocking the regular suites
return if ENV['OPENAPI_CONTRACT'].blank?

# TODO: extend to v0 once the v1 contract is green and covered
OPENAPI_CONTRACT_PREFIX = '/api/v1/'

# Only called by the legacy frontend, so they are not documented yet.
#   The PR that adds one of them to the OpenAPI spec has to remove it here, which the check below enforces.
OPENAPI_UNDOCUMENTED_LEGACY_ROUTES = [
  %w[GET /v1/registrations/{registrationId}],
  %w[GET /v1/registrations/{registrationId}/payment_ticket],
  %w[GET /v1/registrations/{registrationId}/payments],
  %w[GET /v1/competitions/{competitionId}/registrations/admin],
  %w[PATCH /v1/competitions/{competitionId}/registrations/bulk_update],
  %w[PATCH /v1/competitions/{competitionId}/registrations/bulk_auto_accept],
].freeze

contract_definition = OpenapiFirst.load(
  Rails.root.join('next-frontend/openapi/wcaCore.yaml').to_s,
  only: ->(path) { path.start_with?('/v1/') },
  # The spec documents paths relative to the `/api/` server URL
  path_prefix: '/api',
)

documented_legacy_routes = OPENAPI_UNDOCUMENTED_LEGACY_ROUTES & contract_definition.routes.map { [it.request_method, it.path] }.to_a
raise "Now documented in the OpenAPI spec, remove from OPENAPI_UNDOCUMENTED_LEGACY_ROUTES: #{documented_legacy_routes}" if documented_legacy_routes.any?

undocumented_legacy_matchers = OPENAPI_UNDOCUMENTED_LEGACY_ROUTES.map do |request_method, path|
  [request_method, %r{\A/api#{path.gsub(/\{\w+\}/, '[^/]+')}\z}]
end

undocumented_legacy_route = lambda do |request|
  undocumented_legacy_matchers.any? { |request_method, path| request.request_method == request_method && path.match?(request.path) }
end

OpenapiFirst::Test.setup do |test|
  test.register(contract_definition)

  test.ignore_request_error do |validated_request|
    !validated_request.path.start_with?(OPENAPI_CONTRACT_PREFIX) || undocumented_legacy_route.call(validated_request)
  end
  # Some legacy routes collide with a documented path template, like `registrations/admin` with `registrations/{userId}`
  test.ignore_response_error { |_validated_response, rack_request| undocumented_legacy_route.call(rack_request) }
  test.coverage_reporter = OpenapiFirst::Test::Coverage::TerminalReporter
end

OpenapiFirst::Test.observe(Rails.application)
