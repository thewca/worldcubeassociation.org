# frozen_string_literal: true

class WfcDuesRedirect < ApplicationRecord
  belongs_to :redirect_to, class_name: "WfcXeroUser", foreign_key: "redirect_to_id"
  belongs_to :redirect_source, polymorphic: true

  enum :redirect_source_type, {
    Country: "Country",
    User: "User",
  }

  def serializable_hash(options = nil)
    super({
      only: %w[id redirect_source_type],
      methods: %w[redirect_to],
      include: %w[redirect_source],
    }.merge(options || {}))
  end
end
