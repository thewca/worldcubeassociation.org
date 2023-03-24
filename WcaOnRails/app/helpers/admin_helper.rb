# frozen_string_literal: true

module AdminHelper
  def display_string(str)
    str.gsub(/\s/, '<span style="color:#F00">#</span>').html_safe
  end

  def mute_results(results)
    last_event = nil

    results.map do |result|
      result.muted = (result.event == last_event)
      last_event = result.event

      result
    end
  end
end
