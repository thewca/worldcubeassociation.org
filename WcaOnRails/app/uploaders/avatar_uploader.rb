class AvatarUploader < AvatarUploaderBase
  # Create different versions of your uploaded files:
  version :thumb do
    process crop: :avatar
    process resize_and_pad: [100, 100]
  end
end
