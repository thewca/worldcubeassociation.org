# frozen_string_literal: true

class RegionalOrganization < ApplicationRecord
  has_one_attached :logo
  has_one_attached :bylaws
  has_one_attached :extra_file

  scope :currently_acknowledged, -> { where("start_date IS NOT NULL AND (end_date IS NULL OR end_date > ?)", Date.today) }
  scope :pending_approval, -> { where("start_date IS NULL") }
  scope :previously_acknowledged, -> { where("start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < ?", Date.today) }

  validates_presence_of :name, :country, :email, :address, :directors_and_officers, :area_description, :past_and_current_activities, :future_plans
  validates :website, presence: true, format: { with: %r{\Ahttps?://.*\z} }
  validates :logo, presence: true, content_type: 'image/png', size: { less_than_or_equal_to: 200.kilobytes }
  validates :bylaws, presence: true, content_type: 'application/pdf', size: { less_than_or_equal_to: 250.kilobytes }
  validates :extra_file, content_type: 'application/pdf', size: { less_than_or_equal_to: 200.kilobytes }

  validate :validate_email
  def validate_email
    errors.add(:email, I18n.t('common.errors.invalid')) unless ValidateEmail.valid?(email)
  end

  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if start_date && end_date && start_date >= end_date
      errors.add(:start_date, I18n.t('regional_organizations.errors.end_date_after_start_date'))
    end
  end

  def is_pending?
    start_date.nil?
  end

  def logo_url
    Rails.application.routes.url_helpers.rails_representation_url(logo.variant(resize: "500x300").processed) if logo.attached?
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["name", "website", "country"],
    methods: ["logo_url"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
