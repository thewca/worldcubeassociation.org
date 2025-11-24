# frozen_string_literal: true

class Format < ApplicationRecord
  include Cachable
  include StaticData

  has_many :preferred_formats
  has_many :events, through: :preferred_formats

  def name
    I18n.t("formats.#{id}", default: self[:name])
  end

  def short_name
    I18n.t("formats.short.#{id}", default: self[:name])
  end

  def allowed_first_phase_formats
    {
      "1" => [],
      "2" => ["1"],
      "3" => %w[1 2],
      "m" => %w[1 2],
      "a" => ["2"], # https://www.worldcubeassociation.org/regulations/#9b1
    }[self.id]
  end

  def rank_by_column
    sort_by == 'single' ? 'best' : "average"
  end

  def secondary_rank_by_column
    sort_by == 'average' ? 'best' : nil
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id sort_by sort_by_second expected_solve_count
             trim_fastest_n trim_slowest_n],
    methods: %w[name short_name allowed_first_phase_formats],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
