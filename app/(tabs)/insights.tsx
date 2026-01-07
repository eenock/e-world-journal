import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { generateWeeklyInsight } from '@/lib/groq';
import { useStore, selectIsProUser } from '@/store';
import { LineChart } from 'react-native-chart-kit';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import * as Haptics from 'expo-haptics';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MoodTrend {
    date: string;
    mood: string;
    intensity: number;
    color: string;
}

interface Theme {
    tag: string;
    count: number;
}

export default function InsightsScreen() {
    const router = useRouter();
    const { user, customerInfo } = useStore();
    const isPro = selectIsProUser(useStore.getState());

    const [loading, setLoading] = useState(true);
    const [moodTrends, setMoodTrends] = useState<MoodTrend[]>([]);
    const [topThemes, setTopThemes] = useState<Theme[]>([]);
    const [weeklySummary, setWeeklySummary] = useState<string>('');
    const [stats, setStats] = useState({
        totalEntries: 0,
        currentStreak: 0,
        longestStreak: 0,
        avgMoodScore: 0,
    });

    useEffect(() => {
        if (isPro) {
            loadInsights();
        }
    }, [isPro, user]);

    const loadInsights = async () => {
        if (!user) return;

        try {
            // Get entries from last 30 days
            const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];

            const { data: entries, error } = await supabase
                .from('entries')
                .select(`
          id,
          entry_date,
          content_text,
          tags,
          mood_intensity,
          moods (
            name,
            emoji,
            color
          )
        `)
                .eq('user_id', user.id)
                .gte('entry_date', thirtyDaysAgo)
                .order('entry_date', { ascending: true });

            if (error) throw error;

            // Calculate stats
            const { data: userData } = await supabase
                .from('users')
                .select('streak_count')
                .eq('id', user.id)
                .single();

            setStats({
                totalEntries: entries.length,
                currentStreak: userData?.streak_count || 0,
                longestStreak: userData?.streak_count || 0, // TODO: Calculate actual longest
                avgMoodScore: calculateAvgMood(entries),
            });

            // Process mood trends
            const trends: MoodTrend[] = entries
                .filter((e: any) => e.moods && e.mood_intensity)
                .map((e: any) => ({
                    date: e.entry_date,
                    mood: e.moods.name,
                    intensity: e.mood_intensity,
                    color: e.moods.color,
                }));

            setMoodTrends(trends);

            // Calculate top themes
            const tagCounts: { [key: string]: number } = {};
            entries.forEach((e: any) => {
                e.tags?.forEach((tag: string) => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });

            const themes = Object.entries(tagCounts)
                .map(([tag, count]) => ({ tag, count: count as number }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);

            setTopThemes(themes);

            // Generate weekly summary
            await generateSummary(entries);
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateAvgMood = (entries: any[]) => {
        const moodEntries = entries.filter((e) => e.mood_intensity);
        if (moodEntries.length === 0) return 0;

        const sum = moodEntries.reduce((acc, e) => acc + e.mood_intensity, 0);
        return Math.round((sum / moodEntries.length) * 10) / 10;
    };

    const generateSummary = async (entries: any[]) => {
        // Get last week's entries
        const lastWeekStart = startOfWeek(subDays(new Date(), 7));
        const lastWeekEnd = endOfWeek(subDays(new Date(), 7));

        const weekEntries = entries.filter((e) => {
            const date = new Date(e.entry_date);
            return date >= lastWeekStart && date <= lastWeekEnd;
        });

        if (weekEntries.length === 0) {
            setWeeklySummary('Not enough entries to generate a summary yet. Keep journaling!');
            return;
        }

        // Check cache first
        const { data: cached } = await supabase
            .from('insights')
            .select('data')
            .eq('user_id', user!.id)
            .eq('insight_type', 'weekly_summary')
            .eq('period_start', format(lastWeekStart, 'yyyy-MM-dd'))
            .eq('period_end', format(lastWeekEnd, 'yyyy-MM-dd'))
            .single();

        if (cached) {
            setWeeklySummary(cached.data.summary);
            return;
        }

        // Generate new summary
        const summary = await generateWeeklyInsight(
            weekEntries.map((e) => ({
                content_text: e.content_text || '',
                mood: e.moods?.name,
            }))
        );

        setWeeklySummary(summary);

        // Cache it
        await supabase.from('insights').insert({
            user_id: user!.id,
            insight_type: 'weekly_summary',
            data: { summary },
            period_start: format(lastWeekStart, 'yyyy-MM-dd'),
            period_end: format(lastWeekEnd, 'yyyy-MM-dd'),
        });
    };

    const getMoodChartData = () => {
        const last7Days = Array.from({ length: 7 }, (_, i) =>
            format(subDays(new Date(), 6 - i), 'MM/dd')
        );

        const data = last7Days.map((date) => {
            const trend = moodTrends.find((t) => format(new Date(t.date), 'MM/dd') === date);
            return trend?.intensity || 0;
        });

        return {
            labels: last7Days.map((d) => d.split('/')[1]),
            datasets: [
                {
                    data,
                    color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                    strokeWidth: 3,
                },
            ],
        };
    };

    if (!isPro) {
        return (
            <View style={styles.container}>
                <View style={styles.proPrompt}>
                    <Text style={styles.proEmoji}>📊</Text>
                    <Text style={styles.proTitle}>Insights are a Pro Feature</Text>
                    <Text style={styles.proSubtitle}>
                        Upgrade to Pro to unlock mood trends, theme analysis, weekly summaries, and more.
                    </Text>
                    <Pressable
                        style={styles.upgradeButton}
                        onPress={() => router.push('/settings')}
                    >
                        <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.loadingText}>Analyzing your journal...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Insights</Text>
                <Text style={styles.headerSubtitle}>Your journaling journey at a glance</Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.totalEntries}</Text>
                    <Text style={styles.statLabel}>Total Entries</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Day Streak</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.avgMoodScore}</Text>
                    <Text style={styles.statLabel}>Avg Mood</Text>
                </View>
            </View>

            {/* Mood Trend Chart */}
            {moodTrends.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Mood Trend (Last 7 Days)</Text>
                    <View style={styles.chartContainer}>
                        <LineChart
                            data={getMoodChartData()}
                            width={SCREEN_WIDTH - 40}
                            height={220}
                            chartConfig={{
                                backgroundColor: '#fff',
                                backgroundGradientFrom: '#fff',
                                backgroundGradientTo: '#fff',
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                style: {
                                    borderRadius: 16,
                                },
                                propsForDots: {
                                    r: '6',
                                    strokeWidth: '2',
                                    stroke: '#667eea',
                                },
                            }}
                            bezier
                            style={styles.chart}
                        />
                    </View>
                    <View style={styles.moodLegend}>
                        <Text style={styles.legendText}>1 = Low intensity</Text>
                        <Text style={styles.legendText}>5 = High intensity</Text>
                    </View>
                </View>
            )}

            {/* Weekly Summary */}
            {weeklySummary && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Last Week's Summary</Text>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryText}>{weeklySummary}</Text>
                    </View>
                </View>
            )}

            {/* Top Themes */}
            {topThemes.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Top Themes</Text>
                    <View style={styles.themesContainer}>
                        {topThemes.map((theme, index) => (
                            <View
                                key={theme.tag}
                                style={[
                                    styles.themeTag,
                                    { opacity: 1 - index * 0.08 },
                                ]}
                            >
                                <Text style={styles.themeText}>{theme.tag}</Text>
                                <View style={styles.themeBadge}>
                                    <Text style={styles.themeCount}>{theme.count}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Recent Moods */}
            {moodTrends.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Moods</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {moodTrends.slice(-10).reverse().map((trend, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.moodCard,
                                    { backgroundColor: trend.color + '20' },
                                ]}
                            >
                                <Text style={styles.moodCardDate}>
                                    {format(new Date(trend.date), 'MMM d')}
                                </Text>
                                <Text style={styles.moodCardEmoji}>
                                    {moodTrends.find((m) => m.date === trend.date)?.mood || '😊'}
                                </Text>
                                <View style={styles.moodCardIntensity}>
                                    {Array(trend.intensity)
                                        .fill('•')
                                        .map((_, j) => (
                                            <Text key={j} style={styles.moodDot}>
                                                •
                                            </Text>
                                        ))}
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    content: {
        paddingBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#666',
    },
    statsGrid: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#667eea',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 16,
    },
    chartContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    moodLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingHorizontal: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#666',
    },
    summaryCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    summaryText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
    },
    themesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    themeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    themeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    themeBadge: {
        backgroundColor: '#667eea',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    themeCount: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    moodCard: {
        width: 100,
        padding: 16,
        borderRadius: 16,
        marginRight: 12,
        alignItems: 'center',
    },
    moodCardDate: {
        fontSize: 12,
        color: '#666',
        marginBottom: 8,
    },
    moodCardEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    moodCardIntensity: {
        flexDirection: 'row',
        gap: 2,
    },
    moodDot: {
        fontSize: 16,
        color: '#667eea',
    },
    proPrompt: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    proEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    proTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 8,
    },
    proSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 22,
    },
    upgradeButton: {
        backgroundColor: '#667eea',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});