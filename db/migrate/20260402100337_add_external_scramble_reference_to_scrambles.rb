# frozen_string_literal: true

class AddExternalScrambleReferenceToScrambles < ActiveRecord::Migration[8.1]
  def change
    add_reference :scrambles, :external_scramble, index: false, foreign_key: { on_delete: :nullify }
  end
end
