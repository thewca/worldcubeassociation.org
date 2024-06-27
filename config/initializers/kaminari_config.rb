# frozen_string_literal: true

Kaminari.configure do |config|
  # config.default_per_page = 25
  config.max_per_page = 1000
  # config.window = 4
  # config.outer_window = 0
  config.left = 8
  config.right = 3
  # config.page_method_name = :page
  # config.param_name = :page
end
