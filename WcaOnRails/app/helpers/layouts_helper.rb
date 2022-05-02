# frozen_string_literal: true

# Copied from https://mattbrictson.com/easier-nested-layouts-in-rails
# Place this in app/helpers/layouts_helper.rb
module LayoutsHelper
  def parent_layout(layout)
    @view_flow.set(:layout, output_buffer)
    output = render(template: "layouts/#{layout}")
    self.output_buffer = ActionView::OutputBuffer.new(output)
  end
end
