class Registration < ActiveRecord::Base
  self.table_name = "Preregs"

  belongs_to :competition, foreign_key: "competitionId"

  # TODO - validation on status, it should be either "p" or "a"
  def accepted?
    status == "a"
  end

  def pending?
    status == "p"
  end

  def birthday
    "%04i-%02i-%02i" % [ birthYear, birthMonth, birthDay ]
  end
end
