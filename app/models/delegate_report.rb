# frozen_string_literal: true

class DelegateReport < ApplicationRecord
  REPORTS_ENABLED_DATE = Date.new(2016, 6, 1)
  # Any potentially available section, regardless of versioning.
  #   Use with care, some sections may not be available for some versions!
  AVAILABLE_SECTIONS = [
    :summary,
    :equipment,
    :venue,
    :organization,
    :incidents,
  ].freeze

  belongs_to :competition
  belongs_to :posted_by_user, class_name: "User", optional: true
  belongs_to :wrc_primary_user, class_name: "User", optional: true
  belongs_to :wrc_secondary_user, class_name: "User", optional: true

  enum :version, [:legacy, :working_group_2024], suffix: true, default: :working_group_2024

  attr_accessor :current_user

  before_create :set_discussion_url
  def set_discussion_url
    self.discussion_url = "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/" + URI.encode_www_form_component(competition.name)
  end

  private def render_section_template(section)
    ActionController::Base.new.render_to_string(template: "delegate_reports/#{self.version}/_#{section}_default", formats: :md)
  end

  before_create :md_section_defaults!
  def md_section_defaults!
    # Make sure that sections which are NOT being used are explicitly set to `nil`
    #   by initializing an empty default map. Think of this as "default options".
    empty_sections = AVAILABLE_SECTIONS.index_with(nil)

    rendered_sections = self.md_sections
                            .index_with { |section| render_section_template(section) }
                            .reverse_merge(empty_sections)

    self.assign_attributes(**rendered_sections)
  end

  validates :schedule_url, presence: true, if: :schedule_and_discussion_urls_required?
  validates :schedule_url, url: true
  validates :discussion_url, presence: true, if: :schedule_and_discussion_urls_required?
  validates :discussion_url, url: true
  validates :wrc_incidents, presence: true, if: :wrc_feedback_requested
  validates :wic_incidents, presence: true, if: :wic_feedback_requested

  def schedule_and_discussion_urls_required?
    posted? && created_at > Date.new(2019, 7, 21)
  end

  def posted?
    !!posted_at
  end

  def uses_section?(section)
    case section
    when :summary
      self.working_group_2024_version?
    when :venue
      self.legacy_version?
    else
      true
    end
  end

  def md_sections
    AVAILABLE_SECTIONS.filter { |section| self.uses_section?(section) }
  end

  def can_see_submit_button?(current_user)
    !posted? && competition.staff_delegates.include?(current_user)
  end

  def can_submit?(current_user)
    can_see_submit_button?(current_user) && (competition.results_submitted? || competition.results_posted?)
  end

  def posted=(new_posted)
    new_posted = ActiveRecord::Type::Boolean.new.cast(new_posted)
    self.posted_at = (new_posted ? Time.now : nil)
    self.posted_by_user_id = current_user&.id
  end

  GLOBAL_MAILING_LIST = "reports@worldcubeassociation.org"

  def self.country_mailing_list(country, continent = country.continent)
    "reports.#{continent.url_id}.#{country.iso2}@worldcubeassociation.org"
  end

  def self.continent_mailing_list(continent)
    "reports.#{continent.url_id}@worldcubeassociation.org"
  end

  def mailing_lists
    if competition.country.real?
      # If there is a directly attached country, just use that as the only mailing list
      [DelegateReport.country_mailing_list(competition.country)]
    elsif competition.continent.real?
      # If at least the continent is real (i.e. FMC Europe), then use all available countries' lists
      competition.venue_countries.map { |c| DelegateReport.country_mailing_list(c) }
    else
      # If not even the continent is real (i.e. FMC World), then use all available continents' lists
      competition.venue_continents.map { |c| DelegateReport.continent_mailing_list(c) }
    end
  end

  # This generates a summary of delegate report data for use in other contexts. Currently, this is used by WRC as part of a custom Trello integration.
  # WST has no involvement besides supplying this data to an endpoint maintained by WRC. For integration advice, contact WRC directly.
  def feedback_requests
    {
      competitionName: competition.name,
      competitionId: competition.id,
      competitionRegion: competition.continent.name,
      feedbackRequests: {
        WRC: self.wrc_incidents,
        WIC: self.wic_incidents,
      },
      contents: {
        incidents: self.incidents,
      },
    }
  end
end
