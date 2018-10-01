# frozen_string_literal: true

class CreateUploadedJson < ActiveRecord::Migration[5.2]
  def change
    create_table :uploaded_jsons do |t|
      t.belongs_to :competition
      t.text :json_str
    end
  end
end
