class Competition < ActiveRecord::Base
  self.table_name = "Competitions"
  validates :name, length: { maximum: 50 }
  attr_accessor :start_date, :end_date
  before_validation :unpack_dates
  validate :valid_dates

  def start_date
    year == 0 || month == 0 || day == 0 ? "" : "%04i-%02i-%02i" % [ year, month, day ]
  end

  def end_date
    endYear = @endYear || year # gross hack to remember the years of a multiyear competition
    endYear == 0 || endMonth == 0 || endDay == 0 ? "" : "%04i-%02i-%02i" % [ endYear, endMonth, endDay ]
  end

  def start_date=(new_start_date)
    @start_date = new_start_date
  end

  def end_date=(new_end_date)
    @end_date = new_end_date
  end

  private def unpack_dates
    if @start_date.blank?
      self.year = self.month = self.day = 0
    else
      self.year, self.month, self.day = @start_date.split("-").map(&:to_i)
    end
    if @end_date.blank?
      @endYear = self.endMonth = self.endDay = 0
    else
      @endYear, self.endMonth, self.endDay = @end_date.split("-").map(&:to_i)
    end
  end

  private def valid_dates
    if self.year == 0 && self.month == 0 && self.day == 0 && @endYear == 0 && self.endMonth == 0 && self.endDay == 0
      # If the user left both dates empty, that's a-okay.
      return
    end

    valid_dates = true
    unless Date.valid_date? year, month, day
      valid_dates = false
      errors.add(:start_date, "Invalid start date.")
    end
    unless Date.valid_date? @endYear, endMonth, endDay
      valid_dates = false
      errors.add(:end_date, "Invalid end date.")
    end
    unless valid_dates
      # There's no use continuing validation at this point.
      return
    end

    if end_date < start_date
      errors.add(:end_date, "End date cannot be before start date.")
    end

    if @endYear != year
      errors.add(:end_date, "Competition dates cannot span multiple years.")
    end
  end
end
