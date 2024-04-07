import {
  groupTypes, teamsCommitteesStatus, councilsStatus, delegateRegionsStatus,
} from '../wca-data.js.erb';

export function statusObjectOfGroupType(groupType) {
  switch (groupType) {
    case groupTypes.teams_committees:
      return teamsCommitteesStatus;
    case groupTypes.councils:
      return councilsStatus;
    case groupTypes.delegate_regions:
      return delegateRegionsStatus;
    default:
      return null;
  }
}

export function nextStatusOfGroupType(status, groupType) {
  switch (groupType) {
    case groupTypes.delegate_regions: {
      switch (status) {
        case delegateRegionsStatus.trainee_delegate:
          return delegateRegionsStatus.junior_delegate;
        case delegateRegionsStatus.junior_delegate:
          return delegateRegionsStatus.delegate;
        default: return null;
      }
    }
    default: return null;
  }
}

export function previousStatusOfGroupType(status, groupType) {
  switch (groupType) {
    case groupTypes.delegate_regions: {
      switch (status) {
        case delegateRegionsStatus.junior_delegate:
          return delegateRegionsStatus.trainee_delegate;
        case delegateRegionsStatus.delegate:
          return delegateRegionsStatus.junior_delegate;
        default: return null;
      }
    }
    default: return null;
  }
}
