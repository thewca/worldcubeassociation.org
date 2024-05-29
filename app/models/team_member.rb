# frozen_string_literal: true

class TeamMember < ApplicationRecord
  belongs_to :team, -> { with_hidden }
  belongs_to :user

  scope :current, -> { where("end_date IS NULL OR end_date > ?", Date.today) }
  scope :leader, -> { where(team_leader: true) }
  scope :senior_member, -> { where(team_senior_member: true) }
  scope :current_leader, -> { self.current.merge(self.leader) }

  attr_accessor :current_user
  delegate :friendly_id, to: :team
  delegate :hidden?, to: :team
  delegate :wca_id, to: :user
  delegate :name, to: :user
  delegate :avatar, to: :user
  alias_attribute :leader, :team_leader
  alias_attribute :senior_member, :team_senior_member

  def current_member?
    end_date.nil? || end_date > Date.today
  end

  validate :start_date_must_be_earlier_than_or_same_as_end_date
  def start_date_must_be_earlier_than_or_same_as_end_date
    if start_date && end_date && start_date > end_date
      errors.add(:start_date, "must be earlier than end_date")
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && !current_member?
      errors.add(:user_id, "You cannot demote yourself")
    end
  end

  validates :start_date, presence: true

  DEFAULT_SERIALIZE_OPTIONS = {
    methods: %w[friendly_id leader name senior_member wca_id],
    only: %w[id],
    include: %w[avatar],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
