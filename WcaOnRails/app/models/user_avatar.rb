# frozen_string_literal: true

class UserAvatar < ApplicationRecord
  belongs_to :user

  enum :status, {
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    deleted: 'deleted',
  }, default: :pending

  enum :backend, {
    s3_cdn: 's3-cdn',
    s3_private: 's3-private',
    local: 'local-fs',
  }, scopes: false

  def url
    case self.backend
    when 's3_cdn'
      host = EnvConfig.S3_AVATARS_ASSET_HOST.delete_prefix('https://')
      path = "/uploads/user/avatar/#{user.wca_id}/#{self.filename}"

      URI::HTTPS.build(host: host, path: path).to_s
    when 's3_private'
      'https://yay.lol/'
    when 'local'
      ActionController::Base.helpers.asset_url(self.filename, host: EnvConfig.ROOT_URL)
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
