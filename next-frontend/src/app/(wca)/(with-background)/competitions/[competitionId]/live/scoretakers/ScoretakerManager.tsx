"use client";

import React, { useState } from "react";
import { Button, Card, Container, Input, Table, Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { toaster } from "@/components/ui/toaster";

export default function ScoretakerManager({
  competitionId,
}: {
  competitionId: string;
}) {
  const api = useAPI();
  const [nameFilter, setNameFilter] = useState("");

  const { data: candidates, isFetching } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/scoretakers/candidates",
    { params: { path: { competitionId } } },
  );

  const { data: scoretakers, refetch } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/scoretakers",
    { params: { path: { competitionId } } },
  );

  const scoretakerIds = new Set((scoretakers ?? []).map((s) => s.user_id));

  const onError = () =>
    toaster.create({ description: "Something went wrong", type: "error" });

  const { mutate: add, isPending: isAdding } = api.useMutation(
    "post",
    "/v1/competitions/{competitionId}/scoretakers",
    { onSuccess: () => refetch(), onError },
  );

  const { mutate: remove, isPending: isRemoving } = api.useMutation(
    "delete",
    "/v1/competitions/{competitionId}/scoretakers/{id}",
    { onSuccess: () => refetch(), onError },
  );

  if (isFetching) {
    return <Loading />;
  }

  if (!candidates) {
    return <Text>No registrations found.</Text>;
  }

  const pending = isAdding || isRemoving;

  const visibleCandidates = candidates
    .filter((candidate) =>
      candidate.name.toLowerCase().includes(nameFilter.toLowerCase()),
    )
    .toSorted((a, b) => a.name.localeCompare(b.name));

  return (
    <Container>
      <Card.Root>
        <Card.Body>
          <Card.Title>Scoretakers</Card.Title>
          <Input
            placeholder="Search by name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {visibleCandidates.map((candidate) => {
                const isScoretaker = scoretakerIds.has(candidate.user_id);
                return (
                  <Table.Row key={candidate.user_id}>
                    <Table.Cell>{candidate.name}</Table.Cell>
                    <Table.Cell textAlign="end">
                      {isScoretaker ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() =>
                            remove({
                              params: {
                                path: {
                                  competitionId,
                                  id: candidate.user_id,
                                },
                              },
                            })
                          }
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={pending}
                          onClick={() =>
                            add({
                              params: { path: { competitionId } },
                              body: { user_id: candidate.user_id },
                            })
                          }
                        >
                          Add as scoretaker
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Card.Body>
      </Card.Root>
    </Container>
  );
}
