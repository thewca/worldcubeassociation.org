# frozen_string_literal: true

class ScrambleFileUpload < ApplicationRecord
  SERIALIZATION_INCLUDES = { external_scramble_sets: ExternalScrambleSet::SERIALIZATION_INCLUDES }.freeze

  # The original Java `LocalDateTime` format is defined as `"MMM dd, yyyy h:m:s a"`.
  #   The below format string should be the Ruby equivalent for strptime.
  TNOODLE_DATETIME_FORMAT = "%b %d, %Y %l:%M:%S %p"

  belongs_to :uploaded_by_user, foreign_key: "uploaded_by", class_name: "User"
  belongs_to :competition

  has_many :external_scramble_sets, dependent: :destroy

  scope :for_serialization, -> { includes(**SERIALIZATION_INCLUDES) }

  serialize :raw_wcif, coder: JSON

  def tnoodle_interchange_data
    {
      version: self.scramble_program,
      generationDate: self.generated_at&.strftime(TNOODLE_DATETIME_FORMAT),
      wcif: self.raw_wcif,
    }
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    except: %w[raw_wcif],
    include: %w[external_scramble_sets],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
