# frozen_string_literal: true

class RemoveSelfDeleteAfterAcceptance < ActiveRecord::Migration[7.2]
  def change
    remove_column :competitions, :allow_registration_self_delete_after_acceptance, :boolean
  end
end
