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

  enum :status, {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deleted: 'deleted',
  }, default: :pending

  enum :backend, {
    s3_legacy_cdn: 's3-legacy-cdn',
    active_storage: 'active-storage',
    local: 'local-fs',
  }, default: :active_storage, scopes: false

  def url
    case self.backend
    when 's3_legacy_cdn'
      host = EnvConfig.S3_AVATARS_ASSET_HOST.delete_prefix('https://')
      path = "/uploads/user/avatar/#{user.wca_id}/#{self.filename}"

      URI::HTTPS.build(host: host, path: path).to_s
    when 'active_storage'
      if self.approved?
        Rails.application.routes.url_helpers.rails_storage_proxy_path(self.image)
      else
        Rails.application.routes.url_helpers.rails_representation_url(self.image)
      end
    when 'local'
      ActionController::Base.helpers.asset_url(self.filename, host: EnvConfig.ROOT_URL)
    end
  end

  def thumbnail_url
    case self.backend
    when 'active_storage'
      if self.approved?
        Rails.application.routes.url_helpers.rails_storage_proxy_path(self.image)
      else
        Rails.application.routes.url_helpers.rails_representation_url(self.image)
      end
    else
      # Only get the thumbnail if AR does the image processing for us
      nil
    end
  end

  def filename
    self.active_storage? ? self.image.blob.filename.to_s : super
  end

  def image
    self.approved? ? self.public_image : self.private_image
  end

  def thumbnail_image
    self.image.variant(
      resize_and_pad: [100, 100],
      crop: [
        self.thumbnail_crop_x,
        self.thumbnail_crop_y,
        self.thumbnail_crop_w,
        self.thumbnail_crop_h,
      ],
    )
  end

  def attach_image(file)
    self.image.attach(file)
  end

  def is_default?
    self.filename == DEFAULT_AVATAR_FILE && self.backend == UserAvatar.backends[:local]
  end

  after_save :move_image_if_approved,
             if: [:active_storage?, :status_previously_changed?],
             # ActiveStorage takes care of purging attachments from destroyed records
             unless: :destroyed?

  private def move_image_if_approved
    old_status, new_status = self.status_previous_change

    if new_status == UserAvatar.statuses[:approved]
      # We approved a new avatar! Take the previously private file and upload it to public storage.
      self.public_image.attach(self.private_image.blob)
      self.private_image.purge_later
    elsif old_status == UserAvatar.statuses[:approved]
      # We un-approved (deleted OR rejected) an old avatar. Take the previously public file and make it private.
      self.private_image.attach(self.public_image.blob)
      self.public_image.purge_later
    end
  end

  after_save :add_user_associations,
             if: :user_previously_changed?,
             unless: :destroyed?

  def add_user_associations
    if self.status == UserAvatar.statuses[:pending]
      user.update_attribute(:pending_avatar, self)
    elsif self.status == UserAvatar.statuses[:approved]
      user.update_attribute(:current_avatar, self)
    end
  end

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
      user.update_attribute(:current_avatar, self)
    elsif user.current_avatar_id == self.id
      user.update_attribute(:current_avatar, nil)
    end
  end

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
      "id" => self.id,
      "url" => self.url,
      "thumbnail" => {
        "x" => self.thumbnail_crop_x,
        "y" => self.thumbnail_crop_y,
        "width" => self.thumbnail_crop_w,
        "height" => self.thumbnail_crop_h,
      },
    }
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "id" => { "type" => "integer" },
        "url" => { "type" => "string" },
        "thumbnail" => {
          "type" => "object",
          "properties" => {
            "x" => { "type" => "integer" },
            "y" => { "type" => "integer" },
            "width" => { "type" => "integer" },
            "height" => { "type" => "integer" },
          },
        },
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
    methods: ["url", "is_default?"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
