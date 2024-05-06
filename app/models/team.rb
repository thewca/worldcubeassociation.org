# frozen_string_literal: true

class Team < ApplicationRecord
  has_many :team_members, dependent: :destroy
  has_many :current_members, -> { current }, class_name: "TeamMember"
  has_one :leader, -> { current_leader }, class_name: "TeamMember"

  default_scope -> { where(hidden: false) }
  scope :with_hidden, -> { unscope(where: :hidden) }

  accepts_nested_attributes_for :team_members, reject_if: :all_blank, allow_destroy: true

  validate :membership_periods_cannot_overlap_for_single_user
  def membership_periods_cannot_overlap_for_single_user
    team_members.select(&:valid?).reject(&:marked_for_destruction?).group_by(&:user).each do |user, memberships|
      memberships.combination(2).to_a.each do |memberships_pair|
        first, second = memberships_pair
        first_period = first.start_date..(first.end_date || Date::Infinity.new)
        second_period = second.start_date..(second.end_date || Date::Infinity.new)
        if first_period.overlaps? second_period
          errors.add(:base, message: "Membership periods overlap for user #{user.name}")
          break # One overlapping period for the user is found, skip to the next one
        end
      end
    end
  end

  # Code duplication from Cachable concern, as we index by friendly_id and not by id :(
  def self.c_all_by_friendly_id
    @@teams_by_friendly_id ||= nil
    @@teams_by_friendly_id_timestamp ||= nil

    if @@teams_by_friendly_id_timestamp.nil? || @@teams_by_friendly_id_timestamp < 15.minutes.ago
      @@teams_by_friendly_id = all.with_hidden.index_by(&:friendly_id)
      @@teams_by_friendly_id_timestamp = DateTime.now
    end

    @@teams_by_friendly_id
  end

  def self.c_find_by_friendly_id!(friendly_id)
    self.c_all_by_friendly_id[friendly_id] || raise("friendly id not found #{friendly_id}")
  end

  def self.banned
    Team.c_find_by_friendly_id!('banned')
  end

  def acronym
    friendly_id.upcase
  end

  def name
    I18n.t("about.structure.#{friendly_id}.name")
  end

  def group
    GroupsMetadataTeamsCommittees.find_by(friendly_id: self.friendly_id)&.user_group
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: %w[id friendly_id name email],
    methods: %w[name acronym current_members],
    include: [],
  }.freeze

  def serializable_hash(options = nil)
    # NOTE: doing deep_dup is necessary here to avoid changing the inner values
    # of the freezed variables (which would leak PII)!
    default_options = DEFAULT_SERIALIZE_OPTIONS.deep_dup
    options = default_options.merge(options || {})
    super(options)
  end
end
