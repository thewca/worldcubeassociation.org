class CreateDelegateReportsForAllComps < ActiveRecord::Migration
  def change
    Competition.all.each do |competition|
      competition.create_delegate_report! unless competition.delegate_report
    end
  end
end
