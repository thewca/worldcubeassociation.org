# frozen_string_literal: true

require "rails_helper"

RSpec.describe RegistrationsMailer, type: :mailer do
  let(:delegate1) { FactoryBot.create :delegate }
  let(:delegate2) { FactoryBot.create :trainee_delegate }
  let(:organizer1) { FactoryBot.create :user }
  let(:organizer2) { FactoryBot.create :user }
  let(:competition_without_organizers) { FactoryBot.create(:competition, :registration_open, delegates: [delegate1], trainee_delegates: [delegate2]) }
  let(:competition_with_organizers) { FactoryBot.create(:competition, :registration_open, delegates: [delegate1], trainee_delegates: [delegate2], organizers: [organizer1, organizer2]) }

  describe "notify registrants in their language" do
    let(:french_user) { FactoryBot.create :user, :wca_id, :french_locale }
    let(:registration) { FactoryBot.create(:registration, user: french_user, competition: competition_with_organizers) }
    let(:mail_new) { RegistrationsMailer.notify_registrant_of_new_registration(registration) }
    let(:mail_accepted) { RegistrationsMailer.notify_registrant_of_accepted_registration(registration) }
    let(:mail_pending) { RegistrationsMailer.notify_registrant_of_pending_registration(registration) }
    let(:mail_deleted) { RegistrationsMailer.notify_registrant_of_deleted_registration(registration) }

    it "renders the headers in foreign locale" do
      # We expect the locale rendering the mail to be different from the registrant's
      expect(I18n.locale).to eq(:en)
      # Note that we cannot use 'with_locale' for the expects here: the mail
      # rendering is triggered only when we call 'mail_xx.subject', so we must not
      # scope this call, but rather compare the result to the expected locale.
      expect(mail_new.subject).to eq(I18n.t('registrations.mailer.new.mail_subject', comp_name: registration.competition.name, locale: :fr))
      expect(mail_accepted.subject).to eq(I18n.t('registrations.mailer.accepted.mail_subject', comp_name: registration.competition.name, locale: :fr))
      expect(mail_pending.subject).to eq(I18n.t('registrations.mailer.pending.mail_subject', comp_name: registration.competition.name, locale: :fr))
      expect(mail_deleted.subject).to eq(I18n.t('registrations.mailer.deleted.mail_subject', comp_name: registration.competition.name, locale: :fr))
    end

    it "renders the body in foreign locale" do
      # We expect the locale rendering the mail to be different from the registrant's
      expect(I18n.locale).to eq(:en)
      # We use 'with_locale' here because of 'users_to_sentence' which needs the locale to be
      # set to correctly translate names enumaration (eg: to not have a "John Doe and Paul Smith"
      # pop in a French sentence instead of "John Doe et Paul Smith").
      regards_in_french = I18n.with_locale :fr do
        I18n.t('registrations.mailer.regards_html', people: users_to_sentence(competition_with_organizers.organizers_or_delegates))
      end
      expect(mail_new.body.encoded).to match(regards_in_french)
      expect(mail_accepted.body.encoded).to match(regards_in_french)
      expect(mail_pending.body.encoded).to match(regards_in_french)
      expect(mail_deleted.body.encoded).to match(regards_in_french)
    end
  end

  describe "notify_organizers_of_new_registration" do
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }
    let(:mail) { RegistrationsMailer.notify_organizers_of_new_registration(registration) }

    it "renders the headers" do
      # Set receive_registration_emails to true and test that the email headers are present
      competition_delegate2 = competition_without_organizers.competition_trainee_delegates.find_by_trainee_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = true
      competition_delegate2.save!

      expect(mail.subject).to eq("#{registration.name} just registered for #{registration.competition.name}")
      expect(mail.to).to eq([delegate2.email])
      expect(mail.reply_to).to eq([registration.user.email])
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      # Set receive_registration_emails to true and test that the email body is present
      competition_delegate2 = competition_without_organizers.competition_trainee_delegates.find_by_trainee_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = true
      competition_delegate2.save!

      expect(mail.body.encoded).to match(edit_registration_url(registration))
    end

    it "handles no organizers receiving email" do
      # Expect no email to be sent by default (when the organizer hasn't chosen to receive registration emails)
      expect(mail.message).to be_kind_of ActionMailer::Base::NullMail
    end
  end

  describe "notify_organizers_of_deleted_registration" do
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }
    let(:mail) { RegistrationsMailer.notify_organizers_of_deleted_registration(registration) }

    it "renders the headers" do
      competition_delegate1 = competition_without_organizers.competition_delegates.find_by_delegate_id(delegate1.id)
      competition_delegate1.receive_registration_emails = true
      competition_delegate1.save!

      competition_delegate2 = competition_without_organizers.competition_trainee_delegates.find_by_trainee_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = true
      competition_delegate2.save!

      expect(mail.subject).to eq("#{registration.name} just deleted their registration for #{registration.competition.name}")
      expect(mail.to).to eq([delegate1.email, delegate2.email])
      expect(mail.reply_to).to eq(competition_without_organizers.managers.map(&:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      competition_delegate1 = competition_without_organizers.competition_delegates.find_by_delegate_id(delegate1.id)
      competition_delegate1.receive_registration_emails = true
      competition_delegate1.save!

      competition_delegate2 = competition_without_organizers.competition_trainee_delegates.find_by_trainee_delegate_id(delegate2.id)
      competition_delegate2.receive_registration_emails = true
      competition_delegate2.save!

      expect(mail.body.encoded).to match("just deleted their registration for #{registration.competition.name}")
    end
  end

  describe "notify_registrant_of_new_registration for competition without organizers" do
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }
    let!(:earlier_registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }
    let(:mail) { RegistrationsMailer.notify_registrant_of_new_registration(registration) }

    it "renders the headers" do
      expect(mail.subject).to eq("Your registration for #{registration.competition.name} is submitted and pending approval")
      expect(mail.to).to eq([registration.email])
      expect(mail.reply_to).to eq(competition_without_organizers.all_delegates.map(&:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(competition_register_url(registration.competition))
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_without_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_new_registration for competition with organizers" do
    let(:registration) { FactoryBot.create(:registration, competition: competition_with_organizers) }
    let(:mail) { RegistrationsMailer.notify_registrant_of_new_registration(registration) }

    it "sets organizers in the reply_to" do
      expect(mail.reply_to).to eq(competition_with_organizers.organizers.map(&:email))
    end

    it "displays organizer names in the signature" do
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_with_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_accepted_registration for competition without organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_accepted_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }

    it "renders the headers" do
      expect(mail.subject).to eq("Your registration for #{registration.competition.name} has been accepted")
      expect(mail.to).to eq([registration.email])
      expect(mail.reply_to).to eq(competition_without_organizers.all_delegates.map(&:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Your registration for .{1,200}#{registration.competition.name}.{1,200} has been accepted")
    end
  end

  describe "notify_registrant_of_accepted_registration for competition with organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_accepted_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_with_organizers) }

    it "sets organizers in the reply_to" do
      expect(mail.reply_to).to eq(competition_with_organizers.organizers.map(&:email))
    end

    it "displays organizer names in the signature" do
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_with_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_pending_registration for a competition without organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_pending_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }

    it "renders the headers" do
      expect(mail.subject).to eq("You have been moved to the waiting list for #{registration.competition.name}")
      expect(mail.to).to eq([registration.email])
      expect(mail.reply_to).to eq(competition_without_organizers.all_delegates.map(&:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Your registration for .{1,200}#{registration.competition.name}.{1,200} has been moved to the waiting list")
      expect(mail.body.encoded).to match("If you think this is an error, please reply to this email.")
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_without_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_pending_registration for a competition with organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_pending_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_with_organizers) }

    it "sets organizers in the reply_to" do
      expect(mail.reply_to).to eq(competition_with_organizers.organizers.map(&:email))
    end

    it "displays organizer names in the signature" do
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_with_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_deleted_registration for a competition without organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_deleted_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_without_organizers) }

    it "renders the headers" do
      expect(mail.subject).to eq("Your registration for #{registration.competition.name} has been deleted")
      expect(mail.to).to eq([registration.email])
      expect(mail.reply_to).to eq(competition_without_organizers.all_delegates.map(&:email))
      expect(mail.from).to eq(["notifications@worldcubeassociation.org"])
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Your registration for .{1,200}#{registration.competition.name}.{1,200} has been deleted")
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_without_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_deleted_registration for a competition with organizers" do
    let(:mail) { RegistrationsMailer.notify_registrant_of_deleted_registration(registration) }
    let(:registration) { FactoryBot.create(:registration, competition: competition_with_organizers) }

    it "renders the headers" do
      expect(mail.reply_to).to eq(competition_with_organizers.organizers.map(&:email))
    end

    it "renders the body" do
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_with_organizers.organizers_or_delegates)}.")
    end
  end

  describe "notify_registrant_of_locked_account_creation" do
    let(:registration) { FactoryBot.create(:registration, competition: competition_with_organizers) }
    let(:mail) { RegistrationsMailer.notify_registrant_of_locked_account_creation(registration.user, registration.competition) }

    it "renders the headers" do
      expect(mail.to).to eq [registration.user.email]
      expect(mail.reply_to).to eq(competition_with_organizers.organizers_or_delegates.map(&:email))
    end

    it "renders the body" do
      expect(mail.body.encoded).to match(registration.competition.name)
      expect(mail.body.encoded).to match(new_user_password_url)
      expect(mail.body.encoded).to match("Regards, #{users_to_sentence(competition_with_organizers.organizers_or_delegates)}.")
    end
  end
end
