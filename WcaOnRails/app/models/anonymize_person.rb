# frozen_string_literal: true

class AnonymizePerson
  include ActiveModel::Model

  attr_writer :current_step
  attr_reader :person_wca_id, :new_wca_id, :person, :account

  def person_wca_id=(wca_id)
    @person_wca_id = wca_id
    @person = Person.find_by_wca_id(person_wca_id)
    @account = User.find_by_wca_id(person_wca_id)
  end

  validates :person_wca_id, presence: true

  def current_step
    @current_step || steps.first
  end

  def steps
    %w[enter_wca_id request_data_removal]
  end

  def next_step
    self.current_step = steps[steps.index(current_step)+1]
  end

  def previous_step
    self.current_step = steps[steps.index(current_step)-1]
  end

  def first_step?
    current_step == steps.first
  end

  def last_step?
    current_step == steps.last
  end

  def do_anonymize_person
    if !valid?
      return { error: "invalid forum" }
    end

    if !generate_new_wca_id
      return { error: "Error anonymizing: SubIds " + person_wca_id[0..3] + "ANON00 to " + person_wca_id[0..3] + "ANON99 are already taken." }
    end

    ActiveRecord::Base.transaction do
      # Anonymize data on Account
      if account
        # If the account associated with the WCA ID is a special account (delegate, organizer, team member) then we want to keep the link between the Person and the account
        account_to_update = User.where('id = ? OR unconfirmed_wca_id = ?', account.id, person_wca_id)
        if !account.is_special_account?
          account_to_update.update_all(wca_id: nil, country_iso2: "US")
        else
          account_to_update.update_all(wca_id: @new_wca_id, avatar: nil)
        end
        account_to_update.update_all(email: account.id.to_s + "@worldcubeassociation.org",
                                     name: "Anonymous",
                                     unconfirmed_wca_id: nil,
                                     delegate_id_to_handle_wca_id_claim: nil,
                                     dob: nil,
                                     gender: "o",
                                     current_sign_in_ip: nil,
                                     last_sign_in_ip: nil)
      end

      # Anonymize person's data in Results
      person.results.update_all(personId: @new_wca_id, personName: "Anonymous")

      # Anonymize person's data in Persons
      if person.sub_ids.length > 1
        # if an updated person is due to a name change, this will delete the previous person.
        # if an updated person is due to a country change, this will keep the sub person with an appropriate subId
        previous_persons = Person.where(wca_id: person_wca_id).where.not(subId: 1).order(:subId)
        current_sub_id = 1
        current_country_id = person.countryId
        previous_persons.each do |p|
          if p.countryId != current_country_id
            current_sub_id += 1
            p.update(wca_id: @new_wca_id, name: "Anonymous", gender: "o", year: 0, month: 0, day: 0, subId: current_sub_id)
          else
            p.delete
          end
        end
      end
      # Anonymize person's data in Persons for subid 1
      person.update(wca_id: @new_wca_id, name: "Anonymous", gender: "o", year: 0, month: 0, day: 0)
    end

    {}
  end

  def generate_new_wca_id
    # generate new wcaid
    semiId = person_wca_id[0..3] + "ANON"
    similarWcaIds = Person.where("wca_id LIKE ?", semiId + '%')
    (1..99).each do |i|
      if !similarWcaIds.where(wca_id: semiId + i.to_s.rjust(2, "0")).any?
        @new_wca_id = semiId + i.to_s.rjust(2, "0")
        return true
      end
    end

    # Semi Id doesn't work
    false
  end
end
