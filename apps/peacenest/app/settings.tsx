import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useFilter } from '../src/contexts/FilterContext';

const CATEGORY_OPTIONS = [
  {
    id: 'politics',
    label: 'Politics & Government',
    value: 'politics and political debate, elections, government, geopolitics',
  },
  {
    id: 'doom',
    label: 'Doom News & Crises',
    value: 'societal bad news and doom news, crisis, fear-inducing news',
  },
  {
    id: 'violence',
    label: 'Violence & Casualties',
    value: 'violence and casualties, killing, assault, war casualties',
  },
  {
    id: 'controversy',
    label: 'Controversial Debates',
    value: 'controversial topics, heated arguments, divisive discussions',
  },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { state, updateSettings, resetStats } = useFilter();

  const toggleCategory = (categoryValue: string) => {
    const current = state.settings.enabledCategories;
    const updated = current.includes(categoryValue)
      ? current.filter(c => c !== categoryValue)
      : [...current, categoryValue];
    updateSettings({ enabledCategories: updated });
  };

  const toggleEnabled = () => {
    updateSettings({ enabled: !state.settings.enabled });
  };

  const toggleAction = () => {
    updateSettings({
      defaultAction: state.settings.defaultAction === 'REMOVE' ? 'REWRITE' : 'REMOVE',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Master Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Protection</Text>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Enable Filtering</Text>
              <Text style={styles.rowSubtitle}>
                Automatically filter triggering content
              </Text>
            </View>
            <Switch
              value={state.settings.enabled}
              onValueChange={toggleEnabled}
              trackColor={{ false: '#3d3d3d', true: '#4a69bd' }}
              thumbColor={state.settings.enabled ? '#7bed9f' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Categories</Text>
          <Text style={styles.sectionSubtitle}>
            Select content types to filter out
          </Text>
          {CATEGORY_OPTIONS.map(category => (
            <View key={category.id} style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{category.label}</Text>
              </View>
              <Switch
                value={state.settings.enabledCategories.includes(category.value)}
                onValueChange={() => toggleCategory(category.value)}
                trackColor={{ false: '#3d3d3d', true: '#4a69bd' }}
                thumbColor="#f4f3f4"
                disabled={!state.settings.enabled}
              />
            </View>
          ))}
        </View>

        {/* Action Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Filter Action</Text>
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>
                {state.settings.defaultAction === 'REMOVE' ? 'Remove Content' : 'Rewrite Content'}
              </Text>
              <Text style={styles.rowSubtitle}>
                {state.settings.defaultAction === 'REMOVE'
                  ? 'Completely remove filtered items'
                  : 'Replace with neutral placeholder'}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.toggleButton} 
              onPress={toggleAction}
              disabled={!state.settings.enabled}
            >
              <Text style={styles.toggleButtonText}>Toggle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.stats.totalProcessed}</Text>
              <Text style={styles.statLabel}>Processed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.stats.removed}</Text>
              <Text style={styles.statLabel}>Removed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.stats.rewritten}</Text>
              <Text style={styles.statLabel}>Rewritten</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{state.stats.l1CacheHits}</Text>
              <Text style={styles.statLabel}>Cache Hits</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.resetButton} onPress={resetStats}>
            <Text style={styles.resetButtonText}>Reset Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Version Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Info</Text>
          <Text style={styles.infoText}>
            Policy Version: {state.settings.policyVersion}
          </Text>
          <Text style={styles.infoText}>
            Confidence Threshold: {(state.settings.confidenceThreshold * 100).toFixed(0)}%
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#16213e',
  },
  backButton: {
    color: '#4a69bd',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#a4b0be',
    fontSize: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowContent: {
    flex: 1,
    marginRight: 16,
  },
  rowLabel: {
    color: '#fff',
    fontSize: 14,
  },
  rowSubtitle: {
    color: '#a4b0be',
    fontSize: 12,
    marginTop: 2,
  },
  toggleButton: {
    backgroundColor: '#4a69bd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
  },
  statValue: {
    color: '#7bed9f',
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    color: '#a4b0be',
    fontSize: 12,
  },
  resetButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#2d2d44',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  infoText: {
    color: '#a4b0be',
    fontSize: 12,
    marginTop: 4,
  },
});
