# frozen_string_literal: true

class CompetitionSeries < ApplicationRecord
  has_many :competitions, -> { order(:start_date) }, inverse_of: :competition_series, dependent: :nullify, after_remove: :destroy_if_orphaned

  # WCRP 2.5.1 as of 2022-08-23. Note that these values are strictly "less than"
  MAX_SERIES_DISTANCE_KM = 100
  MAX_SERIES_DISTANCE_DAYS = 33

  MAX_NAME_LENGTH = Competition::MAX_NAME_LENGTH
  VALID_NAME_RE = Competition::VALID_NAME_RE

  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: MAX_NAME_LENGTH },
                   format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }

  # The notion of circumventing model associations is stolen from competition.rb#delegate_ids et al.
  attr_writer :competition_ids
  def competition_ids
    @competition_ids || self.competitions.map(&:id).join(",")
  end

  before_save :unpack_competition_ids
  private def unpack_competition_ids
    if @competition_ids
      unpacked_competitions = @competition_ids.split(",").map { |id| Competition.find(id) }
      self.competitions = unpacked_competitions
    end
  end

  after_save :clear_competition_ids
  private def clear_competition_ids
    # reset them so that upon the next read they will be fetched based on what's just been written.
    @competition_ids = nil
  end

  def destroy_if_orphaned
    if persisted? && competitions.count <= 1
      self.destroy # NULL is handled by has_many#dependent set to :nullify above
    end
  end
end
