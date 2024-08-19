# frozen_string_literal: true

require 'net/http'
require 'uri'

class CompetitionTab < ApplicationRecord
  belongs_to :competition

  validates :name, presence: true
  validates :display_order, uniqueness: { scope: :competition_id, case_sensitive: false }

  CLONEABLE_ATTRIBUTES = %w(
    name
    content
    display_order
  ).freeze

  UNCLONEABLE_ATTRIBUTES = %w(
    id
    competition_id
  ).freeze

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

  private def url_exists?(url, max_redirects = 5)
    uri = URI(url)
    Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == 'https') do |http|
      request = Net::HTTP::Get.new(uri)
      response = http.request(request)
      if (300..399).cover?(response.code.to_i) && max_redirects > 0
        location = response['location']
        return url_exists?(location, max_redirects - 1)
      else
        return response.code == '200'
      end
    end
  end

  validate :verify_if_urls_are_valid, on: :update
  private def verify_if_urls_are_valid
    base_url = Rails.application.routes.url_helpers.competitions_url + '/'
    content.scan(/\[(.*?)\]\((.*?)\)/) do |match|
      hyperlink = match[1]
      unless hyperlink.starts_with?('http') # Validation is to be done only for the relative hyperlinks.
        url = base_url + hyperlink
        unless url_exists?(url)
          errors.add(:content, "URL #{url} does not exist.")
        end
      end
    end
  end

  def reorder(direction)
    current_display_order = display_order
    other_display_order = display_order + (direction.to_s == "up" ? -1 : 1)
    other_tab = competition.tabs.find_by(display_order: other_display_order)
    if other_tab
      ActiveRecord::Base.transaction do
        update_column :display_order, nil
        other_tab.update_column :display_order, current_display_order
        update_column :display_order, other_display_order
      end
    end
  end
end
