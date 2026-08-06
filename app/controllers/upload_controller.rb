# frozen_string_literal: true

class UploadController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_images?) }

  def image
    upload_image = params.require(:image)

    # Unfortunately, there doesn't seem to be any good way to add validations
    # on file type/content type/etc. See
    # https://github.com/thewca/worldcubeassociation.org/issues/4380 for more
    # information.
    blob = ActiveStorage::Blob.create_and_upload!(
      io: upload_image,
      filename: upload_image.original_filename,
      content_type: upload_image.content_type,
      service_name: EnvConfig.UPLOADS_STORAGE,
    )

    render json: { filePath: blob_url(blob) }
  end

  # These URLs get embedded in posts and competition tabs, so they are fetched by
  # every visitor. Serving them from the CDN instead of via an ActiveStorage
  # redirect (which hands out a short-lived presigned S3 URL, defeating browser
  # caching) keeps them out of the S3 egress bill.
  private def blob_url(blob)
    return url_for(blob) if Rails.env.local?

    URI.join(EnvConfig.S3_UPLOADS_ASSET_HOST, blob.key).to_s
  end
end
