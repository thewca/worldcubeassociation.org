# frozen_string_literal: true

# One of the extendable models is Competition, with id type of string.
# To support that we need the wcif_extensions.extendable_id to also be a string.
# For models with normal numeric ids they will be automatically converted to strings, so that's fine.

class ChangeWcifExtensionsExtendableIdToString < ActiveRecord::Migration[5.2]
  def change
    change_column :wcif_extensions, :extendable_id, :string
  end
end
