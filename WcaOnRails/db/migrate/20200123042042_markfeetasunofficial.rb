# frozen_string_literal: true

class MarkFeetAsUnofficial < ActiveRecord::Migration[5.2]
  def change
    Event.find("333ft").update!(rank: 996)
  end
end
