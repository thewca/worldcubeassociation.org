# frozen_string_literal: true

class RemoveDelegateReportsWithoutComps < ActiveRecord::Migration
  def change
    DelegateReport.all.reject(&:competition).each(&:destroy!)
  end
end
