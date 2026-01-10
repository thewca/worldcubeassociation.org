# frozen_string_literal: true

class CompetitionSeries < ApplicationRecord
  has_many :competitions, -> { order(:start_date) }, inverse_of: :competition_series, dependent: :nullify, after_remove: :destroy_if_orphaned

  # WCRP 2.5.1 as of 2022-11-21. Note that these values are strictly "less than"
  MAX_SERIES_DISTANCE_KM = 200
  MAX_SERIES_DISTANCE_DAYS = 33

  MAX_ID_LENGTH = Competition::MAX_ID_LENGTH
  MAX_NAME_LENGTH = Competition::MAX_NAME_LENGTH
  MAX_SHORT_NAME_LENGTH = Competition::MAX_CELL_NAME_LENGTH

  VALID_NAME_RE = Competition::VALID_NAME_RE
  VALID_ID_RE = Competition::VALID_ID_RE

  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: MAX_NAME_LENGTH },
                   format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } }

  validates :wcif_id, presence: true, uniqueness: { case_sensitive: false }, length: { maximum: MAX_ID_LENGTH },
                      format: { with: VALID_ID_RE }, if: :name_valid_or_updating?

  validates :short_name, length: { maximum: MAX_SHORT_NAME_LENGTH },
                         format: { with: VALID_NAME_RE, message: proc { I18n.t('competitions.errors.invalid_name_message') } },
                         if: :name_valid_or_updating?

  private def name_valid_or_updating?
    self.persisted? || (name.present? && name.length <= MAX_NAME_LENGTH && name =~ VALID_NAME_RE)
  end

  before_validation :create_id_and_cell_name
  def create_id_and_cell_name
    m = VALID_NAME_RE.match(name)
    return unless m

    name_without_year = m[1]
    year = m[2]
    if wcif_id.blank?
      # Generate competition id from name
      # By replacing accented chars with their ascii equivalents, and then
      # removing everything that isn't a digit or a character.
      safe_name_without_year = ActiveSupport::Inflector.transliterate(name_without_year).gsub(/[^a-z0-9]+/i, '')
      self.wcif_id = safe_name_without_year[0...(MAX_ID_LENGTH - year.length)] + year
    end
    return if short_name.present?

    year = " #{year}"
    self.short_name = name_without_year.truncate(MAX_SHORT_NAME_LENGTH - year.length) + year
  end

  def destroy_if_orphaned
    return unless persisted? && competitions.count <= 1

    self.destroy # NULL is handled by has_many#dependent set to :nullify above
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[name short_name],
    include: ["competitions"],
  }.freeze

  def serializable_hash(options = nil)
    options = DEFAULT_SERIALIZE_OPTIONS.merge(options || {})
    include_competitions = options[:include]&.delete("competitions")
    json = super
    json[:id] = wcif_id
    json[:competitions] = competition_ids if include_competitions
    json
  end

  def to_form_data
    {
      "id" => id,
      "seriesId" => wcif_id,
      "name" => name,
      "shortName" => short_name,
      "competitionIds" => competition_ids,
    }
  end

  # See competition#form_errors about the (almost) duplication of to_form_data
  def form_errors
    return nil if self.valid?

    {
      "id" => errors[:id],
      "seriesId" => errors[:wcif_id],
      "name" => errors[:name],
      "shortName" => errors[:short_name],
      "competitionIds" => errors[:competitions],
    }
  end

  # Rubocop only flags this method (and not the same method in competition.rb), but they should be named the same
  # rubocop:disable Naming/AccessorMethodName
  def set_form_data(form_data_series)
    raise WcaExceptions::BadApiParameter.new("A Series must include at least two competitions.") if form_data_series["competitionIds"].count <= 1

    assign_attributes(CompetitionSeries.form_data_to_attributes(form_data_series))
  end
  # rubocop:enable Naming/AccessorMethodName

  def self.form_data_to_attributes(form_data)
    {
      wcif_id: form_data["seriesId"],
      name: form_data["name"],
      short_name: form_data["shortName"],
      competition_ids: form_data["competitionIds"],
    }
  end

  def self.form_data_json_schema
    {
      "type" => %w[object null],
      "properties" => {
        "id" => { "type" => %w[integer null] },
        "seriesId" => { "type" => "string" },
        "name" => { "type" => "string" },
        "shortName" => { "type" => "string" },
        "competitionIds" => {
          "type" => "array",
          "items" => { "type" => "string" },
          "uniqueItems" => true,
        },
      },
    }
  end

  def to_wcif(authorized: false)
    {
      "id" => wcif_id,
      "name" => name,
      "shortName" => short_name,
      "competitionIds" => (authorized ? competitions : public_competitions).pluck(:id),
    }
  end

  def self.wcif_json_schema
    {
      "type" => %w[object null],
      "properties" => {
        "id" => { "type" => "string" },
        "name" => { "type" => "string" },
        "shortName" => { "type" => "string" },
        "competitionIds" => { "type" => "array", "items" => { "type" => "string" } },
      },
    }
  end

  def set_wcif!(wcif_series)
    JSON::Validator.validate!(CompetitionSeries.wcif_json_schema, wcif_series)

    raise WcaExceptions::BadApiParameter.new("A Series must include at least two competitions.") if wcif_series["competitionIds"].count <= 1

    update!(CompetitionSeries.wcif_to_attributes(wcif_series))

    self
  end

  def self.wcif_to_attributes(wcif)
    {
      wcif_id: wcif["id"],
      name: wcif["name"],
      short_name: wcif["shortName"],
      competition_ids: wcif["competitionIds"],
    }
  end

  def public_competitions
    self.competitions.where(show_at_all: true)
  end
end
