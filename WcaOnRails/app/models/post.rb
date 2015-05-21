class Post < ActiveRecord::Base
  belongs_to :author, class_name: "DeviseUser"
  before_validation :compute_slug

  validates :title, presence: true, uniqueness: true
  validates :body, presence: true
  validates :slug, presence: true, uniqueness: true

  private def compute_slug
    self.slug = title.parameterize
  end
end
