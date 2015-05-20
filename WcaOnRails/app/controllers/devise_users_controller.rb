class DeviseUsersController < ApplicationController
  # For now, only allow admins to view this, as we're showing email addresses here
  before_action :authenticate_devise_user!
  before_action :admin_only

  def index
    @users = DeviseUser.order(email: :asc).paginate(page: params[:page])
  end

  def edit
    @user = DeviseUser.find(params[:id])
  end

  def update
    @user = DeviseUser.find(params[:id])
    # Don't allow users to edit themselves.
    if @user == current_devise_user
      flash[:danger] = "Cannot edit yourself"
    else
      user_roles.each do |role, value|
        if value == "1"
          @user.add_role role
        else
          @user.remove_role role
        end
      end
      flash[:success] = "Roles updated"
    end
    redirect_to edit_devise_user_url @user
  end

  private def user_roles
    params.permit(*Role.all.map(&:name))
  end

  private def admin_only
    unless current_devise_user && current_devise_user.has_role?(:admin)
      flash[:danger] = "Admins only"
      redirect_to root_url
    end
  end
end
