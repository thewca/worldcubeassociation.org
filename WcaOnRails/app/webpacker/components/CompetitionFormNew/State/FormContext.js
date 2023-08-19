import React from 'react';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (Math.floor(max) - Math.ceil(min) + 1)) + Math.ceil(min);
}

const randomName = `Irish Championship ${getRandomInt(0, 254)} 2024`;

const exampleFormData = {
  admin: {
    confirmed: false,
    showAtAll: false,
  },
  id: '',
  name: randomName,
  cellName: randomName,
  name_reason: "This is Ireland's national championship",
  venue: {
    countryId: 'Ireland',
    cityName: 'Waterford',
    venue: 'SETU Arena',
    venueDetails: 'Main Hall',
    venueAddress: 'South East Technological University West Campus, Carriganore, Co. Waterford. X91 XD96',
    coordinates: {
      lat: 52.251307,
      long: -7.17915,
    },
  },
  start_date: '2023-07-07',
  end_date: '2023-07-09',
  registration_open: '2023-02-07T19:30:00.000Z',
  registration_close: '2023-06-23T18:30:00.000Z',
  information: '![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbjR0IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--a13bedab4cf7df3cba2b1e84ee17ea415a733fe8/image.png)\r\n\r\n**Final Round Advancements:** For all events with more than one round, we will be taking a minimum of 6 Irish competitors to the final. If necessary, we will increase the size of the final by one competitor at a time until we have enough Irish competitors.\r\n\r\n**Please Note:** As this is the Irish Championship, only competitors who represent Ireland will be eligible for prizes. The competition remains open for all nationalities to compete.\r\n\r\n**Fewest Moves Challenge**: FMC will not be held at this competition. To compete for the national champion title for FMC, you must compete at[ Irish Championship FMC 2023](https://www.worldcubeassociation.org/competitions/IrishChampionshipFMC2023) on 1st July instead.\r\n\r\n![](https://www.worldcubeassociation.org/rails/active_storage/blobs/redirect/eyJfcmFpbHMiOnsibWVzc2FnZSI6IkJBaHBBbjh0IiwiZXhwIjpudWxsLCJwdXIiOiJibG9iX2lkIn19--eaf1001b560c47985f7691c2c68d2aa585918d80/image.png)\r\n\r\nhttps://speedcubingireland.com/\r\nAdd us on [Facebook](https://www.facebook.com/speedcubingireland/) and [Instagram](https://www.instagram.com/speedcubingireland/?hl=en)! Join our [Discord Server](https://discord.gg/ddFb3WeTx8)!\r\n\r\n',
  competitorLimit: {
    competitor_limit_enabled: true,
    competitor_limit: 350,
    competitor_limit_reason: 'Scheduling',
  },
  staff: {
    staff_delegate_ids: '6113,6858,19877,54140,54147,139579,229961',
    trainee_delegate_ids: '19883',
    organizer_ids: '381,140745,299813',
    contact: '',
  },
  championships: [
    'IE',
  ],
  website: {
    generate_website: true,
    external_website: null,
    use_wca_registration: true,
    external_registration_page: '',
    use_wca_live_for_scoretaking: true,
  },
  userSettings: {
    receive_registration_emails: null,
  },
  entryFees: {
    currency_code: 'EUR',
    base_entry_fee_lowest_denomination: 3500,
    enable_donations: true,
    guests_enabled: true,
    guests_entry_fee_lowest_denomination: 0,
    guest_entry_status: 'free',
    guests_per_registration_limit: null,
  },
  regDetails: {
    allow_registration_self_delete_after_acceptance: false,
    refund_policy_percent: 70,
    on_the_spot_registration: false,
    refund_policy_limit_date: '2023-06-23T18:30:00.000Z',
    waiting_list_deadline_date: '2023-06-23T18:30:00.000Z',
    event_change_deadline_date: '2023-06-23T18:30:00.000Z',
    allow_registration_edits: false,
    extra_registration_requirements: '**Registration is not complete until the registration fee has been paid.** A spot is not guaranteed until the competitors name appears on the Competitors tab. Once the competitor limit has been reached, new registrations will be added to the waiting list in the order of payment. Waitlisted competitors will only be accepted provided one of the accepted competitors withdraws from the competition. \r\n\r\nAll competitors still on the waiting list after registration closes will be removed and a full refund issued.\r\n\r\nIf you can no longer attend the competition, please inform us ASAP. We can give the free spot to another person! Of course you will get a refund according to the refund policy for this competition.\r\n\r\nPlease allow up to 48 hours for your registration to be accepted. Registrations will not be accepted until the appropriate registration fee has been received.\r\n\r\nIf you wish to edit your registration, please contact the organisation team *via* the link above.',
    force_comment_in_registration: false,
  },
  eventRestrictions: {
    early_puzzle_submission: true,
    early_puzzle_submission_reason: 'Multiblind puzzles are to be submitted early to allow time for scrambling.',
    qualification_results: false,
    qualification_results_reason: '',
    allow_registration_without_qualification: false,
    event_restrictions: false,
    event_restrictions_reason: '',
    events_per_registration_limit: null,
  },
  remarks: 'remarks to the board here',
};

const FormContext = React.createContext({
  competition: exampleFormData,
  persisted: false,
  adminView: false,
  organizerView: false,
  formData: exampleFormData,
  setFormData: (data) => data,
  markers: [{
    id: '',
    lat: 0,
    long: 0,
  }],
  setMarkers: (data) => data,
  /** @type {Object.<string, string[]>} */
  errors: {
  },
  setErrors: (data) => data,
});

export default FormContext;
