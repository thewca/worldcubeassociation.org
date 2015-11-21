class Post < ActiveRecord::Base
  belongs_to :author, class_name: "User"

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: true

  before_validation :compute_slug
  private def compute_slug
    self.slug = title.parameterize
  end

  def self.crash_course_post
    slug = "delegate-crash-course"
    post = ( Post.find_by_slug(slug) ||
             Post.create!(slug: slug, title: "Delegate crash course", body: "Nothing here yet") )
    post
  end

  def deletable
    self.id != Post.crash_course_post.id
  end

  def edit_path
    if self.id == Post.crash_course_post.id
      Rails.application.routes.url_helpers.delegate_crash_course_edit_path
    else
      Rails.application.routes.url_helpers.edit_post_path(slug)
    end
  end

  def update_path
    if self.id == Post.crash_course_post.id
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
end
