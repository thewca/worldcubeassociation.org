# frozen_string_literal: true

class UploadController < ApplicationController
  before_action :authenticate_user!
  before_action -> { redirect_to_root_unless_user(:can_upload_images?) }

  def image
    attached_image = AttachedImage.new(uploaded_by: current_user)
    attached_image.image.attach(params.require(:image))

    # The image is not associated with anything yet: the record it is being typed
    # into may not even exist.
    return render json: { error: attached_image.errors.full_messages.to_sentence }, status: :unprocessable_content unless attached_image.save

    render json: { filePath: url_for(attached_image.image.blob) }
  end
end
