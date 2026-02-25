# frozen_string_literal: true

class AddUploadTypeToUploadedJson < ActiveRecord::Migration[8.1]
  def change
    add_column :uploaded_jsons, :upload_type, :string

    reversible do |dir|
      dir.up do
        UploadedJson.update_all(upload_type: :results_json)
      end
    end

    change_column_null :uploaded_jsons, :upload_type, false
  end
end
