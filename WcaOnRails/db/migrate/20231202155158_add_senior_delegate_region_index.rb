class AddSeniorDelegateRegionIndex < ActiveRecord::Migration[7.1]
  def change
    add_index :users, [:region_id, :delegate_status]
  end
end
