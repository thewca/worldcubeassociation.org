# frozen_string_literal: true

require 'fileutils'

class CompetitionsMailer < ApplicationMailer
  include MailersHelper
  helper :markdown

  def notify_wcat_of_confirmed_competition(confirmer, competition)
    I18n.with_locale :en do
      @competition = competition
      @confirmer = confirmer
      mail(
        from: Team.wcat.email,
        to: Team.wcat.email,
        cc: competition.delegates.flat_map { |d| [d.email, d.senior_delegate&.email] }.compact.uniq,
        reply_to: confirmer.email,
        subject: "#{competition.name} is confirmed",
      )
    end
  end

  def notify_organizer_of_confirmed_competition(confirmer, competition, organizer)
    @competition = competition
    @confirmer = confirmer

    localized_mail organizer.preferred_locale || :en,
                   -> { I18n.t('users.mailer.competition_submission_email.header', delegate_name: confirmer.name, competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_organizer_of_announced_competition(competition, organizer)
    @competition = competition

    localized_mail organizer.preferred_locale || :en,
                   -> { I18n.t('users.mailer.competition_announcement_email.header', competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_organizer_of_addition_to_competition(confirmer, competition, organizer)
    @competition = competition
    @confirmer = confirmer
    @organizer = organizer

    localized_mail organizer.preferred_locale || :en,
                   -> { I18n.t('users.mailer.organizer_addition_email.header', competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_organizer_of_removal_from_competition(remover, competition, organizer)
    @competition = competition
    @remover = remover
    @organizer = organizer

    localized_mail organizer.preferred_locale || :en,
                   -> { I18n.t('users.mailer.organizer_removal_email.header', competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_users_of_results_presence(user, competition)
    @competition = competition
    @user = user

    localized_mail user.locale || :en,
                   -> { I18n.t('users.mailer.results_presence_email.header', competition: competition.name) },
                   to: user.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_users_of_id_claim_possibility(user, competition)
    @competition = competition

    localized_mail user.locale || :en,
                   -> { I18n.t('users.mailer.id_claim_possibility_email.header') },
                   to: user.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_of_delegate_report_submission(competition)
    I18n.with_locale :en do
      @competition = competition
      mail(
        from: "reports@worldcubeassociation.org",
        to: "reports@worldcubeassociation.org",
        cc: competition.delegates.pluck(:email) +
          (competition.delegate_report.wrc_feedback_requested ? ["regulations@worldcubeassociation.org"] : []) +
          (competition.delegate_report.wdc_feedback_requested ? ["disciplinary@worldcubeassociation.org"] : []),
        reply_to: competition.delegates.pluck(:email),
        subject: delegate_report_email_subject(competition),
      )
    end
  end

  def wrc_delegate_report_followup(competition)
    I18n.with_locale :en do
      @competition = competition
      mail(
        from: "reports@worldcubeassociation.org",
        to: "regulations@worldcubeassociation.org",
        reply_to: "regulations@worldcubeassociation.org",
        subject: delegate_report_email_subject(competition),
      )
    end
  end

  def submit_results_nag(competition)
    @competition = competition
    mail(
      from: Team.weat.email,
      to: competition.delegates.pluck(:email),
      cc: ["results@worldcubeassociation.org", "assistants@worldcubeassociation.org"] + delegates_to_senior_delegates_email(competition.delegates),
      reply_to: "results@worldcubeassociation.org",
      subject: "#{competition.name} Results",
    )
  end

  def submit_report_nag(competition)
    @competition = competition
    mail(
      from: Team.weat.email,
      to: competition.delegates.pluck(:email),
      cc: ["assistants@worldcubeassociation.org"] + delegates_to_senior_delegates_email(competition.delegates),
      reply_to: delegates_to_senior_delegates_email(competition.delegates),
      subject: "#{competition.name} Delegate Report",
    )
  end

  def submit_report_reminder(competition)
    @competition = competition
    mail(
      from: Team.weat.email,
      to: competition.delegates.pluck(:email),
      cc: ["assistants@worldcubeassociation.org"] + delegates_to_senior_delegates_email(competition.delegates),
      reply_to: delegates_to_senior_delegates_email(competition.delegates),
      subject: "Friendly reminder to submit #{competition.name} Delegate Report",
    )
  end

  def results_submitted(competition, results_submission, submitter_user)
    @competition = competition
    @results_submission = results_submission
    @submitter_user = submitter_user
    last_uploaded_json = @competition.uploaded_jsons.order(:id).last
    if last_uploaded_json
      attachments["Results for #{@competition.id}.json"] = {
        mime_type: "application/json",
        content: last_uploaded_json.json_str,
      }
    end
    mail(
      from: "results@worldcubeassociation.org",
      to: "results@worldcubeassociation.org",
      cc: competition.delegates.pluck(:email),
      reply_to: competition.delegates.pluck(:email),
      subject: "Results for #{competition.name}",
    )
    # Cleanup the uploaded jsons now that we attached the relevant one when mailing the WRT.
    @competition.uploaded_jsons.delete_all
  end

  def registration_reminder(competition, user, registered_but_not_accepted)
    @competition = competition
    @user = user
    @registered_but_not_accepted = registered_but_not_accepted
    localized_mail @user.locale,
                   -> { I18n.t('users.mailer.registration_reminder_email.header', competition: competition.name) },
                   to: user.email,
                   reply_to: competition.organizers.pluck(:email)
  end

  private def delegates_to_senior_delegates_email(delegates)
    delegates.map { |delegate| delegate.senior_delegate&.email }.uniq.compact
  end

  private def delegate_report_email_subject(competition)
    "[wca-report] [#{competition.continent.name}] #{competition.name}"
  end
end
