# frozen_string_literal: true
class Team < ActiveRecord::Base
  belongs_to :committee
  has_many :team_members
  has_many :current_members, -> { current }, class_name: "TeamMember"

  MAX_NAME_LENGTH = 50
  VALID_NAME_RE = /\A[[:alnum:] -]+\z/
  MAX_SLUG_LENGTH = 50
  VALID_SLUG_RE = /\A[[:alnum:]-]+\z/

  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }, format: { with: VALID_NAME_RE, message: "must contain alpanumric characters and spaces only" }
  validates :slug, presence: true, uniqueness: true, length: { maximum: MAX_SLUG_LENGTH }, format: { with: VALID_SLUG_RE, message: "must contain alpanumric characters and dashes only" }
  validates :description, presence: true

  before_validation :compute_slug
  private def compute_slug
    self.slug ||= name.parameterize
  end

  def to_param
    slug
  end
end
