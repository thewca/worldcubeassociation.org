# frozen_string_literal: true

class MarkdownRendererController < ApplicationController
  include MarkdownHelper

  def render_markdown
    render html: md(params[:markdown_content])
  end
end
