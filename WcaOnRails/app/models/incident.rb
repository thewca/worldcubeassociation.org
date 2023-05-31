# frozen_string_literal: true

class Incident < ApplicationRecord
  has_many :incident_tags, autosave: true, dependent: :destroy
  has_many :incident_competitions, dependent: :destroy
  has_many :competitions, -> { order("competitions.start_date asc") }, through: :incident_competitions

  accepts_nested_attributes_for :incident_competitions, allow_destroy: true

  scope :resolved, -> { where.not(resolved_at: nil) }

  validate :digest_sent_at_consistent
  validates_presence_of :title

  include Taggable

  def last_happened_date
    competitions.last&.start_date || created_at.to_date
  end

  def digest_missing?
    digest_worthy && !digest_sent_at
  end

  def digest_sent?
    digest_sent_at != nil
  end

  def resolved?
    resolved_at != nil
  end

  def digest_sent_at_consistent
    if digest_sent_at && !digest_worthy
      errors.add(:digest_sent_at, "can't be set if digest_worthy is false.")
    end
    if digest_sent_at && !resolved_at
      errors.add(:digest_sent_at, "can't be set if incident is not resolved.")
    end
  end

  def url
    Rails.application.routes.url_helpers.incident_url(self)
  end

  def self.search(query, params: {})
    incidents = Incident
    query&.split&.each do |part|
      like_query = %w(public_summary title).map { |col| "#{col} LIKE :part" }.join(" OR ")
      incidents = incidents.where(like_query, part: "%#{part}%")
    end
    if params[:tags]
      incidents = incidents.where(incident_tags: IncidentTag.where(tag: params[:tags].split(",")))
    end
    if params[:competitions]
      incidents = incidents.where(incident_competitions: IncidentCompetition.where(competition_id: params[:competitions].split(",")))
    end
    incidents.order(created_at: :desc)
  end

  DEFAULT_PUBLIC_SERIALIZE_OPTIONS = {
    only: [:id, :title, :public_summary, :created_at, :updated_at, :resolved_at],
    methods: [:url],
  }.freeze

  DEFAULT_DELEGATE_MATTERS_SERIALIZE_OPTIONS = {
    only: DEFAULT_PUBLIC_SERIALIZE_OPTIONS[:only] +
          [:private_description, :digest_worthy, :digest_sent_at],
    methods: DEFAULT_PUBLIC_SERIALIZE_OPTIONS[:methods],
  }.freeze

  def serializable_hash(options = nil)
    if options && options[:can_view_delegate_matters]
      options = DEFAULT_DELEGATE_MATTERS_SERIALIZE_OPTIONS.merge(options || {})
    else
      options = DEFAULT_PUBLIC_SERIALIZE_OPTIONS.merge(options || {})
    end

    json = super(options)
    json.merge!(
      class: self.class.to_s.downcase,
    )

    json[:tags] = tags_array.map { |tag|
      { name: tag }.merge(Regulation.find_or_nil(tag) || {})
    }

    json[:competitions] = incident_competitions.map { |incident_competition|
      {
        id: incident_competition.competition.id,
        name: incident_competition.competition.name,
        comments: incident_competition.comments,
      }
    }

    json
  end
end
