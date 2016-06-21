# frozen_string_literal: true

class CommitteePosition < ActiveRecord::Base
  belongs_to :committee
  has_many :team_members
  has_many :current_members, -> { current }, class_name: "TeamMember"

  SENIOR_DELEGATE = "senior-delegate".freeze
  DELEGATE = "delegate".freeze
  CANDIDATE_DELEGATE = "candidate-delegate".freeze

  MAX_NAME_LENGTH = 50
  VALID_NAME_RE = /\A[[:alnum:] -]+\z/
  MAX_SLUG_LENGTH = 50
  VALID_SLUG_RE = /\A[[:alnum:]-]+\z/
  MAX_DESCRIPTION_LENGTH = 255

  validates :name, presence: true, uniqueness: {scope: :committee_id}, length: { maximum: MAX_NAME_LENGTH }, format: { with: VALID_NAME_RE, message: "must contain alpanumric characters and spaces only" }
  validates :slug, presence: true, uniqueness: {scope: :committee_id}, length: { maximum: MAX_SLUG_LENGTH }, format: { with: VALID_SLUG_RE, message: "must contain alpanumric characters and dashes only" }
  validates :description, presence: true, length: { maximum: MAX_DESCRIPTION_LENGTH }
  before_validation :compute_slug
  private def compute_slug
    self.slug ||= name.parameterize
  end
end
