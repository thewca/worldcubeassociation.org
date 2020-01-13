# frozen_string_literal: true

class SessionsController < Devise::SessionsController
  prepend_before_action :authenticate_with_two_factor,
                        if: -> { action_name == 'create' && two_factor_enabled? }
  skip_before_action :require_no_authentication, only: [:new, :create]

  # Make sure this happens always before any before_action
  protect_from_forgery with: :exception, prepend: true

  def new
    super
    # Remove any lingering user data from previous login attempt
    session.delete(:otp_user_id)
  end

  def generate_email_otp
    unless session[:otp_user_id] || current_user
      return render json: { error: { message: I18n.t("devise.sessions.new.2fa.errors.cant_send_email") } }
    end
    user = User.find(session[:otp_user_id] || current_user.id)
    TwoFactorMailer.send_otp_to_user(user).deliver_now
    render json: { status: "ok" }
  end

  private

  def two_factor_enabled?
    find_user&.two_factor_enabled?
  end

  def authenticate_with_two_factor
    user = self.resource = find_user
    if user_params[:otp_attempt].present? && session[:otp_user_id]
      authenticate_via_otp(user)
    elsif user && user.valid_password?(user_params[:password])
      prompt_for_two_factor(user)
    end
  end

  def authenticate_via_otp(user)
    if user.validate_and_consume_otp!(user_params[:otp_attempt]) ||
       user.invalidate_otp_backup_code!(user_params[:otp_attempt])
      # Remove any lingering user data from login
      session.delete(:otp_user_id)
      user.remember_me = 1 if user_params[:remember_me] == '1'
      user.save!
      sign_in(user, event: :authentication)
    else
      flash[:danger] = I18n.t("devise.sessions.new.2fa.errors.invalid_otp")
      prompt_for_two_factor(user)
    end
  end

  # Store the user's ID in the session for later retrieval and render the
  # two factor code prompt
  #
  # The user must have 2FA enabled and have been authenticated with
  # a valid login and password before calling this method!
  def prompt_for_two_factor(user)
    # Set @user for Devise views
    @user = user

    session[:otp_user_id] = user.id
    render 'devise/sessions/2fa'
  end

  def user_params
    params.require(:user).permit(:login, :password, :otp_attempt, :remember_me)
  end

  def find_user
    if session[:otp_user_id]
      User.find(session[:otp_user_id])
    elsif user_params[:login]
      User.find_first_by_auth_conditions(login: user_params[:login])
    end
  end
end
