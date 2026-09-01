# frozen_string_literal: true

class MarkdownImage < ApplicationRecord
  # No usages until a record that embeds this image is saved: the image is
  # uploaded before the parent record exists. See HasMarkdownImages.
  has_many :usages, class_name: "MarkdownImageUsage", dependent: :destroy
  belongs_to :uploaded_by, class_name: "User", optional: true

  # Two attachments rather than one, because ActiveStorage fixes the service per
  # declaration and the bucket has to differ. Same shape as UserAvatar.
  has_one_attached :public_image, service: EnvConfig.UPLOADS_PUBLIC_STORAGE
  has_one_attached :private_image, service: EnvConfig.UPLOADS_PRIVATE_STORAGE

  # Defaults to private: a form that forgets to say gets the safe bucket.
  enum :visibility, { public: 'public', private: 'private' },
       default: :private, scopes: false, validate: true

  MAX_UPLOAD_SIZE = 5.megabytes

  validates :public_image, blob: { content_type: :web_image, size_range: 0..MAX_UPLOAD_SIZE }
  validates :private_image, blob: { content_type: :web_image, size_range: 0..MAX_UPLOAD_SIZE }
  validate :image_must_be_attached

  private def image_must_be_attached
    errors.add(:image, :blank) unless self.image.attached?
  end

  def image
    self.public? ? self.public_image : self.private_image
  end

  def attach_image(file)
    self.image.attach(file)
  end

  def viewable_by?(user)
    return true if self.public?
    return false if user.blank?
    return true if self.uploaded_by_id == user.id

    # Visible through any record that embeds it: a private upload pasted into a
    # public tab is public, and one used by a report follows that report.
    self.usages.map(&:attachable).any? { user.can_view_markdown_image_owner?(it) }
  end

  # Nothing embeds this image any more (or ever did - an abandoned draft).
  scope :unused, -> { where.missing(:usages) }

  # Matches on either attachment, so callers do not have to care which bucket the
  # file ended up in.
  scope :with_blob_ids, lambda { |blob_ids|
    where(id: ActiveStorage::Attachment.where(record_type: polymorphic_name, blob_id: blob_ids).select(:record_id))
  }

  # The two shapes a markdown image URL can take: the CDN host plus the blob key
  # in production, and the ActiveStorage redirect route everywhere else.
  CDN_URL_PATTERN = %r{#{Regexp.escape(EnvConfig.S3_UPLOADS_ASSET_HOST.chomp('/'))}/(?<key>[A-Za-z0-9]+)}
  ACTIVE_STORAGE_URL_PATTERN = %r{/rails/active_storage/blobs(?:/redirect)?/(?<signed_id>[A-Za-z0-9_=-]+--[A-Za-z0-9_=-]+)}

  # Private images are embedded as this app's own URL, not a storage URL, so a
  # third shape has to be recognised - otherwise their usages are never recorded
  # and the cleanup task treats images that are plainly in use as garbage.
  MARKDOWN_IMAGE_URL_PATTERN = %r{/markdown-images/(?<id>\d+)}

  # Every MarkdownImage the markdown embeds, by whichever URL shape.
  def self.image_ids_in(markdown)
    return [] if markdown.blank?

    embedded_ids = markdown.scan(MARKDOWN_IMAGE_URL_PATTERN).flatten
    where(id: embedded_ids).ids + with_blob_ids(blob_ids_in(markdown)).ids
  end

  def self.blob_ids_in(markdown)
    return [] if markdown.blank?

    blob_ids = markdown.scan(ACTIVE_STORAGE_URL_PATTERN).flatten.filter_map { blob_id_from(it) }
    keys = markdown.scan(CDN_URL_PATTERN).flatten

    blob_ids + ActiveStorage::Blob.where(key: keys).ids
  end

  # The blob id is stored in plaintext inside the signed id; the signature only
  # prevents forgery. We decode rather than verify because `find_signed` resolves
  # none of the ids embedded in existing markdown - they were signed with keys
  # this app no longer uses - and a forged id gains nothing anyway: it can only
  # claim a usage of a file whose URL the author already has.
  def self.blob_id_from(signed_id)
    # Strip any existing padding before re-padding, so both the padded and
    # unpadded encodings in the wild decode the same way.
    payload = signed_id.split('--').first.delete('=')
    padded = payload + ('=' * (-payload.length % 4))
    rails = JSON.parse(Base64.urlsafe_decode64(padded)).fetch('_rails')

    return rails['data'] if rails.key?('data')

    marshal_integer(Base64.decode64(rails.fetch('message')))
  rescue StandardError
    nil
  end

  # Legacy signed ids wrap a Marshal-encoded integer. Parse it by hand rather
  # than calling Marshal.load on stored content.
  def self.marshal_integer(raw)
    return nil unless raw.byteslice(0, 3) == "\x04\bi".b

    bytes = raw.byteslice(3..).to_s.bytes
    head = bytes.shift
    return nil if head.nil?
    return 0 if head.zero?
    return head - 5 if head.between?(5, 127)
    return nil unless head.between?(1, 4)

    bytes.first(head).each_with_index.sum { |byte, i| byte << (8 * i) }
  end
  private_class_method :marshal_integer

  # These URLs get embedded in posts and competition tabs, so they are fetched by
  # every visitor. Serving them from the CDN instead of via an ActiveStorage
  # redirect (which hands out a short-lived presigned S3 URL, defeating browser
  # caching) keeps them out of the S3 egress bill.
  def url
    # Private images are never on the CDN - they go through the controller, which
    # authorises the viewer first.
    return Rails.application.routes.url_helpers.markdown_image_url(self) if self.private?
    return Rails.application.routes.url_helpers.rails_blob_url(self.image) if Rails.env.local?

    URI.join(EnvConfig.S3_UPLOADS_ASSET_HOST, self.image.key).to_s
  end
end
