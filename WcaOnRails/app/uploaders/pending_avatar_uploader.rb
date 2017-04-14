# frozen_string_literal: true

class PendingAvatarUploader < AvatarUploaderBase
  # Create different versions of your uploaded files:
  version :thumb do
    process crop: :pending_avatar
    process resize_to_fit: [100, 100]
  end
end
