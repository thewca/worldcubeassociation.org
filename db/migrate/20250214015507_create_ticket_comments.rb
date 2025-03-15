# rubocop:disable all
# frozen_string_literal: true

class CreateTicketComments < ActiveRecord::Migration[7.2]
  def change
    create_table :ticket_comments do |t|
      t.references :ticket, foreign_key: { to_table: :tickets }, null: false
      t.text :comment
      t.references :acting_user, type: :integer, foreign_key: { to_table: :users }, null: false
      t.references :acting_stakeholder, foreign_key: { to_table: :ticket_stakeholders }, null: false
      t.timestamps
    end
  end
end
