# frozen_string_literal: true

class TeamMember < ApplicationRecord
  belongs_to :team, -> { with_hidden }
  belongs_to :user

  scope :current, -> { where("end_date IS NULL OR end_date > ?", Date.today) }
  scope :in_official_team, -> { where(team_id: Team.all_official.map(&:id)) }
  scope :leader, -> { where(team_leader: true) }
  scope :senior_member, -> { where(team_senior_member: true) }
  scope :current_leader, -> { self.current.merge(self.leader) }

  attr_accessor :current_user
  delegate :friendly_id, to: :team
  delegate :hidden?, to: :team
  alias_attribute :leader, :team_leader

  def current_member?
    end_date.nil? || end_date > Date.today
  end

  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if start_date && end_date && start_date >= end_date
      errors.add(:start_date, "must be earlier than end_date")
    end
  end

  validate :cannot_demote_oneself
  def cannot_demote_oneself
    if current_user == self.user_id && !current_member?
      errors.add(:user_id, "You cannot demote yourself")
    end
  end

  validate :cannot_ban_user_with_upcoming_comps
  def cannot_ban_user_with_upcoming_comps
    if team == Team.banned && current_member?
      upcoming_comps = user.competitions_registered_for.not_over.merge(Registration.not_deleted).pluck(:id)
      unless upcoming_comps.empty?
        errors.add(:user_id, "The user has upcoming competitions: #{upcoming_comps.join(', ')}. Before banning the user, make sure their registrations are deleted.")
      end
    end
  end

  validates :start_date, presence: true

  DEFAULT_SERIALIZE_OPTIONS = {
    only: [],
    methods: ["friendly_id", "leader"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
