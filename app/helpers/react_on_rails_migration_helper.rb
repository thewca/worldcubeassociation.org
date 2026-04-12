# frozen_string_literal: true

module ReactOnRailsMigrationHelper
  def react_on_rails_component(component_name, props: {}, html_options: {}, prerender: false, **options)
    react_on_rails_options = options.merge(
      props: props,
      prerender: prerender,
      html_options: html_options,
    )

    singleton_class.include(ReactOnRails::Helper) unless singleton_class < ReactOnRails::Helper

    react_component(component_name, react_on_rails_options)
  end
end
