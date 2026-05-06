import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { registrySources } from "./src/data/registrySources";
import { addHistoryItem, clearHistory, readHistory } from "./src/services/history";
import { searchCompany } from "./src/services/registrySearch";
import { CompanyReport, SearchHistoryItem } from "./src/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function confidenceColor(confidence: CompanyReport["confidence"]) {
  if (confidence === "high") return "#0a7d48";
  if (confidence === "medium") return "#a06200";
  return "#9a3412";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<CompanyReport | undefined>();
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    readHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const configuredSources = useMemo(
    () => registrySources.filter((source) => source.apiStatus !== "manual"),
    []
  );

  async function runSearch(searchText = query) {
    const clean = searchText.trim();
    if (!clean) {
      Alert.alert("Search required", "Enter a business name, registry ID, or business number.");
      return;
    }

    Keyboard.dismiss();
    setIsSearching(true);
    try {
      const nextReport = await searchCompany(clean);
      setReport(nextReport);
      setQuery(clean);
      const nextHistory = await addHistoryItem({
        id: `${clean}-${Date.now()}`,
        query: clean,
        createdAt: nextReport.createdAt,
        matchName: nextReport.bestMatch?.legalName,
        registryId: nextReport.bestMatch?.registryId
      });
      setHistory(nextHistory);
    } catch (error) {
      Alert.alert("Search failed", error instanceof Error ? error.message : "Try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function openUrl(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  }

  async function resetHistory() {
    await clearHistory();
    setHistory([]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.kicker}>Canadian public registry lookup</Text>
          <Text style={styles.title}>Find company registry information</Text>
        </View>

        <View style={styles.searchPanel}>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            enterKeyHint="search"
            onSubmitEditing={() => runSearch()}
            placeholder="Company name, registry ID, or BN"
            placeholderTextColor="#6c7a73"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
          <Pressable
            accessibilityRole="button"
            disabled={isSearching}
            onPress={() => runSearch()}
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.pressed,
              isSearching && styles.disabledButton
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.searchButtonText}>Search</Text>
            )}
          </Pressable>
        </View>

        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search History</Text>
              <Pressable onPress={resetHistory} hitSlop={10}>
                <Text style={styles.linkText}>Clear</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.historyRow}>
                {history.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => runSearch(item.query)}
                    style={({ pressed }) => [
                      styles.historyItem,
                      pressed && styles.pressed
                    ]}
                  >
                    <Text numberOfLines={1} style={styles.historyQuery}>
                      {item.query}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {item.registryId ?? formatDate(item.createdAt)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {report ? (
          <View style={styles.report}>
            <View style={styles.reportTop}>
              <View>
                <Text style={styles.reportLabel}>Report</Text>
                <Text style={styles.companyName}>
                  {report.bestMatch?.legalName ?? report.query}
                </Text>
              </View>
              <Text
                style={[
                  styles.confidence,
                  { color: confidenceColor(report.confidence) }
                ]}
              >
                {report.confidence.toUpperCase()}
              </Text>
            </View>

            <View style={styles.factGrid}>
              <View style={styles.factBox}>
                <Text style={styles.factLabel}>Registry ID</Text>
                <Text style={styles.factValue}>
                  {report.bestMatch?.registryId ?? "Not returned"}
                </Text>
              </View>
              <View style={styles.factBox}>
                <Text style={styles.factLabel}>Jurisdiction</Text>
                <Text style={styles.factValue}>
                  {report.bestMatch?.jurisdiction ?? "Canada"}
                </Text>
              </View>
              <View style={styles.factBox}>
                <Text style={styles.factLabel}>Status</Text>
                <Text style={styles.factValue}>
                  {report.bestMatch?.status ?? "Check source"}
                </Text>
              </View>
              <View style={styles.factBox}>
                <Text style={styles.factLabel}>Business Number</Text>
                <Text style={styles.factValue}>
                  {report.bestMatch?.businessNumber ?? "Not returned"}
                </Text>
              </View>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Registered Address</Text>
              <Text style={styles.detailText}>{report.address ?? "Not returned by the configured live source."}</Text>
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Company Website</Text>
              {report.websiteUrl ? (
                <Pressable onPress={() => openUrl(report.websiteUrl!)}>
                  <Text style={styles.linkText}>{report.websiteUrl}</Text>
                </Pressable>
              ) : (
                <Text style={styles.detailText}>
                  Not asserted. Add an enrichment provider only if you can validate
                  the website against official records or the company’s own domain.
                </Text>
              )}
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Notes</Text>
              {report.summary.map((item) => (
                <Text key={item} style={styles.bullet}>
                  {item}
                </Text>
              ))}
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Official Sources</Text>
              {report.sourceLinks.map((source) => (
                <Pressable key={`${source.label}-${source.url}`} onPress={() => openUrl(source.url)}>
                  <Text style={styles.sourceLink}>{source.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.detailBlock}>
              <Text style={styles.detailTitle}>Possible Matches</Text>
              {report.matches.map((match) => (
                <View key={match.id} style={styles.matchItem}>
                  <Text style={styles.matchName}>{match.legalName}</Text>
                  <Text style={styles.matchMeta}>
                    {match.source.level} · {match.source.jurisdiction}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start with one search.</Text>
            <Text style={styles.emptyText}>
              The app checks configured Government of Canada and provincial registry
              APIs, then builds a source-linked report for the business.
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configured Registry Coverage</Text>
          {configuredSources.map((source) => (
            <View key={source.id} style={styles.sourceCard}>
              <View style={styles.sourceCardTop}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceBadge}>{source.level}</Text>
              </View>
              <Text style={styles.sourceNote}>{source.note}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7faf8"
  },
  container: {
    padding: 18,
    paddingBottom: 36
  },
  header: {
    marginTop: 14,
    marginBottom: 18
  },
  kicker: {
    color: "#497064",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  title: {
    color: "#10251f",
    fontSize: 33,
    fontWeight: "800",
    lineHeight: 38,
    marginTop: 6
  },
  searchPanel: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderColor: "#d8e2dd",
    borderWidth: 1,
    padding: 10,
    gap: 10
  },
  searchInput: {
    minHeight: 52,
    borderRadius: 6,
    backgroundColor: "#eef5f1",
    color: "#10251f",
    fontSize: 17,
    paddingHorizontal: 14
  },
  searchButton: {
    minHeight: 52,
    borderRadius: 6,
    backgroundColor: "#0f5f46",
    alignItems: "center",
    justifyContent: "center"
  },
  disabledButton: {
    opacity: 0.72
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "800"
  },
  pressed: {
    opacity: 0.75
  },
  section: {
    marginTop: 22
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
  },
  sectionTitle: {
    color: "#10251f",
    fontSize: 18,
    fontWeight: "800"
  },
  historyRow: {
    flexDirection: "row",
    gap: 10
  },
  historyItem: {
    width: 156,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    borderColor: "#d8e2dd",
    borderWidth: 1,
    padding: 12
  },
  historyQuery: {
    color: "#10251f",
    fontSize: 15,
    fontWeight: "800"
  },
  historyMeta: {
    color: "#65746e",
    fontSize: 12,
    marginTop: 6
  },
  report: {
    marginTop: 22,
    backgroundColor: "#ffffff",
    borderColor: "#d8e2dd",
    borderRadius: 8,
    borderWidth: 1,
    padding: 16
  },
  reportTop: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between"
  },
  reportLabel: {
    color: "#65746e",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase"
  },
  companyName: {
    color: "#10251f",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
    marginTop: 4,
    maxWidth: 240
  },
  confidence: {
    fontSize: 12,
    fontWeight: "900"
  },
  factGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16
  },
  factBox: {
    width: "48%",
    minHeight: 92,
    borderRadius: 8,
    backgroundColor: "#eef5f1",
    padding: 12
  },
  factLabel: {
    color: "#65746e",
    fontSize: 12,
    fontWeight: "700"
  },
  factValue: {
    color: "#10251f",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 8
  },
  detailBlock: {
    borderTopColor: "#e4ebe7",
    borderTopWidth: 1,
    marginTop: 16,
    paddingTop: 16
  },
  detailTitle: {
    color: "#10251f",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 8
  },
  detailText: {
    color: "#40524b",
    fontSize: 15,
    lineHeight: 21
  },
  bullet: {
    color: "#40524b",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 6
  },
  linkText: {
    color: "#0f5f46",
    fontSize: 15,
    fontWeight: "800"
  },
  sourceLink: {
    color: "#0f5f46",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10
  },
  matchItem: {
    borderColor: "#d8e2dd",
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12
  },
  matchName: {
    color: "#10251f",
    fontSize: 15,
    fontWeight: "800"
  },
  matchMeta: {
    color: "#65746e",
    fontSize: 13,
    marginTop: 5
  },
  emptyState: {
    marginTop: 22,
    borderColor: "#d8e2dd",
    borderRadius: 8,
    borderWidth: 1,
    padding: 18
  },
  emptyTitle: {
    color: "#10251f",
    fontSize: 20,
    fontWeight: "800"
  },
  emptyText: {
    color: "#40524b",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8
  },
  sourceCard: {
    backgroundColor: "#ffffff",
    borderColor: "#d8e2dd",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    padding: 12
  },
  sourceCardTop: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10
  },
  sourceName: {
    color: "#10251f",
    flex: 1,
    fontSize: 15,
    fontWeight: "800"
  },
  sourceBadge: {
    color: "#0f5f46",
    fontSize: 12,
    fontWeight: "900"
  },
  sourceNote: {
    color: "#40524b",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  }
});
