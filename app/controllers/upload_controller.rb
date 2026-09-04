# frozen_string_literal: true

class UploadController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_images?) }

  def image
    markdown_image = MarkdownImage.new(uploaded_by: current_user, visibility: visibility_param)
    markdown_image.attach_image(params.require(:image))

    # The image is not associated with anything yet: the record it is being typed
    # into may not even exist. It gets claimed on save, see HasMarkdownImages.
    return render json: { error: markdown_image.errors.full_messages.to_sentence }, status: :unprocessable_content unless markdown_image.save

    render json: { filePath: markdown_image.url }
  end

  # The uploading form declares where the image is headed, because the record
  # that will own it often does not exist yet and the bucket decides the URL that
  # gets written into the markdown. Anything we do not recognise is treated as
  # private, so a form that forgets cannot leak.
  private def visibility_param
    params[:visibility] == MarkdownImage.visibilities[:public] ? :public : :private
  end
end
