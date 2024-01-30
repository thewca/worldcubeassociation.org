class CreateConnectedPaypalAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :connected_paypal_accounts do |t|
      t.string :account_id

      t.timestamps
    end
  end
end
