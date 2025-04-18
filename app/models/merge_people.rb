# frozen_string_literal: true

class MergePeople
  include ActiveModel::Model

  attr_reader :person1_wca_id, :person2_wca_id, :person1, :person2

  def person1_wca_id=(wca_id)
    @person1_wca_id = wca_id
    @person1 = Person.find_by(wca_id: person1_wca_id)
  end

  def person2_wca_id=(wca_id)
    @person2_wca_id = wca_id
    @person2 = Person.find_by(wca_id: person2_wca_id)
  end

  validates :person1_wca_id, presence: true
  validates :person2_wca_id, presence: true

  validate :require_different_people
  def require_different_people
    errors.add(:person2_wca_id, "Cannot merge a person with themself!") if person1_wca_id == person2_wca_id
  end

  validate :require_valid_wca_ids
  def require_valid_wca_ids
    if !person1
      errors.add(:person1_wca_id, "Not found")
    elsif person1.sub_ids.length > 1
      errors.add(:person1_wca_id, "This person has multiple sub_ids")
    end
    if !person2
      errors.add(:person2_wca_id, "Not found")
    elsif person2.sub_ids.length > 1
      errors.add(:person2_wca_id, "This person has multiple sub_ids")
    end
  end

  validate :must_look_like_the_same_person
  def must_look_like_the_same_person
    return unless person1 && person2

    errors.add(:person2_wca_id, "Names don't match") if person1.name != person2.name
    errors.add(:person2_wca_id, "Countries don't match") if person1.country_id != person2.country_id
    errors.add(:person2_wca_id, "Genders don't match") if person1.gender != person2.gender
    errors.add(:person2_wca_id, "Birthdays don't match") if person1.dob != person2.dob
  end

  validate :person2_must_not_have_associated_user
  def person2_must_not_have_associated_user
    errors.add(:person2_wca_id, "Must not have an account") if @person2&.user
  end

  validate :person2_year_must_not_be_earlier
  def person2_year_must_not_be_earlier
    year1 = person1_wca_id[0, 4].to_i
    year2 = person2_wca_id[0, 4].to_i
    errors.add(:person2_wca_id, "WCA ID year cannot be earlier than person1's WCA ID year") if year2 < year1
  end

  def do_merge
    return false unless valid?

    ActiveRecord::Base.transaction do
      Result.where(person_id: person2.wca_id).update_all(person_id: person1.wca_id)
      person2.destroy!
    end

    true
  end
end
