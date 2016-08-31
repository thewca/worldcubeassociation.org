# frozen_string_literal: true
module DeviseBootstrapViewsHelper
  def bootstrap_devise_error_messages!
    return '' if resource.errors.empty?

    messages = resource.errors.full_messages.map { |msg| content_tag(:li, msg) }.join

    html = <<-HTML
    <div class="alert alert-danger alert-block">
      <button type="button" class="close" data-dismiss="alert">x</button>
      #{messages}
    </div>
    HTML

    html.html_safe
  end
end
