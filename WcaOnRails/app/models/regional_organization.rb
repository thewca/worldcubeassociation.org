# frozen_string_literal: true

class RegionalOrganization < ApplicationRecord
  has_one_attached :logo

  scope :currently_acknowledged, -> { where("end_date IS NULL OR end_date > ?", Date.today) }
  scope :not_currently_acknowledged, -> { where("end_date < ?", Date.today) }

  validates_presence_of :name, :country
  validates :website, presence: true, format: { with: %r{\Ahttps?://.*\z} }
  validates :logo, blob: { content_type: ['image/png', 'image/jpg', 'image/jpeg', 'image/svg'], size_range: 0..100.kilobytes }

  validates :start_date, presence: true
  validate :start_date_must_be_earlier_than_end_date
  def start_date_must_be_earlier_than_end_date
    if start_date && end_date && start_date >= end_date
      errors.add(:start_date, I18n.t('regional_organizations.errors.end_date_after_start_date'))
    end
  end
end
