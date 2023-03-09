# frozen_string_literal: true

module AdminHelper
  def display_string(str)
    str.gsub(/\s/, '<span style="color:#F00">#</span>').html_safe
  end
end
