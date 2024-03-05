# frozen_string_literal: true

class AvatarUploader < AvatarUploaderBase
  # Create different versions of your uploaded files:
  version :thumb do
    process crop: :avatar
    process resize_and_pad: [100, 100]

    # override `store!` method from CarrierWave
    def store!(new_file = nil)
      super(new_file)
      invalidate_cdn_cache "thumbnail-crop-#{Time.now.to_i}"
    end
  end
end
