# frozen_string_literal: true

require 'webmock/rspec'

# Prevents live HTTP calls in tests
WebMock.disable_net_connect!(allow_localhost: true)
