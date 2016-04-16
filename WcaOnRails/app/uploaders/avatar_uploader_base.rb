class AvatarUploaderBase < CarrierWave::Uploader::Base
  include CarrierWave::MiniMagick

  # Choose what kind of storage to use for this uploader:
  storage :file
  # storage :fog

  configure do |config|
    config.remove_previously_stored_files_after_update = false
  end

  # Override the directory where uploaded files will be stored.
  # This is a sensible default for uploaders that are meant to be mounted:
  def store_dir
    # NOTE that we are storing avatars by wca_id. There are two consequences of this:
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
    ActionController::Base.helpers.asset_path("missing_avatar_thumb.png")
  end

  # Create different versions of your uploaded files:
  process resize_to_fit: [800, 800]

  # Add a white list of extensions which are allowed to be uploaded.
  # For images you might use something like this:
  def extension_white_list
    %w(jpg jpeg gif png)
  end

  # Override the filename of the uploaded files:
  # Avoid using model.id or version_name here, see uploader/store.rb for details.
  # From https://github.com/carrierwaveuploader/carrierwave/wiki/How-to:-Use-a-timestamp-in-file-names
  # Also important: https://github.com/carrierwaveuploader/carrierwave/wiki/How-to%3A-Create-random-and-unique-filenames-for-all-versioned-files#note
  def filename
    if original_filename
      # This is pretty gross. We only want to reuse the existing filename if
      # a new avatar isn't being uploaded, we look at the *_change attribute to
      # determine if that happened.
      if model && model.read_attribute(mounted_as).present? && !model.send(:"#{mounted_as}_change")
        model.read_attribute(mounted_as)
      else
        # new filename
        @name ||= "#{timestamp}.#{model.send(mounted_as).file.extension}" if original_filename
      end
    end
  end

  def timestamp
    var = :"@#{mounted_as}_timestamp"
    model.instance_variable_get(var) or model.instance_variable_set(var, Time.now.to_i)
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

if File.exist? "/vagrant"
  # Workaround for Vagrant bug with sendfile.
  # carrierwave uses FileUtils.cp to copy around files that it
  # mutates with mogrify, which exposes this bug.
  # See https://github.com/mitchellh/vagrant/issues/351.
  module FileUtils
    def cp(src, dest, options = {})
      `cp #{src.shellescape} #{dest.shellescape}`
    end
    module_function :cp
  end
end
