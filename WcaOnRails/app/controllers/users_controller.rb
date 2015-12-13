class UsersController < ApplicationController
  before_action :authenticate_user!, except: [:search]

  def self.WCA_TEAMS
    [:software_admin_team, :results_team, :wdc_team, :wrc_team]
  end

  def index
    unless current_user && current_user.can_edit_users?
      flash[:danger] = "You cannot edit users"
      redirect_to root_url
    end
    @users_grid = initialize_grid(User, {
      order: 'name',
      order_direction: 'asc'
    })
  end

  private def user_to_edit
    User.find_by_id(params[:id] || current_user.id)
  end

  def edit
    @user = user_to_edit
    can_edit_user_only(@user)
  end

  def claim_wca_id
    @user = current_user
  end

  def do_claim_wca_id
    @user = current_user
    @user.claiming_wca_id = true
    if @user.update_attributes(user_claim_wca_id_params)
      flash[:success] = "Successfully claimed WCA ID #{@user.unconfirmed_wca_id}. Check your email, and wait for #{@user.delegate_to_handle_wca_id_claim.name} to approve it!"
      WcaIdClaimMailer.notify_delegate_of_wca_id_claim(@user).deliver_now
      redirect_to profile_claim_wca_id_path
    else
      render :claim_wca_id
    end
  end

  def select_nearby_delegate
    @user = current_user
    @user.assign_attributes(user_claim_wca_id_params)
    render partial: 'select_nearby_delegate'
  end

  def edit_avatar_thumbnail
    @user = user_to_edit
    can_edit_user_only(@user)
  end

  def edit_pending_avatar_thumbnail
    @user = user_to_edit
    @pending_avatar = true
    can_edit_user_only(@user)
    render :edit_avatar_thumbnail
  end

  def update
    @user = user_to_edit
    @user.current_user = current_user
    can_edit_user_only(@user)

    old_confirmation_sent_at = @user.confirmation_sent_at || 0
    dangerous_change = current_user == @user && (user_params.has_key?(:password) || user_params.has_key?(:password_confirmation) || user_params.has_key?(:email))
    if dangerous_change ? @user.update_with_password(user_params) : @user.update_attributes(user_params)
      if current_user == @user
        # Sign in the user by passing validation in case their password changed
        sign_in @user, bypass: true
      end
      if (@user.confirmation_sent_at || 0) > old_confirmation_sent_at
        flash[:success] = "Account updated, emailed #{@user.unconfirmed_email} to confirm your new email address."
      else
        flash[:success] = "Account updated"
      end
      redirect_to edit_user_url @user
    else
      # update_with_password clears password and password_confirmation, but we
      # re-set them here so the :confirm_password view can work with its hidden
      # inputs.
      @user.password = user_params[:password]
      @user.password_confirmation = user_params[:password_confirmation]
      if @user.errors.messages == { current_password: ["can't be blank"] }
        @user.errors.clear
        render :confirm_password
      elsif @user.errors.messages == { current_password: ["is invalid"] }
        render :confirm_password
      else
        if @user.errors.messages[:current_password]
          # Remove error about current_password for now, as there are other
          # errors in the form the user needs to deal with first.
          @user.errors.delete :current_password
        end
        flash.now[:danger] = "Error updating user"
        render :edit
      end
    end
  end

  private def can_edit_user_only(user)
    unless current_user && (current_user.can_edit_users? || current_user == user)
      flash[:danger] = "You cannot edit this user"
      redirect_to root_url
    end
  end

  private def user_params
    user_params = params.require(:user).permit(*current_user.editable_fields_of_user(user_to_edit))
    if user_params.has_key?(:delegate_status) && !User.delegate_status_allows_senior_delegate(user_params[:delegate_status])
      user_params["senior_delegate_id"] = nil
    end
    if user_params.has_key?(:wca_id)
      user_params[:wca_id] = user_params[:wca_id].upcase
    end
    user_params
  end

  private def user_claim_wca_id_params
    params.require(:user).permit(:unconfirmed_wca_id, :delegate_id_to_handle_wca_id_claim)
  end
end
