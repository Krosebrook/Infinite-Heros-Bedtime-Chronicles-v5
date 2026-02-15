import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { HEROES, Hero } from '@/constants/heroes';
import { HeroCard } from '@/components/HeroCard';
import { StarField } from '@/components/StarField';

export default function HeroesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={styles.container}>
      <StarField />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 16, paddingBottom: Platform.OS === 'web' ? 84 : insets.bottom + 90 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.label}>MEET THE</Text>
          <Text style={styles.title}>Infinity Heroes</Text>
          <Text style={styles.subtitle}>
            {HEROES.length} legendary protectors of the night
          </Text>
        </View>

        <View style={styles.grid}>
          {HEROES.map((hero) => (
            <HeroCard
              key={hero.id}
              hero={hero}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedHero(hero);
              }}
            />
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={!!selectedHero}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedHero(null)}
      >
        {selectedHero && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={selectedHero.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalGradient}
              >
                <Pressable
                  onPress={() => setSelectedHero(null)}
                  style={styles.closeBtn}
                  hitSlop={12}
                >
                  <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
                </Pressable>

                <View style={styles.modalIconWrap}>
                  <Ionicons name={selectedHero.iconName as any} size={56} color={selectedHero.color} />
                </View>

                <Text style={styles.modalName}>{selectedHero.name}</Text>
                <Text style={styles.modalTitle}>{selectedHero.title}</Text>

                <View style={styles.modalDivider} />

                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Ionicons name="flash" size={16} color={Colors.accent} />
                    <Text style={styles.statLabel}>Power</Text>
                    <Text style={styles.statValue}>{selectedHero.power}</Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="sparkles" size={16} color={Colors.accent} />
                    <Text style={styles.statLabel}>Constellation</Text>
                    <Text style={styles.statValue}>{selectedHero.constellation}</Text>
                  </View>
                </View>

                <View style={styles.descriptionCard}>
                  <Text style={styles.descriptionText}>{selectedHero.description}</Text>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  scrollContent: {},
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 14,
    color: Colors.accent,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 32,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    color: Colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 14,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 28,
    paddingBottom: 48,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  modalName: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalTitle: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 4,
  },
  modalDivider: {
    width: 40,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 20,
  },
  statRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 14,
    borderRadius: 16,
    gap: 4,
  },
  statLabel: {
    fontFamily: 'Nunito_500Medium',
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  statValue: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  descriptionCard: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 16,
    padding: 18,
    width: '100%',
  },
  descriptionText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
    textAlign: 'center',
  },
});
