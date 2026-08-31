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

export const useUpdateRegistrationMutation = (
  competitionInfo,
  userInfo,
  inProgressMessageType = 'positive',
) => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  const onError = useRegistrationMutationErrorHandler();

  return useMutation({
    mutationFn: updateRegistration,
    onMutate: () => {
      if (inProgressMessageType) {
        dispatch(showMessage('competitions.registration_v2.update.being_updated', inProgressMessageType));
      }
    },
    onError,
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['registration', competitionInfo.id, userInfo.id],
        (prevRegistration) => ({
          ...data.registration,
          payment: prevRegistration.payment,
        }),
      );
    },
  });
};
