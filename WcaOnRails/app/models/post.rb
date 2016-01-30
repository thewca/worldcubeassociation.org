class Post < ActiveRecord::Base
  belongs_to :author, class_name: "User"

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: true

  before_validation :compute_slug
  private def compute_slug
    self.slug = title.parameterize
  end

  CRASH_COURSE_POST_SLUG = "delegate-crash-course"

  def self.crash_course_post
    post = ( Post.find_by_slug(CRASH_COURSE_POST_SLUG) ||
             Post.create!(slug: CRASH_COURSE_POST_SLUG, title: "Delegate crash course", body: "Nothing here yet") )
    post
  end

  def deletable
    !is_crash_course_post?
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
    sql_query = "%#{query}%"
    Post.where("world_readable = 1 AND (title LIKE :sql_query OR body LIKE :sql_query)", sql_query: sql_query).order(created_at: :desc)
  end

  def to_jsonable
    json = {
      class: self.class.to_s.downcase,

      id: id,
      title: title,
      body: body,
      slug: slug,
      author: author ? author.to_jsonable : nil,
    }

    json
  end

  private def is_crash_course_post?
    slug == CRASH_COURSE_POST_SLUG
  end
end
