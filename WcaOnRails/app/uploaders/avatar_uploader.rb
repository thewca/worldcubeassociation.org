class AvatarUploader < AvatarUploaderBase
  # Create different versions of your uploaded files:
  version :thumb do
    process crop: :avatar
    process resize_to_fit: [100, 100]
  end
end
