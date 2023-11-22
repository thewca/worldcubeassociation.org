# frozen_string_literal: true

class WfcDuesRedirect < ApplicationRecord
  belongs_to :redirect_to, class_name: "WfcXeroUser", foreign_key: "redirect_to_id"

  enum :redirect_type, {
    country: "country",
    organizer: "organizer",
  }

  def redirect_from_country
    if redirect_from_country_id.nil?
      return nil
    end
    Country.find_by_id(redirect_from_country_id)
  end

  def redirect_from_organizer
    if redirect_from_organizer_id.nil?
      return nil
    end
    User.find(redirect_from_organizer_id)
  end

  def serializable_hash(options = nil)
    super({
      only: %w[id redirect_type],
      methods: %w[redirect_from_country redirect_from_organizer redirect_to],
    }.merge(options || {}))
  end
end
