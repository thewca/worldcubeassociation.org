# frozen_string_literal: true

class Committee < ActiveRecord::Base
  has_many :teams
  has_many :team_members, through: :teams
  has_many :committee_positions

  WCA_BOARD = "wca-board".freeze
  WCA_DELEGATES_COMMITTEE = "wca-delegates-committee".freeze
  WCA_SOFTWARE_COMMITTEE = "wca-software-committee".freeze
  WCA_RESULTS_COMMITTEE = "wca-results-committee".freeze
  WCA_REGULATIONS_COMMITTEE = "wca-regulations-committee".freeze
  WCA_DISCIPLINARY_COMMITTEE = "wca-disciplinary-committee".freeze

  MAX_NAME_LENGTH = 50
  VALID_NAME_RE = /\A[[:alnum:] -]+\z/
  MAX_SLUG_LENGTH = 50
  VALID_SLUG_RE = /\A[[:alnum:]-]+\z/

  validates :name, presence: true, uniqueness: true, length: { maximum: MAX_NAME_LENGTH }, format: { with: VALID_NAME_RE, message: "must contain alpanumric characters and spaces only" }
  validates :slug, presence: true, uniqueness: true, length: { maximum: MAX_SLUG_LENGTH }, format: { with: VALID_SLUG_RE, message: "must contain alpanumric characters and dashes only" }
  validates :email, presence: true
  validates :duties, presence: true

  before_validation :compute_slug
  private def compute_slug
    self.slug ||= name.parameterize
  end

  def to_param
    slug
  end
end
