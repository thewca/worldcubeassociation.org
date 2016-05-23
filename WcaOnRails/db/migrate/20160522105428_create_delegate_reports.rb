class CreateDelegateReports < ActiveRecord::Migration
  def change
    create_table :delegate_reports do |t|
      t.string :competition_id
      t.text :content, null: false
      t.datetime :created_at
      t.datetime :updated_at
      t.datetime :posted_at

      t.timestamps null: false
    end
    add_index :delegate_reports, :competition_id, unique:true
  end
end
