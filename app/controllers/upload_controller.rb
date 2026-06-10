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
    )

    render json: { filePath: url_for(blob) }
  end
end
