# frozen_string_literal: true

class HideWdpcTeam < ActiveRecord::Migration[5.2]
  def change
    Team.find_by_friendly_id('wdpc').update!(hidden: true, email: nil)
  end
end
