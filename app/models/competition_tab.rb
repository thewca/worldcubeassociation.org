# frozen_string_literal: true

class CompetitionTab < ApplicationRecord
  belongs_to :competition

  validates :name, presence: true
  validates :display_order, uniqueness: { scope: :competition_id, case_sensitive: false }

  CLONEABLE_ATTRIBUTES = %w[
    name
    content
    display_order
  ].freeze

  UNCLONEABLE_ATTRIBUTES = %w[
    id
    competition_id
  ].freeze

  STATIC_TAB_IDS = %w[
    general-info
    competition-events
    competition-schedule
  ].freeze

  ALLOWED_RELATIVE_LINKS = %w[
    register
  ].freeze

  def slug
    # parameterization behaves differently under different locales. However, we
    # want slugs to be the same across all locales, so we intentionally wrap
    # the call to parameterize in a I18n.with_locale.
    I18n.with_locale(:en) { "#{id}-#{name.parameterize}" }
  end

  after_create :set_display_order
  private def set_display_order
    update_column :display_order, competition.tabs.count
  end

  after_destroy :fix_display_order
  private def fix_display_order
    competition.tabs.where("display_order > ?", display_order).update_all("display_order = display_order - 1")
  end

  validate :verify_if_full_urls
  private def verify_if_full_urls
    content.scan(/\[(.*?)\]\((.*?)\)/).any? do |match|
      url = match[1]
      next if url.blank?

      is_absolute_url = url.starts_with?('http://', 'https://', 'mailto:')
      is_static_tab = STATIC_TAB_IDS.map { "##{it}" }.include?(url)
      is_allowed_relative = ALLOWED_RELATIVE_LINKS.map { "/#{it}" }.include? url

      errors.add(:content, I18n.t('competitions.errors.not_full_url', url: url)) unless is_absolute_url || is_static_tab || is_allowed_relative
    end
  end

  def reorder(direction)
    current_display_order = display_order
    other_display_order = display_order + (direction.to_s == "up" ? -1 : 1)
    other_tab = competition.tabs.find_by(display_order: other_display_order)
    return unless other_tab

    ActiveRecord::Base.transaction do
      update_column :display_order, nil
      other_tab.update_column :display_order, current_display_order
      update_column :display_order, other_display_order
    end
  end
end
