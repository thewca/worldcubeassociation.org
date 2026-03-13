import { useCallback, useEffect, useState } from "react";
import { createConsumer } from "@rails/actioncable";
import _ from "lodash";
import useEffectEvent from "@/lib/hooks/useEffectEvent";
import type { PartialExcept } from "@/lib/types/objects";
import { LiveResult } from "@/types/live";

export const CONNECTION_STATE_INITIALIZED = 1;
export const CONNECTION_STATE_CONNECTED = 2;
export const CONNECTION_STATE_DISCONNECTED = 0;

export type ConnectionState =
  | typeof CONNECTION_STATE_INITIALIZED
  | typeof CONNECTION_STATE_CONNECTED
  | typeof CONNECTION_STATE_DISCONNECTED;

export const CONNECTION_COLORS = {
  [CONNECTION_STATE_INITIALIZED]: "yellow",
  [CONNECTION_STATE_CONNECTED]: "green",
  [CONNECTION_STATE_DISCONNECTED]: "red",
};

export const CONNECTION_TRANSLATION_KEYS = {
  [CONNECTION_STATE_INITIALIZED]: "initialized",
  [CONNECTION_STATE_CONNECTED]: "connected",
  [CONNECTION_STATE_DISCONNECTED]: "disconnected",
};

// Move this to something like https://www.asyncapi.com
export type CompressedLiveResult = {
  ad: boolean;
  adq: boolean;
  a: number;
  b: number;
  art: string;
  srt: string;
  r: number;
  la: {
    v: number;
    an: number;
  }[];
};

export type DiffedLiveResult = PartialExcept<LiveResult, "registration_id">;
export type CompressedDiffedLiveResults = PartialExcept<
  CompressedLiveResult,
  "r"
>;

export type DiffProtocolResponse = {
  updated?: CompressedDiffedLiveResults[];
  deleted?: number[];
  created?: CompressedLiveResult[];
  before_hash: string;
  after_hash: string;
  wcif_id: string;
};

export default function useResultsSubscriptions(
  roundIds: string[],
  onReceived: (roundId: string, data: DiffProtocolResponse) => void,
) {
  const [connectionStates, setConnectionStates] = useState<
    Record<string, ConnectionState>
  >(() =>
    Object.fromEntries(
      roundIds.map((id) => [id, CONNECTION_STATE_INITIALIZED]),
    ),
  );

  const changeConnectionState = useCallback(
    (roundId: string, connectionState: ConnectionState) => {
      setConnectionStates((prev) => ({
        ...prev,
        [roundId]: connectionState,
      }));
    },
    [],
  );

  const onReceivedEvent = useEffectEvent(onReceived);

  useEffect(() => {
    const cable = createConsumer("http://localhost:3000/cable");

    const subscriptions = roundIds.map((roundId) =>
      cable.subscriptions.create(
        { channel: "LiveResultsChannel", round_id: roundId },
        {
          received: (data: DiffProtocolResponse) =>
            onReceivedEvent(roundId, data),
          initialized: () =>
            changeConnectionState(roundId, CONNECTION_STATE_INITIALIZED),
          connected: () =>
            changeConnectionState(roundId, CONNECTION_STATE_CONNECTED),
          disconnected: () =>
            changeConnectionState(roundId, CONNECTION_STATE_DISCONNECTED),
        },
      ),
    );

    return () => subscriptions.forEach((s) => s.unsubscribe());
  }, [changeConnectionState, onReceivedEvent, roundIds]);

  // Aggregate: worst state wins
  const values = Object.values(connectionStates);
  return _.min(values)!;
}
