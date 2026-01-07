import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#667eea',
                tabBarInactiveTintColor: '#999',
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarShowLabel: true,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <TabIcon emoji="🏠" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="journal"
                options={{
                    title: 'Journal',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <TabIcon emoji="📖" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="insights"
                options={{
                    title: 'Insights',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <TabIcon emoji="📊" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <TabIcon emoji="💬" color={color} size={size} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, size }) => (
                        <View style={styles.iconContainer}>
                            <TabIcon emoji="⚙️" color={color} size={size} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const TabIcon = ({ emoji, color, size }: { emoji: string; color: string; size: number }) => {
    return (
        <View style={{ opacity: color === '#667eea' ? 1 : 0.6 }}>
            {/* Using emojis as icons - in production, use icon library */}
            <Text style={{ fontSize: size }}>
                {emoji}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        height: 85,
        paddingBottom: 25,
        paddingTop: 10,
    },
    tabBarLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});