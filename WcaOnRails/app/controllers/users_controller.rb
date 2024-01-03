# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :authenticate_user!, except: [:select_nearby_delegate, :acknowledge_cookies]
  before_action :check_recent_authentication!, only: [:enable_2fa, :disable_2fa, :regenerate_2fa_backup_codes]
  before_action :set_recent_authentication!, only: [:edit, :update, :enable_2fa, :disable_2fa]

  RECENT_AUTHENTICATION_DURATION = 10.minutes.freeze

  def self.WCA_TEAMS
    %w(wst wrt wdc wrc wct)
  end

  def index
    params[:order] = params[:order] == "asc" ? "asc" : "desc"

    unless current_user&.can_view_all_users?
      flash[:danger] = "You cannot view users"
      redirect_to root_url
    end

    respond_to do |format|
      format.html {}
      format.json do
        @users = User.in_region(params[:region])
        params[:search]&.split&.each do |part|
          like_query = %w(users.name wca_id email).map do |column|
            column + " LIKE :part"
          end.join(" OR ")
          @users = @users.where(like_query, part: "%#{part}%")
        end
        params[:sort] = params[:sort] == "country" ? :country_iso2 : params[:sort]
        if params[:sort]
          @users = @users.order(params[:sort] => params[:order])
        end
        render json: {
          total: @users.size,
          rows: @users.limit(params[:limit]).offset(params[:offset]).map do |user|
            {
              wca_id: user.wca_id ? view_context.link_to(user.wca_id, person_path(user.wca_id)) : "",
              name: ERB::Util.html_escape(user.name),
              # Users don't have to provide a country upon registration
              country: user.country&.id,
              email: ERB::Util.html_escape(user.email),
              edit: view_context.link_to("Edit", edit_user_path(user)),
            }
          end,
        }
      end
    end
  end

  private def user_to_edit
    User.find_by_id(params[:id] || current_user.id)
  end

  def enable_2fa
    # NOTE: current_user is not nil as authenticate_user! is called first
    params[:section] = "2fa"
    was_enabled = current_user.otp_required_for_login
    current_user.otp_required_for_login = true
    current_user.otp_secret = User.generate_otp_secret
    current_user.save!
    if was_enabled
      flash[:success] = I18n.t("devise.sessions.new.2fa.regenerated_secret")
    else
      flash[:success] = I18n.t("devise.sessions.new.2fa.enabled_success")
    end
    @user = current_user
    render :edit
  end

  def disable_2fa
    # NOTE: current_user is not nil as authenticate_user! is called first
    disable_params = {
      otp_required_for_login: false,
      otp_secret: nil,
    }
    if current_user.update(disable_params)
      flash[:success] = I18n.t("devise.sessions.new.2fa.disabled_success")
      params[:section] = "2fa"
    else
      # Hopefully at some point we'll make it mandatory for admin-like
      # accounts to have 2FA (like on github).
      # NOTE: we reload the user to revert the assignment of disable_params above.
      current_user.reload
      flash[:danger] = I18n.t("devise.sessions.new.2fa.disabled_failed")
      params[:section] = "general"
    end
    @user = current_user
    render :edit
  end

  def regenerate_2fa_backup_codes
    unless current_user.otp_required_for_login
      return render json: { error: { message: I18n.t("devise.sessions.new.2fa.errors.not_enabled") } }
    end
    codes = current_user.generate_otp_backup_codes!
    current_user.save!
    render json: { codes: codes }
  end

  def authenticate_user_for_sensitive_edit
    action_params = params.require(:user).permit(:otp_attempt, :password)
    # This methods store the current time in the "last_authenticated_at" session
    # variable, if password matches, or if 2FA check matches.
    on_success = -> do
      flash[:success] = I18n.t("users.edit.sensitive.success")
      session[:last_authenticated_at] = Time.now
    end
    on_failure = -> do
      flash[:danger] = I18n.t("users.edit.sensitive.failure")
    end
    if current_user.two_factor_enabled?
      if current_user.validate_and_consume_otp!(action_params[:otp_attempt]) ||
         current_user.invalidate_otp_backup_code!(action_params[:otp_attempt])
        on_success.call
      else
        on_failure.call
      end
    elsif current_user.valid_password?(action_params[:password])
      on_success.call
    else
      on_failure.call
    end
    redirect_to edit_user_path(current_user)
  end

  def edit
    params[:section] ||= "general"

    @user = user_to_edit
    nil if redirect_if_cannot_edit_user(@user)
    @current_user = current_user
  end

  def role
    @user_id = params[:user_id]
    @role_id = params[:role_id]
  end

  def claim_wca_id
    @user = current_user
  end

  def select_nearby_delegate
    @user = current_user || User.new
    user_params = params.require(:user).permit(:unconfirmed_wca_id, :delegate_id_to_handle_wca_id_claim, :dob_verification)
    @user.assign_attributes(user_params)
    render partial: 'select_nearby_delegate'
  end

  def edit_avatar_thumbnail
    @user = user_to_edit
    redirect_to_root_unless_user(:can_change_users_avatar?, @user)
  end

  def edit_pending_avatar_thumbnail
    @user = user_to_edit
    @pending_avatar = true
    redirect_to_root_unless_user(:can_change_users_avatar?, @user) && return

    render :edit_avatar_thumbnail
  end

  def update
    @user = user_to_edit
    @user.current_user = current_user
    return if redirect_if_cannot_edit_user(@user)

    dangerous_change = current_user == @user && [:password, :password_confirmation, :email].any? { |attribute| user_params.key? attribute }
    if dangerous_change
      return unless check_recent_authentication!
    end

    old_confirmation_sent_at = @user.confirmation_sent_at
    if @user.update(user_params)
      if current_user == @user
        # Sign in the user, bypassing validation in case their password changed
        bypass_sign_in @user
      end
      flash[:success] = if @user.confirmation_sent_at == old_confirmation_sent_at
                          I18n.t('users.successes.messages.account_updated')
                        else
                          I18n.t('users.successes.messages.account_updated_confirm', email: @user.unconfirmed_email)
                        end
      if @user.claiming_wca_id
        flash[:success] = I18n.t('users.successes.messages.wca_id_claimed',
                                 wca_id: @user.unconfirmed_wca_id,
                                 user: @user.delegate_to_handle_wca_id_claim.name)
        WcaIdClaimMailer.notify_delegate_of_wca_id_claim(@user).deliver_later
        redirect_to profile_claim_wca_id_path
      else
        redirect_to edit_user_url(@user, params.permit(:section))
      end
      # Send notification email to user about avatar removal
      if ActiveRecord::Type::Boolean.new.cast(user_params['remove_avatar'])
        AvatarsMailer.notify_user_of_avatar_removal(@user.current_user, @user, params[:user][:removal_reason]).deliver_later
      end
      # Clear preferred Events cache
      Rails.cache.delete("#{current_user.id}-preferred-events") if user_params.key? "user_preferred_events_attributes"
    elsif @user.claiming_wca_id
      render :claim_wca_id
    else
      render :edit
    end
  end

  def sso_discourse
    # This implements https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
    # (section "implementing SSO on your site")
    # Note that we do validate emails (as in: users can't log in until they have
    # validated their emails).

    # Use the 'SingleSignOn' lib provided by Discourse. Our secret and URL is
    # already configured there.
    sso = SingleSignOn.parse(request.query_string)

    # These are all the automated groups in Discourse (all teams, councils, and
    # Delegates statuses).
    all_groups = User.all_discourse_groups

    # Get the teams/councils/Delegate status for user
    user_groups = current_user.current_teams.select(&:official_or_council?).map(&:friendly_id)
    user_groups << current_user.delegate_status if current_user.any_kind_of_delegate?
    # Board is (expectedly) not included in "current_teams", so we have to add
    # it manually.
    user_groups << Team.board.friendly_id if current_user.board_member?

    sso.external_id = current_user.id
    sso.name = current_user.name
    sso.email = current_user.email
    sso.avatar_url = current_user.avatar_url
    sso.moderator = current_user.wac_team?
    sso.locale = current_user.locale
    sso.locale_force_update = true
    sso.add_groups = user_groups.join(",")
    sso.remove_groups = (all_groups - user_groups).join(",")
    sso.custom_fields["wca_id"] = current_user.wca_id || ""

    redirect_to sso.to_url, allow_other_host: true
  end

  def wac_survey
    survey_base_url = if current_user.staff? || current_user.trainee_delegate?
                        # Trainee Delegates should be treated as Staff for the purpose of this survey.
                        'https://www.surveymonkey.com/r/69DG5GW'
                      elsif current_user.person.present?
                        # If they are not staff but have a WCA ID
                        'https://www.surveymonkey.com/r/V2N5Q7Q'
                      else
                        # If they are not staff nor have a WCA ID linked to their account
                        'https://www.surveymonkey.com/r/6B8KHZK'
                      end

    # WAC does not know the contents of SURVEY_SECRET, so they cannot (reasonably) brute-force any hashes.
    # But once the survey is over, they can give us a list of tokens and we can easily verify whether they are legit.
    token_payload = current_user.id.to_s
    wca_token = OpenSSL::HMAC.hexdigest("sha256", AppSecrets.SURVEY_SECRET, token_payload)

    survey_url = "#{survey_base_url}?wca_token=#{wca_token}"

    redirect_to survey_url, allow_other_host: true
  end

  def acknowledge_cookies
    return render status: 401, json: { ok: false } if current_user.nil?

    current_user.update!(cookies_acknowledged: true)
    render json: { ok: true }
  end

  private def redirect_if_cannot_edit_user(user)
    unless current_user&.can_edit_user?(user)
      flash[:danger] = "You cannot edit this user"
      redirect_to root_url
      return true
    end
    false
  end

  private def user_params
    params.require(:user).permit(current_user.editable_fields_of_user(user_to_edit).to_a).tap do |user_params|
      if user_params.key?(:delegate_status) && !User.delegate_status_requires_senior_delegate(user_params[:delegate_status])
        user_params["region_id"] = nil
      end
      if user_params.key?(:wca_id)
        user_params[:wca_id] = user_params[:wca_id].upcase
      end
    end
  end

  private def has_recent_authentication?
    session[:last_authenticated_at] && session[:last_authenticated_at] > RECENT_AUTHENTICATION_DURATION.ago
  end

  private def set_recent_authentication!
    @recently_authenticated = has_recent_authentication?
  end

  private def check_recent_authentication!
    unless has_recent_authentication?
      flash[:danger] = I18n.t("users.edit.sensitive.identity_error")
      redirect_to profile_edit_path(section: "2fa-check")
      return false
    end
    true
  end
end
