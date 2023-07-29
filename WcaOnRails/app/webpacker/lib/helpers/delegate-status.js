import I18n from '../i18n';

const delegateStatus = {
  trainee_delegate: {
    name: I18n.t('enums.user.delegate_status.trainee_delegate'),
    isLeadRole: false,
  },
  candidate_delegate: {
    name: I18n.t('enums.user.delegate_status.candidate_delegate'),
    isLeadRole: false,
  },
  delegate: {
    name: I18n.t('enums.user.delegate_status.delegate'),
    isLeadRole: false,
  },
  senior_delegate: {
    name: I18n.t('enums.user.delegate_status.senior_delegate'),
    isLeadRole: true,
  },
};

export default delegateStatus;
