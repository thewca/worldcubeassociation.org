# frozen_string_literal: true

class MergePeople
  include ActiveModel::Model

  attr_reader :person1_wca_id, :person2_wca_id
  attr_reader :person1, :person2

  def person1_wca_id=(wca_id)
    @person1_wca_id = wca_id
    @person1 = Person.find_by_wca_id(person1_wca_id)
  end

  def person2_wca_id=(wca_id)
    @person2_wca_id = wca_id
    @person2 = Person.find_by_wca_id(person2_wca_id)
  end

  validates :person1_wca_id, presence: true
  validates :person2_wca_id, presence: true

  validate :require_different_people
  def require_different_people
    if person1_wca_id == person2_wca_id
      errors.add(:person2_wca_id, "Cannot merge a person with themself!")
    end
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
    if person1 && person2
      if person1.name != person2.name
        errors.add(:person2_wca_id, "Names don't match")
      end
      if person1.country_id != person2.country_id
        errors.add(:person2_wca_id, "Countries don't match")
      end
      if person1.gender != person2.gender
        errors.add(:person2_wca_id, "Genders don't match")
      end
      if person1.dob != person2.dob
        errors.add(:person2_wca_id, "Birthdays don't match")
      end
    end
  end

  validate :person2_must_not_have_associated_user
  def person2_must_not_have_associated_user
    if @person2&.user
      errors.add(:person2_wca_id, "Must not have an account")
    end
  end

  def do_merge
    if !valid?
      return false
    end

    ActiveRecord::Base.transaction do
      Result.where(person_id: person2.wca_id).update_all(person_id: person1.wca_id)
      person2.destroy!
    end

    true
  end
end
