"use client";

import React, { useMemo } from "react";
import { Button, Card, Container, Table, Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import Loading from "@/components/ui/loading";
import { toaster } from "@/components/ui/toaster";

export default function ScoretakerManager({
  competitionId,
}: {
  competitionId: string;
}) {
  const api = useAPI();

  const { data: registrations, isFetching } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/registrations",
    { params: { path: { competitionId } } },
  );

  const { data: scoretakers, refetch } = api.useQuery(
    "get",
    "/v1/competitions/{competitionId}/scoretakers",
    { params: { path: { competitionId } } },
  );

  const scoretakerIds = useMemo(
    () => new Set((scoretakers ?? []).map((s) => s.user_id)),
    [scoretakers],
  );

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

  if (!registrations) {
    return <Text>No registrations found.</Text>;
  }

  const pending = isAdding || isRemoving;

  return (
    <Container>
      <Card.Root>
        <Card.Body>
          <Card.Title>Scoretakers</Card.Title>
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Name</Table.ColumnHeader>
                <Table.ColumnHeader />
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {registrations
                .toSorted((a, b) => a.user.name.localeCompare(b.user.name))
                .map((registration) => {
                  const isScoretaker = scoretakerIds.has(registration.user.id);
                  return (
                    <Table.Row key={registration.id}>
                      <Table.Cell>{registration.user.name}</Table.Cell>
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
                                    id: registration.user.id,
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
                                body: { user_id: registration.user.id },
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
