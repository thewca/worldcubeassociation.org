import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import updateRegistration from '../api/registration/patch/update_registration';
import { showMessage } from '../Register/RegistrationMessage';
import { useDispatch } from '../../../lib/providers/StoreProvider';

export const useRegistrationMutationErrorHandler = () => {
  const dispatch = useDispatch();

  return useCallback((data) => {
    const { error } = data.json;

    dispatch(showMessage(
      `competitions.registration_v2.errors.${error}`,
      'negative',
    ));
  }, [dispatch]);
};

export const useUpdateRegistrationMutation = (competitionInfo, userInfo, inProgressMessageType = 'positive') => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const onError = useRegistrationMutationErrorHandler();

  return useMutation({
    mutationFn: updateRegistration,
    onMutate: () => dispatch(showMessage('competitions.registration_v2.update.being_updated', inProgressMessageType)),
    onError,
    onSuccess: (data) => {
      const registrationId = data.registration.id;

      queryClient.setQueryData(
        ['registration', competitionInfo.id, userInfo.id, registrationId],
        (prevRegistration) => ({
          ...data.registration,
          payment: prevRegistration.payment,
        }),
      );

      queryClient.refetchQueries({ queryKey: ['registration-history', registrationId], exact: true });
      queryClient.refetchQueries({ queryKey: ['registration-payments', registrationId], exact: true });
    },
  });
};
