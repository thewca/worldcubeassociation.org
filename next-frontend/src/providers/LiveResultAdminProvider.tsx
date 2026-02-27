import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";
import { Format } from "@/lib/wca/data/formats";
import { useLiveResults } from "@/providers/LiveResultProvider";
import useAPI from "@/lib/wca/useAPI";

interface AdminResultsContextValue {
  registrationId: number | undefined;
  attempts: number[];
  error: string;
  success: string;
  isPendingUpdate: boolean;
  isPendingQuit: boolean;
  handleRegistrationIdChange: (value: number) => void;
  handleAttemptChange: (index: number, value: number) => void;
  handleSubmit: () => void;
  clearCompetitorsResults: (registrationId: number) => void;
  quitCompetitor: (registrationId: number) => void;
}

function zeroedArrayOfSize(size: number) {
  return Array(size).fill(0);
}

const AdminResultsContext = createContext<AdminResultsContextValue | null>(
  null,
);

export function LiveResultAdminProvider({
  children,
  format,
  roundId,
  competitionId,
}: {
  children: ReactNode;
  format: Format;
  roundId: string;
  competitionId: string;
}) {
  const solveCount = format.expected_solve_count;

  const [registrationId, setRegistrationId] = useState<number>();
  const [attempts, setAttempts] = useState<number[]>(
    zeroedArrayOfSize(solveCount),
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { liveResultsByRegistrationId, addPendingLiveResult } =
    useLiveResults();
  const api = useAPI();

  const handleRegistrationIdChange = useCallback(
    (value: number) => {
      setRegistrationId(value);
      // Even for Dual Rounds we only fetch one round in the admin view
      const alreadyEnteredResults = liveResultsByRegistrationId[value][0];
      if (alreadyEnteredResults) {
        setAttempts(alreadyEnteredResults.attempts.map((a) => a.value));
      } else {
        setAttempts(zeroedArrayOfSize(solveCount));
      }
    },
    [liveResultsByRegistrationId, solveCount],
  );

  const { mutate: mutateUpdate, isPending: isPendingUpdate } = api.useMutation(
    "patch",
    "/v1/competitions/{competitionId}/live/rounds/{roundId}",
    {
      onSuccess: (_data, variables) => {
        addPendingLiveResult({
          registration_id: variables.body.registration_id,
          live_attempts: variables.body.attempts,
        });
        setSuccess("Results updated successfully!");
        setRegistrationId(undefined);
        setAttempts(zeroedArrayOfSize(solveCount));
        setError("");
        setTimeout(() => setSuccess(""), 3000);
      },
      onError: () => {
        setError("Failed to update results. Please try again.");
      },
    },
  );

  const { mutate: mutateQuit, isPending: isPendingQuit } = api.useMutation(
    "put",
    "/v1/competitions/{competitionId}/rounds/{round_id}/{:registration_id}/quit",
    {
      onSuccess: () => {
        // Do we remove the competitor here or do we wait for the web socket update?
      },
      onError: () => {
        setError("Failed to update results. Please try again.");
      },
    },
  );

  const handleAttemptChange = (index: number, value: number) => {
    const newAttempts = [...attempts];
    newAttempts[index] = value;
    setAttempts(newAttempts);
  };

  const handleSubmit = () => {
    if (!registrationId) {
      setError("Please enter a user ID");
      return;
    }

    mutateUpdate({
      params: {
        path: { competitionId, roundId },
      },
      body: {
        attempts: attempts.map((attempt, index) => ({
          value: attempt,
          attempt_number: index + 1,
        })),
        registration_id: registrationId,
      },
    });
  };

  const clearCompetitorsResults = (registrationId: number) => {
    mutateUpdate({
      params: {
        path: { competitionId, roundId },
      },
      body: {
        attempts: zeroedArrayOfSize(format.expected_solve_count).map(
          (attempt, index) => ({
            value: attempt,
            attempt_number: index + 1,
          }),
        ),
        registration_id: registrationId,
      },
    });
  };

  const quitCompetitor = (registrationId: number) => {
    mutateQuit({
      params: {
        path: { competitionId, roundId, registrationId },
      },
    });
  };

  return (
    <AdminResultsContext.Provider
      value={{
        registrationId,
        attempts,
        error,
        success,
        isPendingUpdate,
        isPendingQuit,
        quitCompetitor,
        handleRegistrationIdChange,
        handleAttemptChange,
        handleSubmit,
        clearCompetitorsResults,
      }}
    >
      {children}
    </AdminResultsContext.Provider>
  );
}

export function useResultsAdmin(): AdminResultsContextValue {
  const context = useContext(AdminResultsContext);
  if (!context) {
    throw new Error(
      "useAdminResults must be used within an AdminResultsProvider",
    );
  }
  return context;
}
