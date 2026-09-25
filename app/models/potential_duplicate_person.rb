# frozen_string_literal: true

class PotentialDuplicatePerson < ApplicationRecord
  self.table_name = 'potential_duplicate_persons'

  belongs_to :duplicate_checker_job_run
  belongs_to :original_user, class_name: 'User'
  belongs_to :duplicate_person, class_name: 'Person'

  has_one :registration, ->(pdp) { where(competition_id: pdp.duplicate_checker_job_run.competition_id) }, primary_key: :original_user_id, foreign_key: :user_id, class_name: 'Registration'

  enum :name_matching_algorithm, {
    jarowinkler: 'jarowinkler',
    exact_first_last_dob: 'exact_first_last_dob',
  }

  DEFAULT_SERIALIZE_OPTIONS = {
    include: {
      original_user: {
        private_attributes: %w[dob],
        only: User::DEFAULT_SERIALIZE_OPTIONS[:only] | %w[unconfirmed_wca_id],
      },
      duplicate_person: {
        private_attributes: %w[dob],
        methods: %w[country user_id],
      },
      registration: {
        only: %i[id],
      },
    },
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
