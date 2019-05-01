# frozen_string_literal: true

class StaticPagesController < ApplicationController
  include DocumentsHelper

  def home
  end

  def delegates
    @senior_delegates = User.where(delegate_status: "senior_delegate")
    @delegates_without_senior_delegates = User.where(delegate_status: ["candidate_delegate", "delegate"], senior_delegate: nil)
  end

  ORGANIZATIONS_INFO = [
    {
      country: "Australia",
      name: "Speedcubing Australia",
      url: "https://speedcubing.org.au",
      logo: "Cube_FA_RGB_pos.png",
    },
    {
      country: "Belarus",
      name: "Speedcubing Federation",
      url: "http://www.scfed.by",
      logo: "sfb.png",
    },
    {
      country: "Canada",
      name: "Canadian Cubing",
      url: "http://www.canadiancubing.com",
      logo: "canada_cubing.jpg",
    },
    {
      country: "Croatia",
      name: "Speedcubing Hrvatska",
      url: "https://speedcubinghrvatska.hr",
      logo: "speedcubing-hrvatska.png",
    },
    {
      country: "Denmark",
      name: "Dansk Speedcubing Forening",
      url: "http://danishcubing.dk/",
      logo: "denmark.png",
    },
    {
      country: "Estonia",
      name: "Eesti Kuubik",
      url: "http://www.estonianopen.eu",
      logo: "estonian_open.png",
    },
    {
      country: "France",
      name: "Association Française de Speedcubing",
      url: "http://www.speedcubingfrance.org",
      logo: "afs.png",
    },
    {
      country: "Japan",
      name: "Japan Rubik's Cube Association",
      url: "http://jrca.cc",
      logo: "jrca.jpg",
    },
    {
      country: "Kazakhstan",
      name: "Kazakhstan Speedcubing Federation",
      url: "http://cubing.kz/",
      logo: "kazakhstan.png",
    },
    {
      country: "Korea",
      name: "Korea Cube Culture United",
      url: "https://www.kccu.kr/",
      logo: "korea.png",
    },
    {
      country: "Macedonia",
      name: "Macedonian Cubing Association",
      url: "https://speedcubing.mk/",
      logo: "mca.png",
    },
    {
      country: "Malaysia",
      name: "Malaysia Cube Association",
      url: "https://www.mycubeassociation.com",
      logo: "myca.svg",
    },
    {
      country: "Netherlands",
      name: "Speedcubing Nederland",
      url: "http://www.kubuswedstrijden.nl",
      logo: "nederland.png",
    },
    {
      country: "New Zealand",
      name: "Speedcubing New Zealand",
      url: "http://www.speedcubing.nz",
    },
    {
      country: "Norway",
      name: "Norges kubeforbund",
      url: "http://www.kubing.no",
      logo: "nkf.png",
    },
    {
      country: "Paraguay",
      name: "Club de SpeedCubing Paraguay",
      url: "http://www.pol.una.py/csc/",
      logo: "paraguay.png",
    },
    {
      country: "Poland",
      name: "Polskie Stowarzyszenie Speedcubingu",
      url: "http://www.speedcubing.pl",
      logo: "pss.jpg",
    },
    {
      country: "Russia",
      name: "Speedcubing Federation",
      url: "https://cubingrf.org",
      logo: "sfr.png",
    },
    {
      country: "Spain",
      name: "Asociación Española del cubo de Rubik",
      url: "http://www.asociacionrubik.es",
      logo: "spain.png",
    },
    {
      country: "Slovenia",
      name: "Rubik klub Slovenija",
      url: "https://www.rubiks.si/",
      logo: "slovenia.png",
    },
    {
      country: "Switzerland",
      name: "Swisscubing",
      url: "https://swisscubing.ch",
      logo: "swisscubing.png",
    },
    {
      country: "United Kingdom",
      name: "UK Cube Association",
      url: "http://ukca.org",
      logo: "ukcalogo.png",
    },
    {
      country: "United States",
      name: "Cubing USA",
      url: "http://www.cubingusa.org",
      logo: "cubing_usa.svg",
    },
  ].freeze

  def organizations
    @organizations_info = ORGANIZATIONS_INFO
  end

  def score_tools
  end

  def logo
  end

  def wca_workbook_assistant
  end

  def wca_workbook_assistant_versions
  end

  def robots
    respond_to :txt
  end
end
