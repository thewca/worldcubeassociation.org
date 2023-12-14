# frozen_string_literal: true

class Role < ApplicationRecord
  DELEGATE_ROLE_ID = "dummyRoleId"

  belongs_to :user
  belongs_to :group, class_name: "UserGroup"
  belongs_to :metadata, polymorphic: true, optional: true

  delegate :group_type, to: :group

  def is_active
    self.end_date.nil? || self.end_date > Date.today
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[],
    only: %w[id start_date end_date],
    include: %w[group user metadata],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
