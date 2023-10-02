# frozen_string_literal: true

class UserAvatar < ApplicationRecord
  belongs_to :user

  belongs_to :approved_by_user, class_name: "User", foreign_key: :approved_by
  belongs_to :revoked_by_user, class_name: "User", foreign_key: :revoked_by

  has_one_attached :public_image
  has_one_attached :private_image, service: :local_private

  default_scope { with_attached_public_image }

  enum :status, {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deleted: 'deleted',
  }, default: :pending

  enum :backend, {
    s3_cdn: 's3-cdn',
    active_storage: 'active-storage',
    local: 'local-fs',
  }, default: :active_storage, scopes: false

  def url
    case self.backend
    when 's3_cdn'
      host = EnvConfig.S3_AVATARS_ASSET_HOST.delete_prefix('https://')
      path = "/uploads/user/avatar/#{user.wca_id}/#{self.filename}"

      URI::HTTPS.build(host: host, path: path).to_s
    when 'active_storage'
      Rails.application.routes.url_helpers.rails_representation_url(self.image) if self.image.present?
    when 'local'
      ActionController::Base.helpers.asset_url(self.filename, host: EnvConfig.ROOT_URL)
    end
  end

  def filename
    self.backend == 'active_storage' ? self.image.blob.filename.to_s : super
  end

  def image
    self.approved? ? self.public_image : self.private_image
  end

  def attach_image(file)
    self.image.attach(file)
  end

  after_save :move_image_if_approved
  def move_image_if_approved
    # ActiveStorage takes care of purging attachments from destroyed records
    return if self.destroyed?

    old_status, new_status = self.status_previous_change

    # NOTE: Yes, this could be realised through status_changed?, but then we'd need to query the changes later anyways…
    if old_status != new_status
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
  end

  def to_wcif
    {
      "url" => self.url,
      "thumbnail" => {
        "x" => self.thumbnail_crop_x,
        "y" => self.thumbnail_crop_y,
        "w" => self.thumbnail_crop_w,
        "h" => self.thumbnail_crop_h,
      },
    }
  end

  def self.wcif_json_schema
    {
      "type" => ["object", "null"],
      "properties" => {
        "url" => { "type" => "string" },
        "thumbnail" => {
          "type" => "object",
          "properties" => {
            "x" => "integer",
            "y" => "integer",
            "w" => "integer",
            "h" => "integer",
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
    methods: ["url"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
