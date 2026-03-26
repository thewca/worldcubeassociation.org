# frozen_string_literal: true

class ExternalScramble < ApplicationRecord
  belongs_to :external_scramble_set

  has_many :matched_scrambles, dependent: :nullify

  scope :not_extra, -> { where(is_extra: false) }

  validates :scramble_number, uniqueness: { scope: %i[is_extra external_scramble_set_id] }

  delegate :original_filename, :scramble_file_upload_id, to: :external_scramble_set

  # rubocop:disable Naming/PredicatePrefix
  #   See matched_scramble.rb for an explanation on why we need this
  def is_extra_tinyint
    self.is_extra? ? 1 : 0
  end
  # rubocop:enable Naming/PredicatePrefix

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[original_filename scramble_file_upload_id],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
