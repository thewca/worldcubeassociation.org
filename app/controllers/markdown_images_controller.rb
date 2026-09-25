# frozen_string_literal: true

# Serves markdown images that live in the private bucket. Public ones never come
# through here - they are fetched straight from the CDN.
class MarkdownImagesController < ApplicationController
  # Populates ActiveStorage::Current.url_options, which blob.url needs to build a
  # URL for the current host.
  include ActiveStorage::SetCurrent

  def show
    markdown_image = MarkdownImage.includes(usages: :attachable).find(params.expect(:id))

    return render plain: "Not found", status: :not_found unless markdown_image.viewable_by?(current_user)

    # A redirect rather than a proxy: the presigned URL is short-lived, and this
    # keeps the image data out of the Rails process.
    redirect_to markdown_image.image.url, allow_other_host: true
  end
end
