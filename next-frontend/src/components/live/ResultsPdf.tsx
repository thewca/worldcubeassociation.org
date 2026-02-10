import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatAttemptResult } from "@/lib/wca/wcif/attempts";
import events from "@/lib/wca/data/events";
import { parseActivityCode } from "@/lib/wca/wcif/rounds";
import { components } from "@/types/openapi";
import formats from "@/lib/wca/data/formats";
import _ from "lodash";
import countries from "@/lib/wca/data/countries";
import { statColumnsForFormat } from "@/lib/live/statColumnsForFormat";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    padding: 30,
  },
  title: {
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(0, 0, 0, 0.54)",
    fontSize: 16,
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
    fontSize: 10,
    fontWeight: 600,
    color: "rgba(0, 0, 0, 0.54)",
    padding: "6px 8px",
  },
  tableCell: {
    fontSize: 11,
    color: "rgba(0, 0, 0, 0.87)",
    padding: "6px 8px",
  },
  colRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  colLeft: {
    alignItems: "flex-start",
    justifyContent: "center",
  },
  rankCol: { width: 40 },
  nameCol: { flex: 2 },
  countryCol: { flex: 1 },
  attemptCol: { width: 60 },
  statCol: { width: 80 },
  advancing: {
    backgroundColor: "#00e676",
  },
  mainStat: {
    fontWeight: 600,
  },
  recordTag: {
    fontWeight: 600,
    padding: "0 4px",
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

const latinName = (name: string) => name.replace(/\s*[(（].*/u, "");

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

  const stats = statColumnsForFormat(format);

  const resultsByRegistrationId = _.keyBy(results, "registration_id");

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <Text style={styles.title}>{competitionId}</Text>
        <Text style={styles.subtitle}>
          {event.name} - {roundNumber}
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.rankCol, styles.colRight]}>
              <Text style={styles.tableHeader}>#</Text>
            </View>
            <View style={styles.nameCol}>
              <Text style={styles.tableHeader}>Name</Text>
            </View>
            <View style={styles.countryCol}>
              <Text style={styles.tableHeader}>Country</Text>
            </View>

            {Array.from({ length: format.expected_solve_count }, (_, i) => (
              <View key={i} style={[styles.attemptCol, styles.colRight]}>
                <Text style={styles.tableHeader}>{i + 1}</Text>
              </View>
            ))}

            {stats.map((stat, idx) => (
              <View key={idx} style={[styles.statCol, styles.colRight]}>
                <Text style={styles.tableHeader}>{stat.name}</Text>
              </View>
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
                <View
                  style={[
                    styles.rankCol,
                    styles.colRight,
                    ...(result.advancing ? [styles.advancing] : []),
                  ]}
                >
                  <Text style={styles.tableCell}>{result.global_pos}</Text>
                </View>

                <View style={styles.nameCol}>
                  <Text style={styles.tableCell}>
                    {latinName(competitor.name)}
                  </Text>
                </View>

                <View style={styles.countryCol}>
                  <Text style={styles.tableCell}>{country.name}</Text>
                </View>

                {attemptResults.map((attemptResult, i) => (
                  <View key={i} style={[styles.attemptCol, styles.colRight]}>
                    <Text style={styles.tableCell}>
                      {formatAttemptResult(attemptResult, event.id)}
                    </Text>
                  </View>
                ))}

                {stats.map((stat, i) => {
                  const recordTag = result[stat.recordTagField];
                  const isMainStat = i === 0;

                  return (
                    <View key={i} style={[styles.statCol, styles.colRight]}>
                      <Text
                        style={[
                          styles.tableCell,
                          ...(isMainStat ? [styles.mainStat] : []),
                        ]}
                      >
                        {["WR", "CR", "NR"].includes(recordTag) && (
                          <Text
                            style={[
                              styles.recordTag,
                              ...(recordTag === "WR"
                                ? [styles.recordTagWR]
                                : []),
                              ...(recordTag === "CR"
                                ? [styles.recordTagCR]
                                : []),
                              ...(recordTag === "NR"
                                ? [styles.recordTagNR]
                                : []),
                            ]}
                          >
                            {recordTag}{" "}
                          </Text>
                        )}
                        {formatAttemptResult(result[stat.field], event.id)}
                      </Text>
                    </View>
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
