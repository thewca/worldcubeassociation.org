# frozen_string_literal: true

class CompetitionMedium < ApplicationRecord
  belongs_to :competition

  enum status: { accepted: "accepted", pending: "pending" }
  validates :status, presence: true

  enum media_type: { report: "report", article: "article", multimedia: "multimedia" }
  validates :media_type, presence: true
  # TODO: This is a port of the useful *_i18n method from
  # https://github.com/zmbacker/enum_help.
  # https://github.com/thewca/worldcubeassociation.org/issues/2070
  # tracks adding this gem to our codebase.
  def self.media_types_i18n
    self.media_types.keys.to_h { |k| [k, k.titleize] }
  end

  scope :belongs_to_region, lambda { |region_id|
    joins(competition: [:country]).where(
      "country_id = :region_id OR countries.continent_id = :region_id", region_id: region_id
    )
  }

  before_save :set_decided_at
  private def set_decided_at
    if status_change && status == "accepted"
      self.decided_at = Time.now
    end
  end
end
