# frozen_string_literal: true

class AddFilenameToScrambleFileUploads < ActiveRecord::Migration[7.2]
  def change
    add_column :scramble_file_uploads, :original_filename, :string, after: :competition_id
  end
end
