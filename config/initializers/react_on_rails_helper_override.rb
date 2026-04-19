# frozen_string_literal: true

# React on Rails defines a global `react_component` helper, but this app still
# has many legacy react-rails mounts while it migrates incrementally.
module LegacyReactRailsHelperOverride
  def react_component(*args, &block)
    React::Rails::ViewHelper.instance_method(:react_component).bind(self).call(*args, &block)
  end
end

Rails.application.config.to_prepare do
  next unless defined?(ReactOnRailsHelper)

  ReactOnRailsHelper.prepend(LegacyReactRailsHelperOverride) unless ReactOnRailsHelper < LegacyReactRailsHelperOverride
end
