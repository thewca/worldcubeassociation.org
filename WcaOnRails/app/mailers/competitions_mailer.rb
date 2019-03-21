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
        to: Team.wcat.email,
        cc: competition.delegates.flat_map { |d| [d.email, d.senior_delegate&.email] }.compact.uniq,
        reply_to: confirmer.email,
        subject: "#{confirmer.name} just confirmed #{competition.name}",
      )
    end
  end

  def notify_organizers_of_confirmed_competition(confirmer, competition)
    @competition = competition
    @confirmer = confirmer
    if @competition.organizers.empty?
      nil
    else
      localized_mail I18n.locale,
                     -> { I18n.t('users.mailer.competition_submission_email.header', delegate_name: confirmer.name, competition: competition.name) },
                     to: competition.organizers.pluck(:email),
                     reply_to: competition.delegates.pluck(:email)
    end
  end

  def notify_organizers_of_announced_competition(competition, post)
    @competition = competition
    @post = post
    if @competition.organizers.empty?
      nil
    else
      localized_mail I18n.locale,
                     -> { I18n.t('users.mailer.competition_announcement_email.header', competition: competition.name) },
                     to: competition.organizers.pluck(:email),
                     reply_to: competition.delegates.pluck(:email)
    end
  end

  def notify_organizer_of_addition_to_competition(confirmer, competition, organizer)
    @competition = competition
    @confirmer = confirmer
    @organizer = organizer

    localized_mail I18n.locale,
                   -> { I18n.t('users.mailer.organizer_addition_email.header', competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_organizer_of_removal_from_competition(remover, competition, organizer)
    @competition = competition
    @remover = remover
    @organizer = organizer

    localized_mail I18n.locale,
                   -> { I18n.t('users.mailer.organizer_removal_email.header', competition: competition.name) },
                   to: organizer.email,
                   reply_to: competition.delegates.pluck(:email)
  end

  def notify_users_of_results_presence(user, competition)
    @competition = competition
    @user = user
    mail(
      to: user.email,
      subject: "The results of #{competition.name} are posted",
      reply_to: competition.delegates.pluck(:email),
    )
  end

  def notify_users_of_id_claim_possibility(user, competition)
    @competition = competition
    mail(
      to: user.email,
      reply_to: competition.delegates.pluck(:email),
      subject: "Please link your WCA ID with your account",
    )
  end

  def notify_of_delegate_report_submission(competition)
    I18n.with_locale :en do
      @competition = competition
      mail(
        to: "reports@worldcubeassociation.org",
        cc: competition.delegates.pluck(:email),
        reply_to: competition.delegates.pluck(:email),
        subject: "[wca-report] [#{competition.continent.name}] #{competition.name}",
      )
    end
  end

  def submit_results_nag(competition)
    @competition = competition
    mail(
      to: competition.delegates.pluck(:email),
      cc: ["results@worldcubeassociation.org", "quality@worldcubeassociation.org"] + delegates_to_senior_delegates_email(competition.delegates),
      reply_to: "results@worldcubeassociation.org",
      subject: "#{competition.name} Results",
    )
  end

  def submit_report_nag(competition)
    @competition = competition
    mail(
      to: competition.delegates.pluck(:email),
      cc: ["quality@worldcubeassociation.org"] + delegates_to_senior_delegates_email(competition.delegates),
      reply_to: delegates_to_senior_delegates_email(competition.delegates),
      subject: "#{competition.name} Delegate Report",
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
      to: "results@worldcubeassociation.org",
      cc: competition.delegates.pluck(:email),
      reply_to: competition.delegates.pluck(:email),
      subject: "Results for #{competition.name}",
    )
    # Cleanup the uploaded jsons now that we attached the relevant one when mailing the WRT.
    @competition.uploaded_jsons.delete_all
  end

  private def delegates_to_senior_delegates_email(delegates)
    delegates.map { |delegate| delegate.senior_delegate&.email }.uniq.compact
  end
end
