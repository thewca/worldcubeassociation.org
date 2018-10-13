# frozen_string_literal: true

class CreateUploadedJson < ActiveRecord::Migration[5.2]
  def change
    create_table :uploaded_jsons do |t|
      t.string :competition_id
      t.longtext :json_str
    end
    add_index :uploaded_jsons, :competition_id
  end
end
