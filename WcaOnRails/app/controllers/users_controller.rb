# frozen_string_literal: true

class UsersController < ApplicationController
  before_action :authenticate_user!, except: [:select_nearby_delegate]

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

  def regenerate_2fa_backup_codes
    unless current_user.otp_required_for_login
      return render json: { error: { message: I18n.t("devise.sessions.new.2fa.errors.not_enabled") } }
    end
    codes = current_user.generate_otp_backup_codes!
    current_user.save!
    render json: { codes: codes }
  end

  def edit
    params[:section] ||= "general"

    @user = user_to_edit
    return if redirect_if_cannot_edit_user(@user)
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

    old_confirmation_sent_at = @user.confirmation_sent_at
    dangerous_change = current_user == @user && [:password, :password_confirmation, :email].any? { |attribute| user_params.key? attribute }
    if dangerous_change ? @user.update_with_password(user_params) : @user.update_attributes(user_params)
      if @user.saved_change_to_delegate_status
        # TODO: See https://github.com/thewca/worldcubeassociation.org/issues/2969.
        DelegateStatusChangeMailer.notify_board_and_assistants_of_delegate_status_change(@user, current_user).deliver_now
      end
      if current_user == @user
        # Sign in the user, bypassing validation in case their password changed
        bypass_sign_in @user
      end
      flash[:success] = if @user.confirmation_sent_at != old_confirmation_sent_at
                          I18n.t('users.successes.messages.account_updated_confirm', email: @user.unconfirmed_email)
                        else
                          I18n.t('users.successes.messages.account_updated')
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

    sso.external_id = current_user.id
    sso.name = current_user.name
    sso.email = current_user.email
    sso.avatar_url = current_user.avatar_url
    sso.moderator = current_user.wac_team?
    sso.add_groups = user_groups.join(",")
    sso.remove_groups = (all_groups - user_groups).join(",")
    # Build a nice response to discourse, so that the WCA profile is linked in
    # the user's profile.
    sso.bio = if current_user.wca_id
                "WCA profile: [#{current_user.wca_id}](#{person_url(current_user.wca_id)})."
              else
                "No WCA ID."
              end

    redirect_to sso.to_url
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
        user_params["senior_delegate_id"] = nil
      end
      if user_params.key?(:wca_id)
        user_params[:wca_id] = user_params[:wca_id].upcase
      end
    end
  end
end
