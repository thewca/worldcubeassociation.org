# frozen_string_literal: true

class AddNewResult
  include ActiveModel::Model

  attr_reader :is_new_competitor
  attr_reader :competitor_id
  attr_reader :name, :country_id, :dob, :gender, :semi_id
  attr_reader :competition_id, :event_id, :round_id
  attr_reader :value1, :value2, :value3, :value4, :value5

  def is_new_competitor=(is_new_competitor)
    @is_new_competitor = is_new_competitor
  end

  def competitor_id=(competitor_id)
    @competitor_id = competitor_id
  end

  def name=(name)
    @name = name
  end

  def country_id=(country_id)
    @country_id = country_id
  end

  def dob=(dob)
    @dob = dob
  end

  def gender=(gender)
    @gender = gender
  end

  def semi_id=(semi_id)
    @semi_id = semi_id
  end

  def competition_id=(competition_id)
    @competition_id = competition_id
  end

  def event_id=(event_id)
    @event_id = event_id
  end

  def round_id=(round_id)
    @round_id = round_id
  end

  def value1=(value1)
    @value1 = value1
    @value1_solve_time = SolveTime.new(event_id, :best, value1.to_i)
  end

  def value2=(value2)
    if value2.nil? || value2 == ""
      value2 = "0"
    end
    @value2 = value2
    @value2_solve_time = SolveTime.new(event_id, :best, value2.to_i)
  end

  def value3=(value3)
    if value3.nil? || value3 == ""
      value3 = "0"
    end
    @value3 = value3
    @value3_solve_time = SolveTime.new(event_id, :best, value3.to_i)
  end

  def value4=(value4)
    if value4.nil? || value4 == ""
      value4 = "0"
    end
    @value4 = value4
    @value4_solve_time = SolveTime.new(event_id, :best, value4.to_i)
  end

  def value5=(value5)
    if value5.nil? || value5 == ""
      value5 = "0"
    end
    @value5 = value5
    @value5_solve_time = SolveTime.new(event_id, :best, value5.to_i)
  end

  validates :competition_id, presence: true
  validates :event_id, presence: true
  validates :round_id, presence: true
  validates :value1, presence: true
  
  validate :require_valid_competitor_id_if_returning_competitor
  def require_valid_competitor_id_if_returning_competitor
    if is_new_competitor.to_i == 0 
      if competitor_id.nil? || competitor_id == ""
        errors.add(:competitor_id, "can't be blank")
      elsif !Person.find_by_wca_id(competitor_id)
        errors.add(:competitor_id, "Not found")
      end
    end
  end
  
  validate :require_valid_name_if_new_competitor
  def require_valid_name_if_new_competitor
    if is_new_competitor.to_i == 1 && (name.nil? || name == "")
      errors.add(:name, "can't be blank")
    end
  end
  
  validate :require_valid_country_id_if_new_competitor
  def require_valid_country_id_if_new_competitor
    if is_new_competitor.to_i == 1
      if country_id.nil? || country_id == ""
        errors.add(:country_id, "can't be blank")
      elsif !Country.c_find(country_id)
        errors.add(:country_id, "Not found")
      end
    end
  end
  
  validate :require_valid_gender_if_new_competitor
  def require_valid_gender_if_new_competitor
    if is_new_competitor.to_i == 1
      if gender.nil? || gender == ""
        errors.add(:gender, "can't be blank")
      elsif !['m', 'f', 'o'].include?(gender)
        errors.add(:gender, "Not found")
      end
    end
  end
  
  validate :require_valid_dob_if_new_competitor
  def require_valid_dob_if_new_competitor
    if is_new_competitor.to_i == 1
      # Note: DOB can be blank
      if @dob.nil? && !dob.blank?
        @dob = dob.strftime("%F")
      end
      if @dob.blank?
        @year = @month = @day = 0
      else
        unless @dob =~ /\A\d{4}-\d{2}-\d{2}\z/
          # NOTE: error message built-in rails
          errors.add(:dob, "Invalid. Must be YYYY-MM-DD")
          return
        end
        @year, @month, @day = @dob.split("-").map(&:to_i)
        unless Date.valid_date? @year, @month, @day
          errors.add(:dob, "Invalid. Must be YYYY-MM-DD")
          return
        end
        if Date.new(@year, @month, @day) >= Date.today
          errors.add(:dob, "Must be in the past")
        end
      end
    end
  end
  
  validate :require_valid_semi_id_if_new_competitor
  def require_valid_semi_id_if_new_competitor
    if is_new_competitor.to_i == 1 
      if (semi_id.nil? || semi_id == "")
        errors.add(:semi_id, "can't be blank")
      elsif !semi_id.match?(/[\d]{4}[A-Z]{4}/)
        errors.add(:semi_id, "Invalid. Must be YYYYLAST")
      end
    end
  end
  
  validate :require_valid_competition_id
  def require_valid_competition_id
    return unless errors.blank?
    if !Competition.find_by_id(competition_id)
      errors.add(:competition_id, "Not found")
    end
  end
  
  validate :require_competition_to_have_results
  def require_competition_to_have_results
    return unless errors.blank?
    if !Competition.find_by_id(competition_id).results.any?
      errors.add(:competition_id, "Does not have results")
    end
  end
  
  validate :require_valid_event_id
  def require_valid_event_id
    return unless errors.blank?
    if !Competition.find_by_id(competition_id).competition_events.find_by_event_id(event_id)
      errors.add(:event_id, "Not found for competition")
    end
  end
  
  validate :require_valid_round_id
  def require_valid_round_id
    return unless errors.blank?
    if !Competition.find_by_id(competition_id).rounds.find_by_id(round_id)
      errors.add(:round_id, "Not found for competition")
      return
    end

    # set round_type_id
    round = Round.find_by_id(round_id)
    if round.cutoff.nil?
      case round.number
      when round.total_number_of_rounds
        @round_type_id = "f"
      when 1
        @round_type_id = "1"
      when 2
        @round_type_id = "2"
      when 3
        @round_type_id = "3"
      end
    else
      case round.number
      when round.total_number_of_rounds
        @round_type_id = "c"
      when 1
        @round_type_id = "d"
      when 2
        @round_type_id = "e"
      when 3
        @round_type_id = "g"
      end
    end
    # set format_id
    @format_id = round.format_id
  end
  
  validate :require_competitor_to_have_not_competed_in_round
  def require_competitor_to_have_not_competed_in_round
    return unless errors.blank?
    if is_new_competitor.to_i == 0 && Competition.find_by_id(competition_id).results.where(personId: competitor_id, eventId: event_id, roundTypeId: @round_type_id).any?
      errors.add(:round_id, "Competitor currently has results for this round. To fix them use the Fix Results script")
    end
  end

  validate :require_valid_value1
  def require_valid_value1
    if !value1.nil? && !@value1_solve_time.valid?
      errors.add(:value1, "Not Valid")
    end
  end

  validate :require_valid_value2
  def require_valid_value2
    if !value2.nil? && !@value2_solve_time.valid?
      errors.add(:value2, "Not Valid")
    end
  end

  validate :require_valid_value3
  def require_valid_value3
    if !value3.nil? && !@value3_solve_time.valid?
      errors.add(:value3, "Not Valid")
    end
  end

  validate :require_valid_value4
  def require_valid_value4
    if !value4.nil? && !@value4_solve_time.valid?
      errors.add(:value4, "Not Valid")
    end
  end

  validate :require_valid_value5
  def require_valid_value5
    if !value5.nil? && !@value5_solve_time.valid?
      errors.add(:value5, "Not Valid")
    end
  end

  def do_add_new_result
    if !valid?
      return { error: "invalid forum" }
    end

    ActiveRecord::Base.transaction do
      new_person_res = create_new_person
      if !new_person_res.nil? && new_person_res[:error]
        return new_person_res
      end

      new_result_res = create_new_result
      if !new_result_res.nil? && new_result_res[:error]
        return new_result_res
      end

      fix_positions
    end
    
    { wca_id: @use_wca_id }
  end

  private def generate_new_wca_id
    # generate new wcaid
    similarWcaIds = Person.where("wca_id LIKE ?", semi_id + '%')
    (1..99).each do |i|
      if !similarWcaIds.where(wca_id: semi_id + i.to_s.rjust(2, "0")).any?
        @new_wca_id = semi_id + i.to_s.rjust(2, "0")
        return true
      end
    end

    # Semi Id doesn't work
    false
  end

  # create new competitor if needed and set wca_id, name, and country_id needed for the result row
  def create_new_person
    if is_new_competitor.to_i == 1
      if !generate_new_wca_id
        return { error: "Error with subId: SubIds " + semi_id + "00 to " + semi_id + "99 are already taken." }
      end
      @new_person = Person.create(:wca_id => @new_wca_id, :name => name, :countryId => country_id, :gender => gender, :year => @year, :month => @month, :day => @day)
      @use_wca_id = @new_wca_id
      @use_name = name
      @use_country_id = country_id
    else
      @use_wca_id = competitor_id
      person = Person.find_by_wca_id(competitor_id)
      @use_name = person.name
      @use_country_id = person.countryId
    end
    {}
  end

  # Create Result and handle error
  def create_new_result
    new_result = Result.new(:personId => @use_wca_id,
                            :personName => @use_name,
                            :countryId => @use_country_id,
                            :competitionId => competition_id,
                            :eventId => event_id,
                            :roundTypeId => @round_type_id,
                            :formatId => @format_id,
                            :value1 => value1,
                            :value2 => value2,
                            :value3 => value3,
                            :value4 => value4,
                            :value5 => value5)
    # compute best and average
    new_result.update(:best => new_result.compute_correct_best, :average => new_result.compute_correct_average)

    # handle validation error
    if !new_result.valid?
      if !@new_person.nil?
        @new_person.destroy
      end
      new_result.destroy
      return { error: "Error in creating result: " + new_result.errors.messages.to_s }
    end

    new_result.save
    {}
  end

  # Fix Positions of all results in round
  def fix_positions
    results_to_fix_position = Competition.find_by_id(competition_id)
      .results
      .where(eventId: event_id, roundTypeId: @round_type_id)
      .order(Arel.sql("if(formatId in ('a','m') and average>0, average, 2147483647), if(best>0, best, 2147483647)"))
    current_position = 0
    last_result = nil
    number_of_tied = 0
    results_to_fix_position.each do |result, index|
      # Unless we find two exact same results, we increase the expected position
      tied = false
      if last_result
        if ["a", "m"].include?(result.formatId)
          # If the ranking is based on average, look at both average and best.
          tied = result.average == last_result.average && result.best == last_result.best
        else
          # else we just compare the bests
          tied = result.best == last_result.best
        end
      end
      if tied
        number_of_tied += 1
      else
        current_position += 1
        current_position += number_of_tied
        number_of_tied = 0
      end
      last_result = result

      # Fix position
      if current_position != result.pos
        result.update(:pos => current_position)
      end
    end
  end
end
