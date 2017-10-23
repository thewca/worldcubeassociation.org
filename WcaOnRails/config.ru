# frozen_string_literal: true

# This file is used by Rack-based servers to start the application.

ENV['RAILS_RACKING'] = '1'
require ::File.expand_path('../config/environment', __FILE__)
run Rails.application
