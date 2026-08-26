import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radius } from '../design/tokens';
import { Card, Divider } from '../components/ui';

interface Resource {
  title: string;
  description: string;
  phone?: string;
  url?: string;
}

const RESOURCES: { category: string; items: Resource[] }[] = [
  {
    category: 'Emergency Numbers (India)',
    items: [
      { title: 'National Emergency', description: 'Police, Fire, Ambulance', phone: '112' },
      { title: 'Police', description: 'Direct Police Control Room', phone: '100' },
      { title: 'Women Helpline', description: 'All India Women Helpline', phone: '1091' },
      { title: 'Domestic Abuse', description: 'National Commission for Women', phone: '181' },
    ]
  },
  {
    category: 'Legal & Support Organizations',
    items: [
      { title: 'National Commission for Women', description: 'Online complaint portal for women in distress', url: 'http://ncw.nic.in/' },
      { title: 'Cyber Crime', description: 'National Cyber Crime Reporting Portal', url: 'https://cybercrime.gov.in/', phone: '1930' },
    ]
  }
];

export default function ResourcesScreen() {
  const handlePress = async (item: Resource) => {
    if (item.phone) {
      const url = `tel:${item.phone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) Linking.openURL(url);
    } else if (item.url) {
      const canOpen = await Linking.canOpenURL(item.url);
      if (canOpen) Linking.openURL(item.url);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.pageTitle}>Safety Resources</Text>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.disclaimer}>
          The resources provided below are public helplines and websites. SafeHer is not affiliated with these organizations.
        </Text>

        {RESOURCES.map((group, gIdx) => (
          <View key={gIdx} style={styles.group}>
            <Text style={styles.groupTitle}>{group.category}</Text>
            <Card>
              {group.items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <TouchableOpacity style={styles.itemRow} onPress={() => handlePress(item)}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      <Text style={styles.itemDesc}>{item.description}</Text>
                      {item.phone && <Text style={styles.itemContact}>📞 {item.phone}</Text>}
                      {item.url && <Text style={styles.itemContact}>🌐 Website</Text>}
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                  {idx < group.items.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg.primary },
  pageTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.extrabold,
    color: Colors.text.primary,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  disclaimer: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  group: { marginBottom: Spacing.xl },
  groupTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.bold,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    paddingLeft: Spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  itemDesc: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  itemContact: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    color: Colors.brand.primary,
    marginTop: 4,
  },
  chevron: {
    fontSize: Typography.sizes.xl,
    color: Colors.text.muted,
  }
});
