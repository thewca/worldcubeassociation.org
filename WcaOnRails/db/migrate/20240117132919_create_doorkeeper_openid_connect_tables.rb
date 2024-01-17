class CreateDoorkeeperOpenidConnectTables < ActiveRecord::Migration[7.1]
  def change
    create_table :oauth_openid_requests do |t|
      t.references :access_grant, null: false, index: true
      t.string :nonce, null: false
    end

    add_foreign_key(
      :oauth_openid_requests,
      :oauth_access_grants,
      column: :access_grant_id,
      on_delete: :cascade
    )
  end
end
