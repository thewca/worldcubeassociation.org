# frozen_string_literal: true

class Post < ApplicationRecord
  include MarkdownHelper
  belongs_to :author, class_name: "User"
  has_many :post_tags, autosave: true, dependent: :destroy
  include Taggable

  scope :visible, -> { where(world_readable: true) }

  validates :title, presence: true, uniqueness: { case_sensitive: true }
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: { case_sensitive: true }

  validate :unstick_at_must_be_in_the_future, if: :unstick_at
  private def unstick_at_must_be_in_the_future
    if unstick_at <= Date.today
      errors.add(:unstick_at, I18n.t('posts.errors.unstick_at_future'))
    end
  end

  before_validation :clear_unstick_at, unless: :sticky?
  private def clear_unstick_at
    self.unstick_at = nil
  end

  BREAK_TAG_RE = /<!--\s*break\s*-->/

  def body_full
    body.sub(BREAK_TAG_RE, "")
  end

  def body_teaser
    split = body.split(BREAK_TAG_RE)
    split.first
  end

  before_validation :compute_slug
  private def compute_slug
    self.slug = title.parameterize
  end

  def self.search(query, params: {})
    posts = Post
    query&.split&.each do |part|
      posts = posts.where("title LIKE :part OR body LIKE :part", part: "%#{part}%")
    end
    posts.order(created_at: :desc)
  end

  def url
    Rails.application.routes.url_helpers.post_path(slug)
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "slug", "title", "sticky", "created_at"],
    methods: ["url"],
    include: ["author"],
  }.freeze

  def serializable_hash(options = nil)
    json = super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
    json.merge!(
      class: self.class.to_s.downcase,
    )
    if options[:teaser_only]
      json[:teaser] = md(body_teaser)
    else
      json[:body] = body
    end
    if options[:can_manage]
      json[:edit_url] = Rails.application.routes.url_helpers.edit_post_path(slug)
    end

    json
  end
end
