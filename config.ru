# frozen_string_literal: true

# This file is used by Rack-based servers to start the application.

ENV['RAILS_RACKING'] = '1'
require_relative 'config/environment'

run Rails.application
Rails.application.load_server
