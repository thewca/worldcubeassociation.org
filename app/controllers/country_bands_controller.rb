# frozen_string_literal: true

class CountryBandsController < ApplicationController
  before_action :authenticate_user!, except: :index
  before_action -> { redirect_to_root_unless_user(:can_admin_finances?) }, except: :index

  def index
    @country_bands_by_number = CountryBand.all.group_by(&:number)
  end

  def edit
    @number = id_from_params
    unless CountryBand::BANDS.keys.include?(@number)
      flash[:danger] = "Unknown band number"
      return redirect_to country_bands_path
    end
    set_instance_variables
  end

  def update
    @number = id_from_params
    iso2s = params.require(:countries).require(:iso2s)
    has_anything_changed = false
    previously_in_band = CountryBand.where(number: @number).pluck(:iso2)
    begin
      ActiveRecord::Base.transaction do
        iso2s.split(",").each do |iso2|
          cb = CountryBand.find_or_initialize_by(iso2: iso2)
          cb.number = @number
          has_anything_changed ||= cb.changed?
          cb.save!
          previously_in_band.delete(iso2)
        end
        if previously_in_band.any?
          # Clean up removed countries
          CountryBand.where(iso2: previously_in_band).delete_all
          has_anything_changed = true
        end
        flash[:success] = if has_anything_changed
                            "Successfully updated band data."
                          else
                            "No change to band data."
                          end
      end
    rescue ActiveRecord::RecordInvalid => e
      flash[:danger] = "Couldn't save all countries, here is the error: #{e.message}."
    end
    set_instance_variables
    render :edit
  end

  private

    def id_from_params
      Integer(params.require(:id))
    rescue ArgumentError
      nil
    end

    def set_instance_variables
      @in_band = CountryBand.where(number: @number).map(&:country).sort_by(&:name).map(&:iso2)
      # The list of unused countries should contain both unused countries and countries for the selected band.
      # Therefore we can get the list of relevant countries by substracting all the
      # other bands countries to the overall list of countries.
      used_countries = CountryBand.where.not(number: @number).map(&:country)
      @unused = (Country.real - used_countries).map do |c|
        { name: c.name, iso2: c.iso2 }
      end
    end
end
