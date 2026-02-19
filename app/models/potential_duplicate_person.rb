# frozen_string_literal: true

class PotentialDuplicatePerson < ApplicationRecord
  self.table_name = 'potential_duplicate_persons'

  belongs_to :original_user, class_name: 'User'
  belongs_to :duplicate_person, class_name: 'Person'

  enum :name_matching_algorithm, {
    jarowinkler: 'jarowinkler',
    exact_first_last_dob: 'exact_first_last_dob',
  }

  DEFAULT_SERIALIZE_OPTIONS = {
    include: {
      original_user: {
        private_attributes: %w[dob],
      },
      duplicate_person: {
        private_attributes: %w[dob],
        methods: %w[country user_id],
      },
    },
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
