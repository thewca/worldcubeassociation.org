# frozen_string_literal: true

class MarkFeetAsUnofficial < ActiveRecord::Migration[5.2]
  def up
    Event.find("333ft").update!(rank: 996)
    end
  end
  def down
    Event.find("333ft").update!(rank: 100)
  end
end
