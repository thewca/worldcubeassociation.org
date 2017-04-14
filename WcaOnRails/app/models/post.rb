# frozen_string_literal: true

class Post < ApplicationRecord
  belongs_to :author, class_name: "User"

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: true

  BREAK_TAG_RE = /<!--\s*break\s*-->/

  def body_full
    body.sub(BREAK_TAG_RE, "")
  end

  def body_teaser
    split = body.split(BREAK_TAG_RE)
    teaser = split.first
    if split.length > 1
      teaser += "\n\n[Read more....](" + Rails.application.routes.url_helpers.post_path(slug) + ")"
    end
    teaser
  end

  before_validation :compute_slug
  private def compute_slug
    self.slug = title.parameterize
  end

  CRASH_COURSE_POST_SLUG = "delegate-crash-course"

  def self.crash_course_post
    post = (Post.find_by_slug(CRASH_COURSE_POST_SLUG) ||
            Post.create!(slug: CRASH_COURSE_POST_SLUG, title: "Delegate crash course", body: "Nothing here yet"))
    post
  end

  def deletable
    persisted? && !is_crash_course_post?
  end

  def edit_path
    if is_crash_course_post?
      Rails.application.routes.url_helpers.delegate_crash_course_edit_path
    else
      Rails.application.routes.url_helpers.edit_post_path(slug)
    end
  end

  def update_path
    if is_crash_course_post?
      Rails.application.routes.url_helpers.delegate_crash_course_path
    else
      Rails.application.routes.url_helpers.post_path(self)
    end
  end

  def self.search(query, params: {})
    posts = Post.where(world_readable: true)
    query&.split&.each do |part|
      posts = posts.where("title LIKE :part OR body LIKE :part", part: "%#{part}%")
    end
    posts.order(created_at: :desc)
  end

  def serializable_hash(options = nil)
    json = {
      class: self.class.to_s.downcase,

      id: id,
      title: title,
      body: body,
      slug: slug,
      author: author,
    }

    json
  end

  private def is_crash_course_post?
    slug == CRASH_COURSE_POST_SLUG
  end
end
