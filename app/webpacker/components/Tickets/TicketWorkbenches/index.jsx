import { ticketTypes, ticketStakeholderRoles } from '../../../lib/wca-data.js.erb';
import EditPersonTicketWorkbench from './EditPersonTicketWorkbench';

export default {
  [ticketTypes.edit_person]: {
    [ticketStakeholderRoles.actioner]: EditPersonTicketWorkbench,
  },
};
