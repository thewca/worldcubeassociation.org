# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :authenticate_user!, except: %i[select_nearby_delegate acknowledge_cookies]
  before_action :check_recent_authentication, only: %i[enable_2fa disable_2fa regenerate_2fa_backup_codes]
  before_action :check_recent_auth_dangerous, only: %i[update], if: :dangerous_profile_change?
  before_action :set_recent_authentication!, only: %i[edit update enable_2fa disable_2fa]
  before_action :redirect_if_cannot_edit_user, only: %i[edit update]
  before_action -> { redirect_to_root_unless_user(:can_admin_results?) }, only: %i[admin_search merge]
  before_action -> { redirect_to_root_unless_user(:can_edit_any_user?) }, only: %i[assign_wca_id confirm_wca_id]
  before_action -> { check_edit_access }, only: %i[show_for_edit update_user_data]

  RECENT_AUTHENTICATION_DURATION = 10.minutes.freeze

  def index
    params[:order] = params[:order] == "asc" ? "asc" : "desc"

    unless current_user&.can_view_all_users?
      flash[:danger] = "You cannot view users"
      redirect_to root_url
    end

    respond_to do |format|
      format.html
      format.json do
        @users = User.in_region(params[:region])
        params[:search]&.split&.each do |part|
          like_query = %w[users.name wca_id email].map do |column|
            "#{column} LIKE :part"
          end.join(" OR ")
          @users = @users.where(like_query, part: "%#{part}%")
        end
        params[:sort] = params[:sort] == "country" ? :country_iso2 : params[:sort]
        @users = @users.order(params[:sort] => params[:order]) if params[:sort]
        render json: {
          total: @users.size,
          rows: @users.limit(params[:limit]).offset(params[:offset]).map do |user|
            {
              wca_id: user.wca_id,
              name: ERB::Util.html_escape(user.name),
              # Users don't have to provide a country upon registration
              country: user.country&.iso2,
              email: ERB::Util.html_escape(user.email),
              user_id: user.id,
            }
          end,
        }
      end
    end
  end

  private def check_edit_access
    @user = User.find(params.require(:id))
    cannot_edit_reason = current_user.cannot_edit_data_reason_html(@user)

    render status: :unauthorized, json: { error: cannot_edit_reason } if cannot_edit_reason.present?
  end

  def show_for_edit
    render status: :ok, json: @user.as_json(
      only: %w[id name gender country_iso2],
      private_attributes: %w[dob],
      methods: [],
      include: [],
    )
  end

  def update_user_data
    user_details = params.permit(:name, :gender, :dob, :country_iso2)

    @user.update!(user_details)

    render status: :ok, json: @user.as_json(
      private_attributes: %w[dob],
    )
  end

  def show_for_merge
    user = User.find(params.require(:id))

    render status: :ok, json: user.as_json(
      include: %w[roles],
      methods: %w[special_account_competitions],
      private_attributes: %w[email],
    )
  end

  def merge
    from_user = User.find(params.require(:fromUserId))
    to_user = User.find(params.require(:toUserId))

    return render status: :bad_request, json: { error: "Cannot merge user with itself" } if to_user.id == from_user.id

    if to_user.name != from_user.name ||
       to_user.country_iso2 != from_user.country_iso2 ||
       to_user.gender != from_user.gender ||
       to_user.dob != from_user.dob
      return render status: :bad_request, json: { error: "Cannot merge users with different details" }
    end

    if !current_user.results_team? && (to_user.special_account? || from_user.special_account?)
      return render status: :bad_request,
                    json: { error: 'One of the account is a special account, please contact WRT to merge them.' }
    end

    return render status: :bad_request, json: { error: "Cannot merge users with both having a WCA ID" } if to_user.wca_id.present? && from_user.wca_id.present?

    from_user.transfer_data_to(to_user)

    render status: :ok, json: { success: true }
  end

  def confirm_wca_id
    user = User.find(params.require(:userId))
    wca_id = params.require(:wcaId)
    person = Person.find_by(wca_id: wca_id)

    return redirect_to edit_user_path(user), flash: { danger: "WCA ID #{wca_id} does not exist." } if person.nil?
    return redirect_to edit_user_path(user), flash: { danger: "User already has a WCA ID: #{user.wca_id}." } if user.wca_id.present?
    return redirect_to edit_user_path(user), flash: { danger: "WCA ID #{wca_id} is already assigned to another user." } if person.user.present?

    ActiveRecord::Base.transaction do
      user.assign_wca_id(wca_id)
      user.update!(unconfirmed_wca_id: nil, delegate_id_to_handle_wca_id_claim: nil)
    end

    redirect_to edit_user_path(user), flash: { success: "Successfully confirmed WCA ID #{wca_id}." }
  end

  def assign_wca_id
    user = User.find(params.require(:userId))
    wca_id = params.require(:wcaId)
    person = Person.find_by(wca_id: wca_id)

    return render status: :not_found, json: { error: "WCA ID #{wca_id} does not exist" } if person.nil?
    return render status: :bad_request, json: { error: "User already has a WCA ID: #{user.wca_id}" } if user.wca_id.present?
    return render status: :bad_request, json: { error: "WCA ID #{wca_id} is already assigned to user #{person.user.id}" } if person.user.present?

    user.assign_wca_id(wca_id)

    render status: :ok, json: { success: true }
  end

  private def user_to_edit
    User.find_by(id: params[:id] || current_user.id)
  end

  def enable_2fa
    # NOTE: current_user is not nil as authenticate_user! is called first
    params[:section] = "2fa"
    was_enabled = current_user.otp_required_for_login
    current_user.otp_required_for_login = true
    current_user.otp_secret = User.generate_otp_secret
    current_user.save!
    flash[:success] = if was_enabled
                        I18n.t("devise.sessions.new.2fa.regenerated_secret")
                      else
                        I18n.t("devise.sessions.new.2fa.enabled_success")
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
    return render json: { error: { message: I18n.t("devise.sessions.new.2fa.errors.not_enabled") } } unless current_user.otp_required_for_login

    codes = current_user.generate_otp_backup_codes!
    current_user.save!
    render json: { codes: codes }
  end

  def authenticate_user_for_sensitive_edit
    action_params = params.expect(user: %i[otp_attempt password])
    # This methods store the current time in the "last_authenticated_at" session
    # variable, if password matches, or if 2FA check matches.
    on_success = lambda do
      flash[:success] = I18n.t("users.edit.sensitive.success")
      session[:last_authenticated_at] = Time.now
    end
    on_failure = lambda do
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
    user_params = params.expect(user: %i[unconfirmed_wca_id delegate_id_to_handle_wca_id_claim dob_verification])
    @user.assign_attributes(user_params)
    render partial: 'select_nearby_delegate'
  end

  def avatar_data
    user = user_to_edit

    avatar_data = {
      avatar: user.avatar,
      pendingAvatar: user.pending_avatar,
    }

    render json: avatar_data
  end

  def upload_avatar
    upload_file = params.require(:file)

    thumbnail_json = params.require(:thumbnail)
    thumbnail = JSON.parse(thumbnail_json).symbolize_keys

    user_avatar = UserAvatar.build(
      user: user_to_edit,
      thumbnail_crop_x: thumbnail[:x],
      thumbnail_crop_y: thumbnail[:y],
      thumbnail_crop_w: thumbnail[:width],
      thumbnail_crop_h: thumbnail[:height],
      private_image: upload_file,
    )

    if user_avatar.save
      render json: { ok: true }
    else
      render status: :unprocessable_content, json: user_avatar.errors
    end
  end

  def update_avatar
    avatar_id = params.require(:avatarId)

    user_avatar = user_to_edit.user_avatars.find(avatar_id)
    return head :not_found if user_avatar.blank?

    thumbnail = params.require(:thumbnail)

    user_avatar.update!(
      thumbnail_crop_x: thumbnail[:x],
      thumbnail_crop_y: thumbnail[:y],
      thumbnail_crop_w: thumbnail[:width],
      thumbnail_crop_h: thumbnail[:height],
    )

    render json: { ok: true }
  end

  def delete_avatar
    avatar_id = params.require(:avatarId)

    user_avatar = user_to_edit.user_avatars.find(avatar_id)
    return head :not_found if user_avatar.blank?

    reason = params.require(:reason)

    user_avatar.update!(
      status: UserAvatar.statuses[:deleted],
      revoked_by_user: current_user,
      revocation_reason: reason,
    )

    render json: { ok: true }
  end

  def update
    @user.current_user = current_user

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
      AvatarsMailer.notify_user_of_avatar_removal(@user.current_user, @user, params[:user][:removal_reason]).deliver_later if ActiveRecord::Type::Boolean.new.cast(user_params['remove_avatar'])
      # Clear preferred Events cache
      Rails.cache.delete("#{current_user.id}-preferred-events") if user_params.key? "user_preferred_events_attributes"
    elsif @user.claiming_wca_id
      render :claim_wca_id
    else
      render :edit
    end
  end

  private def sso_moderator?(user)
    user.communication_team? || user.results_team?
  end

  def sso_discourse
    # This implements https://meta.discourse.org/t/official-single-sign-on-for-discourse-sso/13045
    # (section "implementing SSO on your site")
    # Note that we do validate emails (as in: users can't log in until they have
    # validated their emails).

    if current_user.forum_banned?
      flash[:alert] = I18n.t('registrations.errors.banned_html').html_safe
      return redirect_to new_user_session_path
    elsif current_user.dob.nil?
      flash[:alert] = I18n.t('misc.forum_enter_dob').html_safe
      return redirect_to edit_user_path(current_user)
    elsif current_user.below_forum_age_requirement?
      flash[:alert] = I18n.t('misc.forum_age_requirement').html_safe
      return redirect_to new_user_session_path
    end

    # Use the 'SingleSignOn' lib provided by Discourse. Our secret and URL is
    # already configured there.
    sso = SingleSignOn.parse(request.query_string)

    # These are all the automated groups in Discourse (all teams, councils, and
    # Delegates statuses).
    all_groups = User.all_discourse_groups

    # Get the teams/councils/Delegate status for user
    user_groups = current_user.active_roles.map(&:discourse_user_group).uniq.compact.sort

    sso.external_id = current_user.id
    sso.name = current_user.name
    sso.email = current_user.email
    sso.avatar_url = current_user.avatar_url
    sso.moderator = sso_moderator?(current_user)
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
    return render status: :unauthorized, json: { ok: false } if current_user.nil?

    current_user.update!(cookies_acknowledged: true)
    render json: { ok: true }
  end

  def registrations
    user_id = params.require(:userId)

    user = User.find(user_id)
    registrations = user.registrations
                        .joins(:competition)
                        .merge(Competition.not_over)
                        .order(start_date: :asc)

    render json: registrations.as_json(
      only: %w[competing_status],
      include: {
        competition: {
          only: %w[id name city_name country_id start_date],
          include: [],
        },
      },
    )
  end

  def organized_competitions
    user_id = params.require(:userId)

    user = User.find(user_id)
    competitions = user.organized_competitions
                       .over.visible.not_cancelled
                       .order(start_date: :desc)

    render json: competitions.as_json(
      only: %w[id name city_name country_id start_date],
    )
  end

  def delegated_competitions
    user_id = params.require(:userId)

    user = User.find(user_id)
    competitions = user.delegated_competitions
                       .over.visible.not_cancelled
                       .order(start_date: :desc)

    render json: competitions.as_json(
      only: %w[id name city_name country_id start_date],
    )
  end

  def past_competitions
    user_id = params.require(:userId)

    user = User.find(user_id)

    return Competition.none unless user.person

    competitions = user.person.competitions
                       .over.visible.not_cancelled
                       .where(start_date: ..Date.current)
                       .order(start_date: :desc)

    render json: competitions.as_json(
      only: %w[id name city_name country_id start_date],
    )
  end

  private def redirect_if_cannot_edit_user
    @user = user_to_edit

    return if current_user&.can_edit_user?(@user)

    flash[:danger] = "You cannot edit this user"
    redirect_to root_url
  end

  private def dangerous_profile_change?
    current_user == user_to_edit && %i[password password_confirmation email].any? { |attribute| user_params.key? attribute }
  end

  private def user_params
    params.expect(user: current_user.editable_fields_of_user(user_to_edit).to_a).tap do |user_params|
      user_params[:wca_id] = user_params[:wca_id].upcase if user_params.key?(:wca_id)
      if user_params.key?(:delegate_reports_region)
        raw_region = user_params.delete(:delegate_reports_region)

        user_params[:delegate_reports_region_type] = if raw_region.blank?
                                                       # Explicitly reset the region type column when "worldwide" (represented by a blank value) was selected
                                                       nil
                                                     elsif raw_region.starts_with?('_')
                                                       'Continent'
                                                     else
                                                       'Country'
                                                     end

        user_params[:delegate_reports_region_id] = raw_region.presence
      end
    end
  end

  private def recently_authenticated?
    session[:last_authenticated_at] && session[:last_authenticated_at] > RECENT_AUTHENTICATION_DURATION.ago
  end

  private def set_recent_authentication!
    @recently_authenticated = recently_authenticated?
  end

  private def check_recent_authentication
    return if recently_authenticated?

    flash[:danger] = I18n.t("users.edit.sensitive.identity_error")
    redirect_to profile_edit_path(section: "2fa-check")
  end

  # We need this separate method because you cannot define `before_filter` chains
  #   with the same name on different endpoints :(
  # See https://guides.rubyonrails.org/action_controller_overview.html#before-action
  private def check_recent_auth_dangerous
    check_recent_authentication if dangerous_profile_change?
  end

  def admin_search
    query = params[:q]&.slice(0...SearchResultsController::SEARCH_QUERY_LIMIT)

    return render status: :bad_request, json: { error: "No query specified" } unless query

    render status: :ok, json: {
      result: User.search(query, params: params).limit(SearchResultsController::SEARCH_RESULT_LIMIT),
    }
  end
end
