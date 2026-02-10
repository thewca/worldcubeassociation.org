import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import _ from "lodash";
import countries from "@/lib/wca/data/countries";

// Define styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 30,
  },
  title: {
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: 32,
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: 26,
    marginBottom: 16,
  },
  table: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  tableHeader: {
    fontSize: 16,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.54)",
    padding: "6px 8px",
  },
  tableCell: {
    fontSize: 20,
    color: "rgba(0, 0, 0, 0.87)",
    padding: "6px 8px",
  },
  right: {
    textAlign: "right",
  },
  advancing: {
    backgroundColor: "#00e676",
  },
  mainStat: {
    fontWeight: 600,
  },
  recordTag: {
    fontWeight: 600,
    padding: "0 4px",
    display: "inline-block",
  },
  recordTagWR: {
    backgroundColor: "#f44336",
  },
  recordTagCR: {
    backgroundColor: "#ffeb3b",
  },
  recordTagNR: {
    backgroundColor: "#00e676",
  },
});

const padSkipped = (attempts: number[], expectedNumberOfAttempts: number) => {
  return [
    ...attempts,
    ...Array(expectedNumberOfAttempts - attempts.length).fill(0),
  ];
};

export default function ResultsPDF({
  competitionId,
  roundId,
  formatId,
  results,
  competitors,
}: {
  competitionId: string;
  roundId: string;
  formatId: string;
  results: components["schemas"]["LiveResult"][];
  competitors: components["schemas"]["LiveCompetitor"][];
}) {
  const { roundNumber, eventId } = parseActivityCode(roundId);
  const event = events.byId[eventId];
  const format = formats.byId[formatId];

  const stats = [
    { name: "average", recordTagField: "average_record_tag", field: "average" },
    { name: "single", recordTagField: "single_record_tag", field: "single" },
  ];

  const resultsByRegistrationId = _.keyBy(results, "registration_id");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{competitionId}</Text>
        <Text style={styles.subtitle}>
          {event.name} - {roundNumber}
        </Text>

        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeader, styles.right]}>#</Text>
            <Text style={styles.tableHeader}>Name</Text>
            <Text style={styles.tableHeader}>Country</Text>

            {Array.from({ length: format.expected_solve_count }, (_, i) => (
              <Text key={i} style={[styles.tableHeader, styles.right]}>
                {i + 1}
              </Text>
            ))}

            {stats.map((stat, idx) => (
              <Text key={idx} style={[styles.tableHeader, styles.right]}>
                {stat.name}
              </Text>
            ))}
          </View>

          {/* Table Body */}
          {competitors.map((competitor, idx) => {
            const result = resultsByRegistrationId[competitor.id];
            const country = countries.byIso2[competitor.country_iso2];
            const attemptResults = padSkipped(
              result.attempts.map((a) => a.value),
              format.expected_solve_count,
            );

            return (
              <View key={idx} style={styles.tableRow}>
                <Text
                  style={[
                    styles.tableCell,
                    styles.right,
                    result.advancing && styles.advancing,
                  ]}
                >
                  {result.global_pos}
                </Text>

                <Text style={styles.tableCell}>{competitor.name}</Text>

                <Text style={styles.tableCell}>{country.name}</Text>

                {attemptResults.map((attemptResult, i) => (
                  <Text key={i} style={[styles.tableCell, styles.right]}>
                    {formatAttemptResult(attemptResult, event.id)}
                  </Text>
                ))}

                {stats.map((stat, i) => {
                  const recordTag = result[stat.record_tag_field];
                  const isMainStat = i === 0;

                  return (
                    <Text
                      key={i}
                      style={[
                        styles.tableCell,
                        styles.right,
                        isMainStat && styles.mainStat,
                      ]}
                    >
                      {["WR", "CR", "NR"].includes(recordTag) && (
                        <Text
                          style={[
                            styles.recordTag,
                            recordTag === "WR" && styles.recordTagWR,
                            recordTag === "CR" && styles.recordTagCR,
                            recordTag === "NR" && styles.recordTagNR,
                          ]}
                        >
                          {recordTag}{" "}
                        </Text>
                      )}
                      {formatAttemptResult(result[stat.field], event.id)}
                    </Text>
                  );
                })}
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );
}
