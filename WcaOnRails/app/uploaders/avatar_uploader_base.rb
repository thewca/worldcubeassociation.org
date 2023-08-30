# frozen_string_literal: true

require 'aws-sdk-cloudfront'

class AvatarUploaderBase < CarrierWave::Uploader::Base
  include CarrierWave::MiniMagick

  def self.connection_cache
    @connection_cache ||= {}
  end

  def cloudfront_sdk
    @cloudfront_sdk ||= begin
      conn_cache = self.class.connection_cache
      conn_cache[storage.credentials] ||= ::Aws::CloudFront::Client.new(*storage.credentials)
    end
  end

  def invalidate_cdn_cache(reference)
    if EnvVars.CDN_AVATARS_DISTRIBUTION_ID.present?
      # the hash keys and structure are per Amazon AWS' documentation
      # https://docs.aws.amazon.com/sdk-for-ruby/v3/api/Aws/CloudFront/Client.html#create_invalidation-instance_method
      cloudfront_sdk.create_invalidation({
                                           distribution_id: EnvVars.CDN_AVATARS_DISTRIBUTION_ID,
                                           invalidation_batch: {
                                             paths: {
                                               quantity: 1,
                                               items: ["/#{store_path}"], # AWS SDK throws an error if the path doesn't start with "/"
                                             },
                                             caller_reference: reference,
                                           },
                                         })
    end
  end

  # Copied from https://makandracards.com/makandra/12323-carrierwave-auto-rotate-tagged-jpegs.
  process :auto_orient

  def auto_orient
    manipulate! do |image|
      image.tap(&:auto_orient)
    end
  end

  def self.missing_avatar_thumb_url
    @@missing_avatar_thumb_url ||= ActionController::Base.helpers.asset_url("missing_avatar_thumb.png", host: EnvVars.ROOT_URL).freeze
  end

  # Choose what kind of storage to use for this uploader:
  storage :aws

  configure do |config|
    config.remove_previously_stored_files_after_update = false
  end

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    # NOTE: that we are storing avatars by wca_id. There are two consequences of this:
    #  - A user must have a wca_id to have an avatar (see validations in user.rb).
    #  - Changing the wca_id for a user is complicated, and not something we
    #    are bothering to handle very well.
    "uploads/#{model.class.to_s.underscore}/avatar/#{model.wca_id}"
  end

  # Yup...
  attr_writer :override_column_value

  def identifier
    @override_column_value || super
  end

  # Provide a default URL as a default if there hasn't been a file uploaded:
  def default_url
    AvatarUploaderBase.missing_avatar_thumb_url
  end

  # Create different versions of your uploaded files:
  process resize_to_fit: [800, 800]

  # Add an allow list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  def extension_allowlist
    %w(jpg jpeg gif png)
  end

  # Additionally filter uploads by content type,
  # mainly to mitigate CVE-2016-3714
  def content_type_allowlist
    %r{image/}
  end

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # From https://github.com/carrierwaveuploader/carrierwave/wiki/How-to:-Use-a-timestamp-in-file-names
  # Also important: https://github.com/carrierwaveuploader/carrierwave/wiki/How-to%3A-Create-random-and-unique-filenames-for-all-versioned-files#note
  def filename
    if original_filename
      # This is pretty gross. We only want to reuse the existing filename if a new avatar isn't being uploaded.
      # In order to determine the change, we look at the model attributes that are changing through ActiveRecord::Dirty.
      if model && model.read_attribute(mounted_as).present? && !model.attribute_changed?(mounted_as)
        model.read_attribute(mounted_as)
      else
        # new filename
        @name ||= "#{timestamp}.#{model.send(mounted_as).file.extension}" if original_filename.present?
      end
    end
  end

  def timestamp
    var = :"@#{mounted_as}_timestamp"
    model.instance_variable_get(var) || model.instance_variable_set(var, Time.now.to_i)
  end
end

# Monkeypatch from https://github.com/carrierwaveuploader/carrierwave/wiki/how-to:-move-version-name-to-end-of-filename,-instead-of-front
# Changes filenames from thumb_FILENAME to FILENAME_thumb for better sorting.
module CarrierWave
  module Uploader
    module Versions
      def full_filename(for_file)
        parent_name = super(for_file)
        ext = File.extname(parent_name)
        base_name = parent_name.chomp(ext)
        [base_name, version_name].compact.join('_') + ext
      end

      def full_original_filename
        parent_name = super
        ext = File.extname(parent_name)
        base_name = parent_name.chomp(ext)
        [base_name, version_name].compact.join('_') + ext
      end
    end
  end
end
