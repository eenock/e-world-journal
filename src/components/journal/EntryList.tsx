import React from 'react';
import { FlatList, StyleSheet, RefreshControl } from 'react-native';
import { EntryCard } from './EntryCard';

interface Entry {
    id: string;
    title?: string;
    content_text?: string;
    entry_date: string;
    mood?: {
        id?: string;
        emoji: string;
        name: string;
        color: string;
    };
    tags: string[];
    is_favorite: boolean;
}

interface EntryListProps {
    entries: Entry[];
    onEntryPress: (entryId: string) => void;
    onToggleFavorite: (entry: Entry) => void;
    refreshing?: boolean;
    onRefresh?: () => void;
    ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
    ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
}

export const EntryList: React.FC<EntryListProps> = ({
    entries,
    onEntryPress,
    onToggleFavorite,
    refreshing = false,
    onRefresh,
    ListHeaderComponent,
    ListEmptyComponent,
}) => {
    const renderItem = ({ item }: { item: Entry }) => (
        <EntryCard
            entry={item}
            onPress={() => onEntryPress(item.id)}
            onToggleFavorite={() => onToggleFavorite(item)}
        />
    );

    return (
        <FlatList
            data={entries}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={ListEmptyComponent}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#667eea"
                    />
                ) : undefined
            }
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        padding: 20,
        paddingBottom: 100,
    },
});