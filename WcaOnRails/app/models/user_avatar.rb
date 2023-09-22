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
    when UserAvatar.backends[:s3_cdn]
      'https://foo.bar/'
    when UserAvatar.backends[:s3_private]
      'https://yay.lol/'
    when UserAvatar.backends[:local]
      'file://some/where'
    end
  end

  DEFAULT_SERIALIZE_OPTIONS = {
    only: ["id", "status", "thumbnail_crop_x", "thumbnail_crop_y", "thumbnail_crop_w", "thumbnail_crop_h"],
    methods: ["url"],
  }.freeze

  def serializable_hash(options = nil)
    super(DEFAULT_SERIALIZE_OPTIONS.merge(options || {}))
  end
end
