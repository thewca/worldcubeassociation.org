# frozen_string_literal: true

class DelegateReport < ApplicationRecord
  REPORTS_ENABLED_DATE = Date.new(2016, 6, 1)
  # Any potentially available section, regardless of versioning.
  #   Use with care, some sections may not be available for some versions!
  AVAILABLE_SECTIONS = %i[
    summary
    equipment
    venue
    organization
    incidents
  ].freeze

  belongs_to :competition
  belongs_to :posted_by_user, class_name: "User", optional: true
  belongs_to :wrc_primary_user, class_name: "User", optional: true
  belongs_to :wrc_secondary_user, class_name: "User", optional: true

  enum :version, %i[legacy working_group_2024], suffix: true, default: :working_group_2024

  has_many_attached :setup_images do |attachable|
    attachable.variant :preview, resize_to_limit: [100, 100]
  end

  strip_attributes only: %i[schedule_url remarks]

  attr_accessor :current_user

  private def render_section_template(section)
    ActionController::Base.new.render_to_string(template: "delegate_reports/#{self.version}/_#{section}_default", formats: :md)
  end

  after_initialize :load_md_templates, unless: :posted?
  def load_md_templates
    # Make sure that sections which are NOT being used are explicitly set to `nil`
    #   by initializing an empty default map. Think of this as "default options".
    empty_sections = AVAILABLE_SECTIONS.index_with(nil)

    rendered_sections = self.md_sections
                            .index_with { self.report_section(it) || self.render_section_template(it) }
                            .reverse_merge(empty_sections)

    self.assign_attributes(**rendered_sections)
  end

  before_save :clean_untouched_sections, unless: :posted?
  def clean_untouched_sections
    # This is doing more sophisticated stuff than just a simple `==` comparison,
    #   because different OSes use different line break characters
    untouched_sections = self.md_sections.filter do |section|
      normalized_section = self.report_section(section)&.encode(universal_newline: true)
      normalized_template = self.render_section_template(section).encode(universal_newline: true)

      normalized_section == normalized_template
    end

    # Those sections which exactly match their default template should not be stored in the DB
    #   so we reset them to a blank `nil` value before persisting
    section_reset_map = untouched_sections.index_with(nil)

    self.assign_attributes(**section_reset_map) if section_reset_map.any?
  end

  def report_section(section_name)
    self.attributes[section_name.to_s].presence
  end

  validates :schedule_url, presence: true, if: :schedule_and_discussion_urls_required?
  validates :schedule_url, url: true
  validates :discussion_url, presence: true, if: :schedule_and_discussion_urls_required?
  validates :discussion_url, url: true
  validates :wrc_incidents, presence: true, if: :wrc_feedback_requested
  validates :wic_incidents, presence: true, if: :wic_feedback_requested

  validates :setup_images, blob: { content_type: :web_image },
                           length: { minimum: :required_setup_images_count, if: %i[posted? requires_setup_images?] }

  def schedule_and_discussion_urls_required?
    posted? && created_at > Date.new(2019, 7, 21)
  end

  def posted?
    self.posted_at?
  end

  def uses_section?(section)
    case section
    when :summary
      self.working_group_2024_version?
    when :equipment
      self.legacy_version?
    else
      true
    end
  end

  def md_sections
    AVAILABLE_SECTIONS.filter { self.uses_section?(it) }
  end

  def requires_setup_images?
    self.uses_section?(:venue) && self.required_setup_images_count.positive?
  end

  def required_setup_images_count
    self.working_group_2024_version? ? 2 : 0
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
    self.discussion_url = "https://groups.google.com/a/worldcubeassociation.org/forum/#!topicsearchin/reports/#{URI.encode_www_form_component(competition.name)}"
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
      competitionRegion: competition.continent.name_in(:en),
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
