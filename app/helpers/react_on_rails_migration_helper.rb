# frozen_string_literal: true

module ReactOnRailsMigrationHelper
  def react_on_rails_component(component_name, props: {}, html_options: {}, prerender: false, **options)
    react_component(
      component_name,
      options.merge(
        props: props,
        prerender: prerender,
        html_options: html_options,
      ),
    )
  end
end
