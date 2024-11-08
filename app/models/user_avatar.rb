# frozen_string_literal: true

class UserAvatar < ApplicationRecord
  belongs_to :user, touch: true, inverse_of: :user_avatars

  has_one :current_user, class_name: "User", foreign_key: :current_avatar_id, inverse_of: :current_avatar, dependent: :nullify
  has_one :pending_user, class_name: "User", foreign_key: :pending_avatar_id, inverse_of: :pending_avatar, dependent: :nullify

  belongs_to :approved_by_user, class_name: "User", foreign_key: :approved_by, optional: true
  belongs_to :revoked_by_user, class_name: "User", foreign_key: :revoked_by, optional: true

  has_one_attached :public_image, service: EnvConfig.AVATARS_PUBLIC_STORAGE
  has_one_attached :private_image, service: EnvConfig.AVATARS_PRIVATE_STORAGE

  default_scope { with_attached_public_image }

  delegate :attached?, to: :image

  enum :status, {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deleted: 'deleted',
    deprecated: 'deprecated',
  }, default: :pending

  enum :backend, {
    s3_legacy_cdn: 's3-legacy-cdn',
    active_storage: 'active-storage',
    local: 'local-fs',
  }, default: :active_storage, scopes: false

  MAX_UPLOAD_SIZE = 2.megabytes

  validates :public_image, blob: { content_type: :web_image, size_range: 0..MAX_UPLOAD_SIZE }
  validates :private_image, blob: { content_type: :web_image, size_range: 0..MAX_UPLOAD_SIZE }

  def url
    case self.backend
    when 's3_legacy_cdn'
      host = EnvConfig.S3_AVATARS_ASSET_HOST.delete_prefix('https://')
      path = "/uploads/user/avatar/#{user.wca_id}/#{self.filename}"

      URI::HTTPS.build(host: host, path: path).to_s
    when 'active_storage'
      if self.using_cdn?
        URI.join(EnvConfig.S3_AVATARS_ASSET_HOST, self.image.key).to_s
      else
        Rails.application.routes.url_helpers.rails_representation_url(self.image)
      end
    when 'local'
      ActionController::Base.helpers.asset_url(self.filename)
    end
  end

  def thumbnail_url
    case self.backend
    when 's3_legacy_cdn'
      host = EnvConfig.S3_AVATARS_ASSET_HOST.delete_prefix('https://')

      actual_filename, file_ending = self.filename.split('.')
      thumb_filename = "#{actual_filename}_thumb.#{file_ending}"

      path = "/uploads/user/avatar/#{user.wca_id}/#{thumb_filename}"

      URI::HTTPS.build(host: host, path: path).to_s
    when 'active_storage'
      if self.using_cdn?
        URI.join(EnvConfig.S3_AVATARS_ASSET_HOST, self.thumbnail_image.processed.key).to_s
      else
        Rails.application.routes.url_helpers.rails_representation_url(self.thumbnail_image)
      end
    else
      # The default Avatar is its own thumbnail
      return self.url if self.default_avatar?

      # Only get the thumbnail if AR does the image processing for us
      nil
    end
  end

  alias_method :thumb_url, :thumbnail_url

  def using_cdn?
    # Approved avatars are actively being used and should therefor be served by our CDN
    self.approved? && self.attached? && !Rails.env.local?
  end

  def filename
    self.active_storage? ? self.image.blob.filename.to_s : super
  end

  def image
    self.approved? ? self.public_image : self.private_image
  end

  def thumbnail_image
    self.image.variant(
      crop: [
        self.thumbnail_crop_x,
        self.thumbnail_crop_y,
        self.thumbnail_crop_w,
        self.thumbnail_crop_h,
      ],
      resize_and_pad: [100, 100],
    )
  end

  def attach_image(file)
    self.image.attach(file)
  end

  def default_avatar?
    self.filename == DEFAULT_AVATAR_FILE && self.local?
  end

  alias_method :is_default, :default_avatar?

  def can_edit_thumbnail?
    # Only freshly uploaded pictures using the new ActiveStorage backend can affect their thumbnail.
    #   This is a temporary patch while the backwards-compatible s3-legacy-cdn still exists.
    self.active_storage?
  end

  alias_method :can_edit_thumbnail, :can_edit_thumbnail?

  after_save :move_user_associations,
             if: :status_previously_changed?,
             unless: :destroyed?

  def move_user_associations
    if self.status == UserAvatar.statuses[:pending]
      user.update_attribute(:pending_avatar, self)
    elsif user.pending_avatar_id == self.id
      # Only delete the user's pending avatar if `self` was indeed the pending avatar before saving.
      # Otherwise, changing a confirmed_avatar to `deleted` or `rejected` would touch the pending_avatar_id on the user.
      user.update_attribute(:pending_avatar, nil)
    end

    if self.status == UserAvatar.statuses[:approved]
      if user.current_avatar_id != self.id
        # Mark the previous avatar as 'deprecated', so that its public file gets removed.
        #   The most common use-case is for users to upload new avatars (which are then pending approval)
        #   without explicitly deleting the old one. By using this status change,
        #   we can make sure that the then-old avatar (after approval) gets moved to the private file instead.
        user.current_avatar&.update!(status: UserAvatar.statuses[:deprecated])
      end

      user.update_attribute(:current_avatar, self)
    elsif user.current_avatar_id == self.id
      user.update_attribute(:current_avatar, nil)
    end
  end

  after_save :move_image_if_approved,
             # In the long run, the active_storage? check should disappear.
             #   The local-fs enum entry is only used for the dummy avatar, and that one is never deleted.
             #   The s3-legacy-cdn will be replaced/migrated in the future.
             if: [:active_storage?, :status_previously_changed?],
             unless: :destroyed?

  def move_image_if_approved
    old_status, new_status = self.status_previous_change

    # If there is no old_status, it means we just inserted the record.
    # In that case, there is nothing to reattach.
    return unless old_status.present?

    if new_status == UserAvatar.statuses[:approved]
      # We approved a new avatar! Take the previously private file and upload it to public storage.
      self.reattach_image(
        self.private_image,
        self.public_image,
      )
    elsif old_status == UserAvatar.statuses[:approved]
      # We un-approved (deleted OR rejected) an old avatar. Take the previously public file and make it private.
      self.reattach_image(
        self.public_image,
        self.private_image,
      )
    end
  end

  private def reattach_image(from_file, to_file)
    # ActiveStorage is a bit inconvenient when moving files around.
    #   Simply writing `to_file.attach(from_file.blob)` makes the code execute successfully,
    #   but under the hood the file is not actually moved because AS thinks that it's already uploaded :/
    # Thus, we have to download the whole thing and re-upload again…
    to_file.attach(
      io: StringIO.new(from_file.download),
      filename: from_file.filename,
      content_type: from_file.content_type,
    )

    from_file.purge_later
  end

  after_save :invalidate_thumbnail_if_approved,
             if: [:active_storage?, :approved?, :attached?],
             unless: :destroyed?

  def invalidate_thumbnail_if_approved
    return unless AppSecrets.CDN_AVATARS_DISTRIBUTION_ID.present?

    thumbnail_changed = self.thumbnail_crop_x_previously_changed? ||
                        self.thumbnail_crop_y_previously_changed? ||
                        self.thumbnail_crop_w_previously_changed? ||
                        self.thumbnail_crop_h_previously_changed?

    return unless thumbnail_changed

    cloudfront_sdk = ::Aws::CloudFront::Client.new(
      region: EnvConfig.S3_AVATARS_REGION,
      access_key_id: AppSecrets.AWS_ACCESS_KEY_ID,
      secret_access_key: AppSecrets.AWS_SECRET_ACCESS_KEY,
    )

    store_path = self.thumbnail_image.processed.key.delete_prefix('/')
    api_reference = "avatar-thumbnail_#{self.id}_#{Time.now.to_i}"

    # the hash keys and structure are per Amazon AWS' documentation
    # https://docs.aws.amazon.com/sdk-for-ruby/v3/api/Aws/CloudFront/Client.html#create_invalidation-instance_method
    cloudfront_sdk.create_invalidation({
                                         distribution_id: AppSecrets.CDN_AVATARS_DISTRIBUTION_ID,
                                         invalidation_batch: {
                                           paths: {
                                             quantity: 1,
                                             items: ["/#{store_path}"], # AWS SDK throws an error if the path doesn't start with "/"
                                           },
                                           caller_reference: api_reference,
                                         },
                                       })
  end

  # It is crucial to trigger this hook last. Even though the `.touch` method in itself doesn't
  #   trigger any subsequent *_save hooks, it "ruins" the other two save hooks' `previous_change` attribute reading.
  after_save :register_status_timestamps,
             if: :status_previously_changed?,
             unless: :destroyed?

  def register_status_timestamps
    if self.status == UserAvatar.statuses[:approved]
      self.touch :approved_at
    elsif self.status == UserAvatar.statuses[:rejected] || self.status == UserAvatar.statuses[:deleted]
      self.touch :revoked_at
    end
  end

  def to_wcif
    {
      "url" => self.url,
      "thumbUrl" => self.thumbnail_url,
    }
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "url" => { "type" => "string" },
        "thumbUrl" => { "type" => "string" },
      },
    }
  end

  DEFAULT_AVATAR_FILE = "missing_avatar_thumb.png"

  def self.default_avatar(for_user, status: UserAvatar.statuses[:approved])
    UserAvatar.new(
      user: for_user,
      status: status,
      filename: DEFAULT_AVATAR_FILE,
      thumbnail_crop_x: 0,
      thumbnail_crop_y: 0,
      thumbnail_crop_w: 100,
      thumbnail_crop_h: 100,
      backend: UserAvatar.backends[:local],
    )
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "status", "thumbnail_crop_x", "thumbnail_crop_y", "thumbnail_crop_w", "thumbnail_crop_h"],
    methods: ["url", "thumb_url", "is_default", "can_edit_thumbnail"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
