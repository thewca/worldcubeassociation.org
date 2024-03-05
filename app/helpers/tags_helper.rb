# frozen_string_literal: true

module TagsHelper
  def all_to_options(model)
    model.distinct.pluck(:tag).map { |tag| { value: tag, text: tag } }.to_json.html_safe
  end
end
