# frozen_string_literal: true

class CompetitionSeries < ApplicationRecord
  has_many :competitions, -> { order(:start_date) }, inverse_of: :competition_series, dependent: :nullify

  validates :name, presence: true, uniqueness: { case_sensitive: false }

  # WCRP 2.5.1 as of 2022-08-23. Note that these values are strictly "less than"
  MAX_SERIES_DISTANCE_KM = 100
  MAX_SERIES_DISTANCE_DAYS = 33

  # The notion of circumventing model associations is stolen from competition.rb#delegate_ids et al.
  attr_writer :competition_ids
  def competition_ids
    @competition_ids || self.competitions.map(&:id).join(",")
  end

  before_validation :unpack_competition_ids
  def unpack_competition_ids
    if @competition_ids
      unpacked_competitions = @competition_ids.split(",").map { |id| Competition.find(id) }
      self.competitions = unpacked_competitions
    end
  end

  after_validation :remove_orphaned_series
  def remove_orphaned_series
    if persisted? && competitions.count <= 1
      self.destroy # NULL is handled by has_many#dependent set to :nullify above
    end
  end
end
