class RemoveDelegateFieldsFromUser < ActiveRecord::Migration
  def change
    remove_column :users, :delegate_status, :string
    remove_column :users, :senior_delegate_id, :integer
    remove_column :users, :region, :string
  end
end
