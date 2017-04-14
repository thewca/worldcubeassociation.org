# frozen_string_literal: true

class CreateDelegateReportsForAllComps < ActiveRecord::Migration
  def change
    Competition.find_each do |competition|
      competition.create_delegate_report! unless competition.delegate_report
    end
  end
end
